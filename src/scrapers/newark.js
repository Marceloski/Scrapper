import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import {
  writeLogLine,
  createLog,
  setLogName,
  createLogDir,
  setLogPath,
} from "../logWriter.js";
import { db } from "../firebase.js";

puppeteerExtra.use(StealthPlugin());

//Configuracion de logs
createLogDir();
const logPath = setLogPath(setLogName("newark"));

/**
 * Obtiene la categoría adecuada a partir de una categoría de página.
 *
 * @param {string} pageCategory - La categoría de la página.
 * @returns {string | null} La categoría correspondiente o null si no se encuentra.
 */
const getProperCategory = (pageCategory) => {
  const categoryMappings = {
    EnclosuresRacksCabinets: "Bricolaje",
    BatteriesChargers: "Energías",
    AudioVideo: "Electrónica",
    DevelopmentBoardsEvaluationTools: "Electrónica",
    RaspberryPi: "Electrónica",
    SemiconductorsDiscretes: "Electrónica",
    SwitchesRelays: "Electrónica",
    Connectors: "Electrónica",
    OptoelectronicsDisplays: "Electrónica",
    CrystalsOscillators: "Electrónica",
    PassiveComponents: "Electrónica",
    SensorsTransducers: "Sensores",
    LEDLightingComponents: "Iluminación",
    LightingProducts: "Iluminación",
    AutomationProcessControl: "Automatización e IOT",
    ChemicalsAdhesives: "Herramientas e insumos",
    TestMeasurement: "Herramientas e insumos",
    FastenersMechanical: "Herramientas e insumos",
    ToolsProductionSupplies: "Herramientas e insumos",
    WirelessModulesAdaptors: "RF e inalámbricos",
    Electrical: "Electricidad",
    Transformers: "Electricidad",
    EmbeddedComputersEducationMakerBoards: "Computación",
    SingleBoardComputersMakerEducation: "Computación",
    EngineeringSoftware: "Computación",
    OfficeComputerNetworkingProducts: "Computación",
    Security: "Seguridad",
    StaticControlSiteSafetyCleanRoomProducts: "Seguridad",
    CircuitProtection: "Seguridad",
    PowerLineProtection: "Seguridad",
    CableWireCableAssemblies: "Cableado",
    CoolingThermalManagement: "Administración térmica",
    IndustrialSBCsEmbeddedSystems: "Computación",
    SemiconductorsICs: "Electrónica",
  };
  return categoryMappings[pageCategory] || "Sin categoría";
};

/**
 * Sube datos de productos a Firebase.
 *
 * @param {Array<object>} dataCollection - Colección de datos de productos.
 * @returns {Promise<void>} Promesa que se resuelve cuando se completan las operaciones.
 */
async function uploadProductData(dataCollection) {
  const productsRef = db.collection("products");

  for (const data of dataCollection) {
    try {
      // Comprobamos si es que existen productos con los datos del producto
      const productsSnapshot = await productsRef
        .where("manufacturer", "==", data.manufacturer)
        .where("manufacturerPartNo", "==", data.manufacturerPartNo)
        .limit(1)
        .get();

      // Si no hay productos que calzen con los datos
      if (productsSnapshot.empty) {
        const newProductRef = await productsRef.add(data);
        writeLogLine(
          logPath,
          "Nuevo producto añadido con ID : " +
            newProductRef.id +
            " en categoria " +
            data.productCategory
        );
      } else {
        // Si se encuentran productos que calzen con los datos
        productsSnapshot.docs.forEach(async (productSnapshot) => {
          const productData = productSnapshot.data();

          if (productData.suppliers) {
            // Se comprueba si newark está como proveedor
            const newarkIndex = productData.suppliers.findIndex(
              (supplier) => supplier.supplier === "newark"
            );

            // Si existe newark como proveedor
            if (newarkIndex !== -1) {
              // Reemplazamos los datos para newark
              productData.suppliers[newarkIndex] = data.suppliers[0];
              // Si no existe newark como proveedor
            } else {
              // Añadimos a newark como proveedor
              productData.suppliers.push(data.suppliers[0]);
            }

            // Actualizamos el dato del producto con el arreglo de proveedores actualizado
            await productsRef.doc(productSnapshot.id).update({
              suppliers: productData.suppliers,
            });
            writeLogLine(
              logPath,
              "Datos de proveedores actualizado para el producto: " +
                productSnapshot.id +
                " en categoria " +
                data.productCategory
            );
          }
        });
      }
    } catch (error) {
      writeLogLine(
        logPath,
        "ERROR procesando los datos del producto: " + error.message
      );
    }
  }
}

