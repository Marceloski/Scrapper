const puppeteer = require("puppeteer");
const puppeteerExtra = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteerExtra.use(StealthPlugin());

async function getNextPage(page) {
  try {
    await page.waitForSelector("#paraSearch");
    await page.waitForSelector(".paginLinks");
    return await page.evaluate(() => {
      try {
        const mainContainer = document.querySelector("#paraSearch");
        const paginLinks = mainContainer.querySelector(".paginLinks");
        const paginNextArrow = paginLinks.querySelector(".paginNextArrow");

        if (paginNextArrow) {
          const a_element = paginNextArrow.querySelector("a");
          return { isLast: false, href: a_element.getAttribute("href") };
        } else return { isLast: true, href: "" };
      } catch (e) {
        throw new Error(e.message);
      }
    });
  } catch (e) {
    throw new Error("Error en getNextPage " + e.message);
  }
}

async function getTablePageData(page, tableHeadElements) {
  try {
    await page.waitForSelector("#paraSearch");
    return await page.evaluate(async (tableHeadElements) => {
      // Simula desplazamiento de página hacia abajo
      await new Promise((resolve) => {
        const scrollInterval = setInterval(() => {
          window.scrollBy(0, 1500); // Ajusta la cantidad de desplazamiento según tus necesidades
        }, 1000); // Intervalo entre desplazamientos en milisegundos

        // Se detiene simulacion
        setTimeout(() => {
          clearInterval(scrollInterval);
          resolve();
        }, 3000); // 3 segundos
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
        const productObj = {};

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

              productObj.newarkPartNo = skuElement.textContent.trim();
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
                productObj.stock = {};
                stockElements.forEach((stockInCountry) => {
                  const singleSpanElement =
                    stockInCountry.querySelector(".inStockBold");

                  if (singleSpanElement) {
                    productObj.stock.us = singleSpanElement.textContent.trim();
                  } else {
                    const elementText = stockInCountry.textContent.replace(
                      /\s+/g,
                      ""
                    );
                    const stock = stockInCountry
                      .querySelector("span")
                      .textContent.trim();

                    if (elementText.indexOf("USwarehouse") !== -1) {
                      productObj.stock.us = stock;
                    } else if (elementText.indexOf("UKStock") !== -1) {
                      productObj.stock.uk = stock;
                    }
                  }
                });
              } else {
                productObj.stock = "sin stock";
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
              productObj.prices = [];

              for (const priceSpan of pricesCollection) {
                const quantity = priceSpan.querySelector(".qty");
                const quantityPrice =
                  priceSpan.querySelector(".qty_price_range");

                productObj.prices.push({
                  quantity: quantity.textContent.trim(),
                  quantityPrice: quantityPrice.textContent.trim(),
                });
              }
              break;

            case 7:
              //se salta celda de cantidad de producto
              break;

            default:
              //agregar a descripcion extra del producto
              if (tableRowData[j].textContent.trim() === "-") break;
              productObj[tableHeadElements[j - 1]] =
                tableRowData[j].textContent.trim();
              break;
          }
        }
        tablePageData.push(productObj);
      }
      return tablePageData;
    }, tableHeadElements);
  } catch (e) {
    throw new Error("Error en getTablePageData " + e.message);
  }
}

async function getTableHeadElements(page) {
  try {
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
    throw new Error("Error en getTableHeadElements " + e.message);
  }
}

async function getSubcategories(page) {
  try {
    return await page.evaluate(() => {
      debugger;
      const subcategories = [];
      const mainContainer = document.getElementById("paraSearch");
      const nav = mainContainer.querySelector("nav");
      const items = nav.querySelectorAll("li");

      items.forEach((item) => {
        const a_element = item.querySelector("a");
        subcategories.push(a_element.getAttribute("href"));
      });

      return subcategories;
    });
  } catch (e) {
    throw new Error("Error en getSubcategories : " + e.message);
  }
}

async function checkHasMoreSubcategories(page) {
  try {
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
    console.error("Error en checkHasMoreSubcategories: " + e.message);
  }
  return false;
}

async function checkHasProductTable(page) {
  try {
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
    console.error("Error en checkHasProductTable: " + e.message);
  }
  return false;
}

async function checkIsProductPage(page) {
  try {
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
    console.error("Error en checkIsProductPage: " + e.message);
  }
  return false;
}

