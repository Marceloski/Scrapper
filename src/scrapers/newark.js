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
  return categoryMappings[pageCategory] || null;
};

async function uploadProductData(dataCollection, categoryParam) {
  const category = categoryParam.replace(/[^\w\s]/gi, "").replace(/\s+/g, "");
  const firebaseCategory = getProperCategory(category);

  if (firebaseCategory != null) {
    const productsRef = db
      .collection("categories")
      .doc(firebaseCategory)
      .collection("products");

    for (const data of dataCollection) {
      try {
        // Comprobamos si es que existen productos con los datos del producto
        const productsSnapshot = await productsRef
          .where("manufacturer", "==", data.manufacturer)
          .where("manufacturerPartNo", "==", data.manufacturerPartNo)
          .get();

        // Si no hay productos que calzen con los datos
        if (productsSnapshot.empty) {
          const newProductRef = await productsRef.add(data);
          writeLogLine(
            logPath,
            "&&&&&&&& Nuevo producto añadido con ID : " +
              newProductRef.id +
              " en categoria " +
              firebaseCategory +
              " &&&&&&&&"
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
                "&&&&&&&& Datos de proveedores actualizado para el producto: " +
                  productSnapshot.id +
                  " en categoria " +
                  firebaseCategory +
                  " &&&&&&&&"
              );
            }
          });
        }
      } catch (error) {
        writeLogLine(
          logPath,
          "******** Error procesando los datos del producto: " +
            error.message +
            " ********"
        );
      }
    }
  }
}

async function getNextPage(page) {
  const currentURL = await page.url();
  try {
    await page.waitForSelector("#paraSearch");
    await page.waitForSelector(".paginLinks");
    return await page.evaluate(() => {
      try {
        const mainContainer = document.querySelector("#paraSearch");
        const paginLinks = mainContainer.querySelector(".paginLinks");
        const paginNextArrow = paginLinks.querySelector(".paginNextArrow");

        if (paginNextArrow) {
          const aElement = paginNextArrow.querySelector("a");
          return { isLast: false, href: aElement.getAttribute("href") };
        } else return { isLast: true, href: "" };
      } catch (e) {
        throw new Error(e.message);
      }
    });
  } catch (e) {
    throw new Error(" En getNextPage: " + currentURL + " Error: " + e.message);
  }
}

async function getTablePageData(page, tableHeadElements) {
  const currentURL = await page.url();
  try {
    writeLogLine(
      logPath,
      "-------- Obteniendo los datos de productos en: " +
        currentURL +
        " -------- "
    );
    await page.waitForSelector("#paraSearch");
    return await page.evaluate(async (tableHeadElements) => {
      // Simula desplazamiento de página hacia abajo
      await new Promise((resolve) => {
        const scrollInterval = setInterval(() => {
          window.scrollBy(0, 1500); // Ajusta la cantidad de desplazamiento según tus necesidades
        }, 2000); // Intervalo entre desplazamientos en milisegundos

        // Se detiene simulacion
        setTimeout(() => {
          clearInterval(scrollInterval);
          resolve();
        }, 7000);
      });
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
              const imgElement = tableRowData[j].querySelector("img");

              productObj.manufacturerPartNo = imgElement.getAttribute("title");
              productObj.imgSrc = imgElement.getAttribute("data-src");
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
              productObj.manufacturer = manufacturerElement.textContent.trim();
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
    }, tableHeadElements);
  } catch (e) {
    throw new Error(
      "######## Error en getTablePageData " +
        currentURL +
        " Error: " +
        e.message
    );
  }
}

async function getTableHeadElements(page) {
  const currentURL = await page.url();
  try {
    writeLogLine(
      logPath,
      "-------- Obteniendo los encabezados de la tabla de productos en: " +
        currentURL +
        " -------- "
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
      "######## Error en getTableHeadElements " +
        currentURL +
        " Error: " +
        e.message
    );
  }
}