/**
 * Obtiene los datos de la página de la tabla de productos.
 *
 * @param {import('puppeteer').Page} page - La página de Puppeteer.
 * @param {string[]} tableHeadElements - Los elementos de la cabecera de la tabla.
 * @param {string} categoryParam - Categoría de los productos.
 * @returns {Promise<object[]>} Un arreglo de datos de productos.
 */
async function getTablePageData(page, tableHeadElements, categoryParam) {
  const category = getProperCategory(categoryParam);
  const currentURL = await page.url();
  try {
    writeLogLine(
      logPath,
      "Obteniendo los datos de productos en: " + currentURL
    );
    await page.waitForSelector("#paraSearch");
    return await page.evaluate(
      async (tableHeadElements, category) => {
        // Simula desplazamiento de página hacia abajo
        const scrollInterval = setInterval(() => {
          window.scrollBy(0, 1500); // Cantidad de desplazamiento
        }, 2000); // Intervalo entre desplazamientos en milisegundos

        // Se detiene simulacion
        await new Promise((r) => setTimeout(r, 7000));

        const mainContainer = document.getElementById("paraSearch");
        const tableElement = mainContainer.querySelector("table");
        const tableBodyElement = tableElement.querySelector("tbody");
        const tableRows = tableBodyElement.querySelectorAll(".productRow");
        const tablePageData = [];

        //recorriendo filas de la tabla (recorriendo filas de productos en tabla)
        for (let i = 0; i < tableRows.length; i++) {
          //obteniendo las casillas de una fila
          const tableRowData = tableRows[i].children;
          const productObj = {
            manufacturer: "",
            manufacturerPartNo: "",
            imgSrc: "",
            description: "",
            productCategory: category,
            suppliers: [
              {
                supplier: "newark",
                prices: [],
                stock: [],
                productUrl: "",
              },
            ],
          };

          //se empieza a iterar desde la segunda casilla, ya que la primera esta vacia (recorriendo datos de productos en tabla)
          for (let j = 1; j < tableRowData.length; j++) {
            switch (j) {
              //manufacturerPartNo y imgSrc
              case 1:
                const aElement = tableRowData[j].querySelector("a");
                const imgElement = tableRowData[j].querySelector("img");

                productObj.manufacturerPartNo =
                  imgElement.getAttribute("title");
                productObj.imgSrc = imgElement.getAttribute("data-src");
                productObj.suppliers[0].productUrl =
                  aElement.getAttribute("href");
                break;
              //newarkPartNo
              case 2:
                const skuElement = tableRowData[j].querySelector(".sku");

                productObj.suppliers[0].newarkPartNo =
                  skuElement.textContent.trim();
                break;
              //description y manufacturer
              case 3:
                const descriptionElement =
                  tableRowData[j].querySelector(".productDecription");
                const manufacturerElement =
                  tableRowData[j].querySelector(".manufacturerName");

                productObj.description = descriptionElement.textContent.trim();
                productObj.manufacturer =
                  manufacturerElement.textContent.trim();
                break;
              //stock
              case 4:
                const stockElements =
                  tableRowData[j].querySelectorAll(".enhanceInStkTxt");

                if (stockElements.length > 0) {
                  stockElements.forEach((stockInCountry) => {
                    const singleSpanElement =
                      stockInCountry.querySelector(".inStockBold");

                    if (singleSpanElement) {
                      productObj.suppliers[0].stock.push({
                        country: "us",
                        stock: singleSpanElement.textContent.trim(),
                      });
                    } else {
                      const elementText = stockInCountry.textContent.replace(
                        /\s+/g,
                        ""
                      );
                      const stock = stockInCountry
                        .querySelector("span")
                        .textContent.trim();

                      if (elementText.indexOf("USwarehouse") !== -1) {
                        productObj.suppliers[0].stock.push({
                          country: "us",
                          stock: stock,
                        });
                      } else if (elementText.indexOf("UKStock") !== -1) {
                        productObj.suppliers[0].stock.push({
                          country: "uk",
                          stock: stock,
                        });
                      }
                    }
                  });
                } else {
                  productObj.suppliers[0].stock.length = 0;
                }

                break;
              //priceFor (cantidad que se basa el precio expuesto)
              case 5:
                const priceForElement =
                  tableRowData[j].querySelector(".priceFor");

                productObj.priceFor = priceForElement.textContent
                  .replace(/\s+/g, " ")
                  .trim();
                break;

              case 6:
                const priceElement = tableRowData[j].querySelector(".price");
                const pricesCollection =
                  priceElement.querySelectorAll(".priceBreak");

                for (const priceSpan of pricesCollection) {
                  const quantity = priceSpan.querySelector(".qty");
                  const quantityPrice =
                    priceSpan.querySelector(".qty_price_range");

                  productObj.suppliers[0].prices.push({
                    quantity: quantity.textContent.trim(),
                    price: quantityPrice.textContent.trim(),
                  });
                }
                break;

              case 7:
                //se salta celda de cantidad de producto
                break;

              default:
                //agregar a descripcion extra del producto
                if (tableRowData[j].textContent.trim() === "-") break;
                const objField = tableHeadElements[j - 1]
                  .replace(/[^\w\s]/gi, "")
                  .replace(/\s+/g, "");
                productObj.suppliers[0][objField] =
                  tableRowData[j].textContent.trim();
                break;
            }
          }
          tablePageData.push(productObj);
        }
        return tablePageData;
      },
      tableHeadElements,
      category
    );
  } catch (e) {
    throw new Error(
      "ERROR en getTablePageData " + currentURL + " " + e.message
    );
  }
}