async function applyInStockFilter(subcategory) {
  try {
    var originalUrl = subcategory;
    var regex = /https:\/\/www.newark.com\/c\/([^?]+)/;
    var newString = originalUrl.replace(regex, function (match, categories) {
      return "https://www.newark.com/w/c/" + categories + "?range=inc-in-stock";
    });
    return newString;
  } catch (e) {
    throw new Error("Error en applyInStockFilter" + e.message);
  }
}

async function getProductDataFromTable(page, subcategory) {
  //se inicializa nextPage no siendo pagina final
  let nextPage = { isLast: false };

  const productDataFromTable = [];

  try {
    //itera sobre las paginas de una tabla
    while (!nextPage.isLast) {
      nextPage = await getNextPage(page);

      if (nextPage) {
        const tableHeadElements = await getTableHeadElements(page);
        //obtiene los datos de productos de la tabla
        const tablePageData = await getTablePageData(page, tableHeadElements);
        //sube los datos a firebase
        console.log(tablePageData);
        if (!nextPage.isLast) {
          await new Promise((r) => setTimeout(r, 1000));
          await page.goto(nextPage.href);
        }
        productDataFromTable.push(...tablePageData);
      }

    }
    //console.log(productDataFromTable);
    console.log(
      "-------- Se termina de recorrer productos en tabla de subcategoria " +
        subcategory +
        " -------- "
    );
    //se simula retorno de datos
    return true;
  } catch (e) {
    throw new Error("Error en getProductDataFromTable " + e.message);
  }
}

async function getProductsDataFromSubcategory(
  page,
  subcategoryParam,
  isFiltersApplied
) {
  let subcategory = subcategoryParam;
  await page.goto(subcategory);

  if (await checkIsProductPage(page)) {
    console.log("Aviso:" + subcategory + " es pagina de producto.");
  } else {
    //aplicamos filtros a subcategoria si aun no se han aplicado
    if (!isFiltersApplied) {
      try {
        subcategory = await applyInStockFilter(subcategory);
        isFiltersApplied = true;
        await page.goto(subcategory);
      } catch (e) {
        console.error(
          "Error al aplicar filtros a subcategoria: " + subcategory
        );
        console.error("Mensaje de error: " + e);
        console.error("Se sigue proceso sin aplicar filtros");
      }
    }

    if (await checkHasProductTable(page)) {
      try {
        await getProductDataFromTable(page, subcategory);
      } catch (e) {
        console.error(
          "Error en getProductsDataFromSubcategory al recuperar los datos de subcategoria " +
            subcategory
        );
        console.error("Mensaje de error: " + e.message);
        console.error("Se sigue proceso con siguiente subcategoria");
      }
    } else {
      if (await checkHasMoreSubcategories(page)) {
        try {
          const moreSubcategories = await getSubcategories(page);
          for (const newSubcategory of moreSubcategories) {
            await new Promise((r) => setTimeout(r, 3000));
            await getProductsDataFromSubcategory(
              page,
              newSubcategory,
              isFiltersApplied
            );
          }
        } catch (e) {
          console.error(
            "Error en getProductsDataFromSubcategory al recuperar otras subcategorias de " +
              subcategory
          );
          console.error("Mensaje de error: " + e.message);
          console.error("Se sigue proceso con siguiente subcategoria");
        }
      } else {
        console.log("Aviso:  " + subcategory + " es pagina en blanco");
      }
    }
  }
}

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
        categoriesCollection[i].subcategories[j],
        isFiltersApplied
      );

      console.log(
        "-------- Se termina de recorrer subcategoria general " +
          categoriesCollection[i].subcategories[j] +
          " -------- "
      );

      //espera para cambiar entre subcategorias
      await new Promise((r) => setTimeout(r, 3000));
    }
    console.log(
      "-------- Se termina de recorrer categoria " +
        categoriesCollection[i].category +
        " -------- "
    );
  }
  return true;
}

async function getAllCategories(page) {
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
      console.log("No existe mainContainer");
    }
    return categoriesCollection;
  });
  return categoriesCollection;
}

async function App() {
  const browser = await puppeteerExtra.launch({
    executablePath:
      "C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe",
    headless: false,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  const categoriesCollection = await getAllCategories(page);

  try {
    await getAllProductsData(page, categoriesCollection);
  } catch (e) {
    console.error("Error al recuperar datos de los productos " + e);
  }

  console.log("******** Se termina ejecucion scraping Newark ********");
  await browser.close();
}

App();