async function getSubcategories(page) {
  const currentURL = await page.url();
  try {
    writeLogLine(
      logPath,
      "-------- Obteniendo más subcategorías de: " + currentURL
    );
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
      "######## Error en getSubcategories " +
        currentURL +
        " Error: " +
        e.message
    );
  }
}

async function checkHasMoreSubcategories(page) {
  const currentURL = await page.url();
  try {
    writeLogLine(
      logPath,
      "-------- Comprobando si " +
        currentURL +
        " tiene más subcategorias -------- "
    );
    await page.waitForSelector("#paraSearch");
    return await page.evaluate(() => {
      const mainContainer = document.getElementById("paraSearch");
      if (mainContainer) {
        const categoryContainer =
          mainContainer.querySelector(".categoryContainer");
        if (categoryContainer) {
          return true;
        }
      }
      return false;
    });
  } catch (e) {
    writeLogLine(
      logPath,
      "######## Error en checkHasMoreSubcategories " +
        currentURL +
        " Error: " +
        e.message
    );
  }
  return false;
}

async function checkHasProductTable(page) {
  const currentURL = await page.url();
  try {
    writeLogLine(
      logPath,
      "-------- Comprobando si " +
        currentURL +
        " tiene tabla de producto -------- "
    );
    await page.waitForSelector("#paraSearch");
    return await page.evaluate(() => {
      const mainContainer = document.getElementById("paraSearch");
      if (mainContainer) {
        const tableExists = mainContainer.querySelector("table");
        if (tableExists) {
          return true;
        }
      }
      return false;
    });
  } catch (e) {
    writeLogLine(
      logPath,
      "######## Error en checkHasProductTable " +
        currentURL +
        " Error: " +
        e.message
    );
  }
  return false;
}

async function checkIsProductPage(page) {
  const currentURL = await page.url();
  try {
    writeLogLine(
      logPath,
      "-------- Comprobando si " +
        currentURL +
        " es página de producto -------- "
    );
    await page.waitForSelector("#bodyContainer");
    return await page.evaluate(() => {
      const mainContainer = document.getElementById("bodyContainer");
      const productSection = mainContainer.querySelector("#product");
      if (productSection) {
        return true;
      }
      return false;
    });
  } catch (e) {
    writeLogLine(
      logPath,
      "######## Error en checkIsProductPage: " +
        currentURL +
        " Error: " +
        e.message
    );
  }
  return false;
}

async function applyInStockFilter(subcategory) {
  if (subcategory.includes("newark.com/c/")) {
    try {
      var regex = /https:\/\/www.newark.com\/c\/([^?]+)/;
      var newString = subcategory.replace(regex, function (match, categories) {
        writeLogLine(
          logPath,
          "-------- Se aplica filtro con stock a " + subcategory + " -------- "
        );
        return (
          "https://www.newark.com/w/c/" + categories + "?range=inc-in-stock"
        );
      });
      return newString;
    } catch (e) {
      throw new Error(
        "######## Error en applyInStockFilter " +
          subcategory +
          " Error: " +
          e.message
      );
    }
  } else {
    try {
      if (subcategory.includes("newark.com/search")) {
        var regex = /\d+/;
        var newString = subcategory.replace(regex, "$&&range=inc-in-stock");
        writeLogLine(
          logPath,
          "-------- Se aplica filtro con stock a " + subcategory + " -------- "
        );
        return newString;
      }
    } catch (e) {
      throw new Error(
        "######## Error en applyInStockFilter " +
          subcategory +
          " Error: " +
          e.message
      );
    }
  }
}