/**
 * Obtiene los elementos de la cabecera de la tabla de productos.
 *
 * @param {import('puppeteer').Page} page - La página de Puppeteer.
 * @returns {Promise<string[]>} Un arreglo de elementos de cabecera de la tabla.
 */
async function getTableHeadElements(page) {
  const currentURL = await page.url();
  try {
    writeLogLine(
      logPath,
      "Obteniendo los encabezados de la tabla de productos en: " + currentURL
    );
    await page.waitForSelector("#paraSearch");
    return await page.evaluate(() => {
      const mainContainer = document.getElementById("paraSearch");
      const tableElement = mainContainer.querySelector("table");
      const tableHead = tableElement.querySelector("thead");
      const tableHeadRow = tableHead.querySelector("tr");
      const tableHeadElements = tableHeadRow.children;
      const tableHeadElementsData = [];

      for (let i = 1; i < tableHeadElements.length; i++) {
        const tableHeadElement = tableHeadElements[i];

        tableHeadElementsData.push(tableHeadElement.textContent.trim());
      }

      return tableHeadElementsData;
    });
  } catch (e) {
    throw new Error(
      "ERROR en getTableHeadElements " + currentURL + " " + e.message
    );
  }
}

/**
 * Obtiene las subcategorías de una página.
 *
 * @param {import('puppeteer').Page} page - La página de Puppeteer.
 * @returns {Promise<string[]>} Un arreglo de subcategorías.
 */
async function getSubcategories(page) {
  const currentURL = await page.url();
  try {
    writeLogLine(logPath, "Obteniendo más subcategorías de: " + currentURL);
    return await page.evaluate(() => {
      const subcategories = [];
      const mainContainer = document.getElementById("paraSearch");
      const nav = mainContainer.querySelector("nav");
      const items = nav.querySelectorAll("li");

      for (const item of items) {
        const divElement = item.querySelector(".productName");
        const aElement = divElement.querySelector("a");
        subcategories.push(aElement.getAttribute("href"));
      }

      console.log(subcategories);
      debugger;
      return subcategories;
    });
  } catch (e) {
    throw new Error(
      "ERROR en getSubcategories " + currentURL + " " + e.message
    );
  }
}

/**
 * Comprueba si la página tiene más subcategorías.
 *
 * @param {import('puppeteer').Page} page - La página de Puppeteer.
 * @returns {Promise<boolean>} `true` si la página tiene más subcategorías, de lo contrario, `false`.
 */
async function checkHasMoreSubcategories(page) {
  const currentURL = await page.url();
  try {
    writeLogLine(
      logPath,
      "Comprobando si " + currentURL + " tiene más subcategorias."
    );

    const paraSearch = await page.$("#paraSearch");

    if (!paraSearch) {
      return false;
    }

    return await page.evaluate(() => {
      const mainContainer = document.getElementById("paraSearch");
      if (mainContainer) {
        const categoryContainer =
          mainContainer.querySelector(".categoryContainer");
        return !!categoryContainer;
      }
      return false;
    });
  } catch (e) {
    writeLogLine(
      logPath,
      "ERROR en checkHasMoreSubcategories " + currentURL + " " + e.message
    );
  }
  return false;
}

/**
 * Comprueba si la página tiene una tabla de productos.
 *
 * @param {import('puppeteer').Page} page - La página de Puppeteer.
 * @returns {Promise<boolean>} `true` si la página tiene una tabla de productos, de lo contrario, `false`.
 */
async function checkHasProductTable(page) {
  const currentURL = await page.url();
  try {
    writeLogLine(
      logPath,
      "Comprobando si " + currentURL + " tiene tabla de producto."
    );

    const paraSearch = await page.$("#paraSearch");

    if (!paraSearch) {
      return false;
    }

    return await page.evaluate(() => {
      const mainContainer = document.getElementById("paraSearch");
      if (mainContainer) {
        const tableExists = mainContainer.querySelector("table");
        return !!tableExists;
      }
      return false;
    });
  } catch (e) {
    writeLogLine(
      logPath,
      "ERROR en checkHasProductTable " + currentURL + " " + e.message
    );
  }
  return false;
}

/**
 * Comprueba si la página es una página de producto.
 *
 * @param {import('puppeteer').Page} page - La página de Puppeteer.
 * @returns {Promise<boolean>} `true` si es una página de producto, de lo contrario, `false`.
 */
async function checkIsProductPage(page) {
  const currentURL = await page.url();
  try {
    writeLogLine(
      logPath,
      "Comprobando si " + currentURL + " es página de producto."
    );

    const bodyContainer = await page.$("#bodyContainer");

    if (!bodyContainer) {
      return false;
    }

    return await page.evaluate(() => {
      const mainContainer = document.getElementById("bodyContainer");
      const productSection = mainContainer.querySelector("#product");
      return !!productSection;
    });
  } catch (e) {
    writeLogLine(
      logPath,
      "ERROR en checkIsProductPage: " + currentURL + " " + e.message
    );
  }
  return false;
}

/**
 * Aplica un filtro de stock a la URL de la subcategoría.
 *
 * @param {string} subcategory - URL de la subcategoría.
 * @returns {string} URL con el filtro de stock aplicado.
 */
function applyInStockFilter(subcategory) {
  if (subcategory.includes("newark.com/c/")) {
    try {
      var regex = /https:\/\/www.newark.com\/c\/([^?]+)/;
      var newString = subcategory.replace(regex, function (match, categories) {
        writeLogLine(logPath, "Se aplica filtro con stock a " + subcategory);
        return (
          "https://www.newark.com/w/c/" + categories + "?range=inc-in-stock"
        );
      });
      return newString;
    } catch (e) {
      throw new Error(
        "ERROR en applyInStockFilter " + subcategory + " " + e.message
      );
    }
  } else {
    try {
      if (subcategory.includes("newark.com/search")) {
        var regex = /\d+/;
        var newString = subcategory.replace(regex, "$&&range=inc-in-stock");
        writeLogLine(logPath, "Se aplica filtro con stock a " + subcategory);
        return newString;
      }
    } catch (e) {
      throw new Error(
        "ERROR en applyInStockFilter " + subcategory + " " + e.message
      );
    }
  }
}

/**
 * Obtiene la siguiente página de productos.
 *
 * @param {import('puppeteer').Page} page - La página de Puppeteer.
 * @returns {Promise<{ isLast: boolean, href: string, accessDenied: boolean }>} Información de la siguiente página.
 */
async function getNextPage(page) {
  const currentURL = await page.url();
  try {
    const paraSearch = await page.$("#paraSearch");

    if (!paraSearch) {
      return { isLast: true, href: currentURL, accessDenied: true };
    }

    await page.waitForSelector(".paginLinks");
    return await page.evaluate(() => {
      try {
        const mainContainer = document.querySelector("#paraSearch");
        const paginLinks = mainContainer.querySelector(".paginLinks");
        const paginNextArrow = paginLinks.querySelector(".paginNextArrow");

        if (paginNextArrow) {
          const aElement = paginNextArrow.querySelector("a");
          return {
            isLast: false,
            href: aElement.getAttribute("href"),
            accessDenied: false,
          };
        } else return { isLast: true, href: "", accessDenied: false };
      } catch (e) {
        throw new Error(
          " En getNextPage: " + currentURL + " Error: " + e.message
        );
      }
    });
  } catch (e) {
    throw new Error(" En getNextPage: " + currentURL + " Error: " + e.message);
  }
}