async function getProductDataFromTable(page, subcategory, category) {
  //se inicializa nextPage no siendo pagina final
  let nextPage = { isLast: false };

  const currentURL = await page.url();
  const productDataFromTable = [];

  try {
    //itera sobre las paginas de una tabla
    writeLogLine(
      logPath,
      "-------- Iterando en tabla de " + subcategory + " -------- "
    );
    while (!nextPage.isLast) {
      nextPage = await getNextPage(page);

      if (nextPage) {
        const tableHeadElements = await getTableHeadElements(page);
        //obtiene los datos de productos de la tabla
        const tablePageData = await getTablePageData(page, tableHeadElements);
        //sube los datos a firebase
        if (tablePageData.length != 0) {
          await uploadProductData(tablePageData, category)
            .then()
            .catch((e) => {
              throw new Error(
                "######## Error en uploadProductData " +
                  currentURL +
                  " Error: " +
                  e.message
              );
            });
        }
        //console.log(tablePageData);
        if (!nextPage.isLast) {
          await new Promise((r) => setTimeout(r, 5000));
          await page.goto(nextPage.href);
        }
        productDataFromTable.push(...tablePageData);
      }
    }
    writeLogLine(
      logPath,
      "-------- Se termina de recorrer productos en tabla de subcategoria " +
        subcategory +
        " -------- "
    );
    //se simula retorno de datos
    return true;
  } catch (e) {
    throw new Error(
      " Error en getProductDataFromTable " + currentURL + " Error: " + e.message
    );
  }
}

async function getProductsDataFromSubcategory(
  page,
  category,
  subcategoryParam,
  isFiltersApplied
) {
  let subcategory = subcategoryParam;
  const currentURL = await page.url();

  writeLogLine(logPath, "%%%%%%%% Aviso: Intentando entrar en: " + subcategory);
  await page.goto(subcategory);

  if (await checkIsProductPage(page)) {
    writeLogLine(
      logPath,
      "%%%%%%%% Aviso: " + subcategory + " es pagina de producto."
    );
  } else {
    //aplicamos filtros a subcategoria si aun no se han aplicado
    if (!isFiltersApplied) {
      try {
        subcategory = await applyInStockFilter(subcategory);
        isFiltersApplied = true;
        await page.goto(subcategory);
      } catch (e) {
        writeLogLine(
          logPath,
          "######## Error al aplicar filtros a subcategoria: " +
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
        "-------- Página " + currentURL + " tiene tabla de productos --------"
      );
      await getProductDataFromTable(page, subcategory, category)
        .then()
        .catch((e) => {
          writeLogLine(
            logPath,
            "######## Error en getProductsDataFromSubcategory " +
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
            "-------- Página " +
              currentURL +
              " tiene más subcategorías -------- "
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
            "######## Error en getProductsDataFromSubcategory " +
              subcategory +
              " Error: " +
              e.message +
              " Se sigue proceso con siguiente subcategoria."
          );
        }
      } else {
        writeLogLine(
          logPath,
          "%%%%%%%% Aviso:  " +
            subcategory +
            " es página en blanco o no tiene más subcategorías."
        );
      }
    }
  }
}

async function getAllProductsData(page, categoriesCollection) {
  //29
  for (let i = 1; i < categoriesCollection.length; i++) {
    for (let j = 0; j < categoriesCollection[i].subcategories.length; j++) {
      var isFiltersApplied = false;
      await getProductsDataFromSubcategory(
        page,
        categoriesCollection[i].category,
        categoriesCollection[i].subcategories[j],
        isFiltersApplied
      );

      writeLogLine(
        logPath,
        "-------- Se termina de recorrer subcategoria general " +
          categoriesCollection[i].subcategories[j] +
          " -------- "
      );

      //espera para cambiar entre subcategorias
      await new Promise((r) => setTimeout(r, 5000));
    }
    writeLogLine(
      logPath,
      "-------- Se termina de recorrer categoria " +
        categoriesCollection[i].category +
        " -------- "
    );
  }
  return true;
}

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
      writeLogLine(logPath, "%%%%%%%% Aviso: No existe mainContainer");
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
  await page.setViewport({ width: 1920, height: 1080 });

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
        "######## Error al recuperar datos de los productos " + e.message
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