/**
 * Obtiene datos de productos de una tabla en una subcategoría.
 *
 * @param {import('puppeteer').Page} page - La página de Puppeteer.
 * @param {string} subcategory - URL de la subcategoría.
 * @param {string} category - Categoría de los productos.
 */
async function getProductDataFromTable(page, subcategory, category) {
  //se inicializa nextPage no siendo pagina final
  let nextPage = { isLast: false };

  try {
    //itera sobre las paginas de una tabla
    writeLogLine(logPath, "Iterando en tabla de " + subcategory);
    //mientras la pagina no sea ultima
    while (!nextPage.isLast) {
      const currentURL = await page.url();
      let tablePageData;
      //antes de recuperar datos en la tabla, obtenemos la siguiente pagina
      nextPage = await getNextPage(page);

      //si pagina es de acceso denegado
      if (nextPage?.accessDenied === true) {
        writeLogLine(
          logPath,
          "En página " + nextPage.href + " se denegó el acceso."
        );
        //
      } else {
        const tableHeadElements = await getTableHeadElements(page);

        //obtiene los datos de productos de la tabla
        tablePageData = await getTablePageData(
          page,
          tableHeadElements,
          category.replace(/[^\w\s]/gi, "").replace(/\s+/g, "")
        );

        //sube los datos a firebase
        if (tablePageData.length != 0) {
          await uploadProductData(tablePageData)
            .then()
            .catch((e) => {
              throw new Error(
                "ERROR en uploadProductData " +
                  currentURL +
                  " Error: " +
                  e.message
              );
            });
        }
      }
      //si pagina no es la ultima, cambia a la siguiente pagina
      if (!nextPage.isLast) {
        await new Promise((r) => setTimeout(r, 5000));
        await page.goto(nextPage.href);
      }
    }
    writeLogLine(
      logPath,
      "Se termina de recorrer productos en tabla de subcategoria " + subcategory
    );
    //se simula retorno de datos
    return true;
  } catch (e) {
    throw new Error(
      " ERROR en getProductDataFromTable " +
        subcategory +
        " Error: " +
        e.message
    );
  }
}

/**
 * Obtiene datos de productos de una subcategoría.
 *
 * @param {import('puppeteer').Page} page - La página de Puppeteer.
 * @param {string} category - Categoría de los productos.
 * @param {string} subcategoryParam - URL de la subcategoría.
 * @param {boolean} isFiltersApplied - Indica si se aplicaron filtros.
 */
async function getProductsDataFromSubcategory(
  page,
  category,
  subcategoryParam,
  isFiltersApplied
) {
  let subcategory = subcategoryParam;
  const currentURL = await page.url();

  writeLogLine(logPath, "Aviso: Intentando entrar en: " + subcategory);
  await page.goto(subcategory);

  if (await checkIsProductPage(page)) {
    writeLogLine(logPath, "Aviso: " + subcategory + " es pagina de producto.");
  } else {
    //aplicamos filtros a subcategoria si aun no se han aplicado
    if (!isFiltersApplied) {
      try {
        subcategory = applyInStockFilter(subcategory);
        isFiltersApplied = true;
        await new Promise((r) => setTimeout(r, 5000));
        await page.goto(subcategory);
      } catch (e) {
        writeLogLine(
          logPath,
          "ERROR al aplicar filtros a subcategoria: " +
            subcategory +
            " Error: " +
            e.message +
            " Se sigue proceso sin aplicar filtros"
        );
      }
    }

    if (await checkHasProductTable(page)) {
      writeLogLine(
        logPath,
        "Página " + subcategory + " tiene tabla de productos"
      );
      await getProductDataFromTable(page, subcategory, category)
        .then()
        .catch((e) => {
          writeLogLine(
            logPath,
            "ERROR en getProductsDataFromSubcategory " +
              subcategory +
              " Error : " +
              e.message +
              " Se sigue proceso con siguiente subcategoria"
          );
        });
    } else {
      if (await checkHasMoreSubcategories(page)) {
        try {
          writeLogLine(
            logPath,
            "Página " + currentURL + " tiene más subcategorías"
          );
          const moreSubcategories = await getSubcategories(page);
          for (const newSubcategory of moreSubcategories) {
            await new Promise((r) => setTimeout(r, 5000));
            await getProductsDataFromSubcategory(
              page,
              category,
              newSubcategory,
              isFiltersApplied
            );
          }
        } catch (e) {
          writeLogLine(
            logPath,
            "ERROR en getProductsDataFromSubcategory " +
              subcategory +
              " Error: " +
              e.message +
              " Se sigue proceso con siguiente subcategoria."
          );
        }
      } else {
        writeLogLine(
          logPath,
          "Aviso:  " +
            subcategory +
            " es página en blanco o no tiene más subcategorías."
        );
      }
    }
  }
}

/**
 * Recopila datos de productos de varias categorías y subcategorías en una página web.
 *
 * @param {import('puppeteer').Page} page - La página de Puppeteer.
 * @param {Array<{ category: string, subcategories: Array<string> }>} categoriesCollection - Una colección de categorías y sus subcategorías.
 * @returns {boolean} Retorna true después de recopilar los datos de productos.
 */
async function getAllProductsData(page, categoriesCollection) {
  //29
  for (let i = 0; i < categoriesCollection.length; i++) {
    for (
      let j = categoriesCollection[i].subcategories.length - 1;
      j < categoriesCollection[i].subcategories.length;
      j++
    ) {
      var isFiltersApplied = false;
      await getProductsDataFromSubcategory(
        page,
        categoriesCollection[i].category,
        categoriesCollection[i].subcategories[j],
        isFiltersApplied
      );

      writeLogLine(
        logPath,
        "Se termina de recorrer subcategoria general " +
          categoriesCollection[i].subcategories[j]
      );

      //espera para cambiar entre subcategorias
      await new Promise((r) => setTimeout(r, 5000));
    }
    writeLogLine(
      logPath,
      "Se termina de recorrer categoria " + categoriesCollection[i].category
    );
    await new Promise((r) => setTimeout(r, 5000));
  }
  return true;
}

/**
 * Obtiene todas las categorías y subcategorías.
 *
 * @param {import('puppeteer').Page} page - La página de Puppeteer.
 * @returns {Promise<{ category: string, subcategories: string[] }[]>} Colección de categorías y subcategorías.
 */
async function getAllCategories(page) {
  writeLogLine(logPath, "-------- Obteniendo Categorías -------- ");
  //recuperar categorias y subcategorias
  await page.goto("https://www.newark.com/browse-for-products");
  await page.waitForSelector(".categoryContainer");
  const categoriesCollection = await page.evaluate(() => {
    const mainContainer = document.querySelector(".categoryContainer");
    const categoriesCollection = [];

    if (mainContainer) {
      const categories = mainContainer.children;
      Array.from(categories).forEach((category) => {
        const nav = category.querySelector("nav");
        const items = nav.querySelectorAll("li");
        const subcategories = [];
        let h2 = category.querySelector("h2");

        items.forEach((item) => {
          const a_element = item.querySelector("a");
          subcategories.push(a_element.getAttribute("href"));
        });

        categoriesCollection.push({
          category: h2.textContent.trim(),
          subcategories: subcategories,
        });
      });
    } else {
      writeLogLine(logPath, "Aviso: No existe '.categoryContainer'");
    }
    return categoriesCollection;
  });
  return categoriesCollection;
}

async function App() {
  const browser = await puppeteerExtra.launch({
    ignoreDefaultArgs: ["--enable-automation"],
    executablePath:
      "C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe",
    headless: false,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--disable-infobars",
    ],
  });
  createLog(logPath, "******** Se comienza ejecucion scraping Newark ********");
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.150 Safari/537.36"
  );
  await page.setExtraHTTPHeaders({
    DNT: "1",
  });
  await page.setViewport({ width: 1920, height: 1080 });

  //se ocupa para verificar una pagina en concreto. Si es null el scraper se ejecuta de manera normal.
  const PAGE_TO_VERIFY = null;
  // "https://www.newark.com/search?categoryId=800000282001";

  if (PAGE_TO_VERIFY) {
    console.log(applyInStockFilter(PAGE_TO_VERIFY));
  } else {
    const categoriesCollection = await getAllCategories(page);

    try {
      await getAllProductsData(page, categoriesCollection);
    } catch (e) {
      writeLogLine(
        logPath,
        "Error al recuperar datos de los productos " + e.message
      );
    }
    writeLogLine(
      logPath,
      "******** Se termina ejecucion scraping Newark ********"
    );
  }

  await browser.close();
}

App();
