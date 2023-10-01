const puppeteer = require("puppeteer");
const puppeteerExtra = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteerExtra.use(StealthPlugin());

async function getNextPage(page) {
  try {
    await page.waitForSelector("#paraSearch");
    await page.waitForSelector(".paginLinks");
    return await page.evaluate(() => {
      const mainContainer = document.querySelector("#paraSearch");
      const paginLinks = mainContainer.querySelector(".paginLinks");
      const paginNextArrow = paginLinks.querySelector(".paginNextArrow");

      if (paginNextArrow) {
        const a_element = paginNextArrow.querySelector("a");
        return { isLast: false, href: a_element.getAttribute("href") };
      } else return { isLast: true, href: "" };
    });
  } catch (e) {
    console.log(e);
    //console.log("pagina del error: " + previousPage);
  }
  return null;
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

              productObj.priceFor = priceForElement.textContent.trim();
              break;

            case 6:
              break;

            case 7:
              break;

            default:
              //agregar a descripcion del producto
              break;
          }
        }
        tablePageData.push(productObj);
      }
      return tablePageData;
    }, tableHeadElements);
  } catch (e) {
    console.log(e);
  }
  return;
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
    console.log(e);
  }
  return;
}

async function getProductDataFromTable(page, subcategory) {
  //se inicializa nextPage no siendo pagina final
  let nextPage = { isLast: false };

  const productDataFromTable = [];

  try {
    while (!nextPage.isLast) {
      nextPage = await getNextPage(page);

      if (nextPage != null) {
        const tableHeadElements = await getTableHeadElements(page);
        const tablePageData = await getTablePageData(page, tableHeadElements);
        //console.log(tablePageData);
        if (!nextPage.isLast) {
          await page.goto(nextPage.href);
        }
        productDataFromTable.push(...tablePageData);
      } else {
        throw new Error("nextPage es null");
      }
    }
    //console.log(productDataFromTable);
    console.log(
      "-------- Se termina de recorrer productos en tabla de subcategoria " +
        subcategory +
        " -------- "
    );
    return true;
  } catch (e) {
    console.log("Error en getProductDataFromTable " + subcategory + " " + e);
  }
  return false;
}

async function getSubcategories(page) {
  try {
    return await page.evaluate(() => {
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
    console.log("Error en getSubcategories : " + e);
    throw new Error(e);
  }
}

async function checkHasMoreSubCategories(page) {
  try {
    await page.waitForSelector("#paraSearch");
    return await page.evaluate(() => {
      const mainContainer = document.getElementById("paraSearch");
      if (mainContainer) {
        const tableExists = mainContainer.querySelector("table");
        if (tableExists) {
          // no tiene mas subcategorias (Hay productos)
          return false;
        } else {
          // si tiene mas subcategorias (No hay productos)
          return true;
        }
      }
    });
  } catch (e) {
    console.log("Error en checkHasMoreSubCategories: " + e);
  }
  return false;
}

async function checkIsProductPage(page) {
  try {
    await page.waitForSelector("#paraSearch");
    return await page.evaluate(() => {
      const mainContainer = document.getElementById("paraSearch");
      if (mainContainer) {
        return false;
      }
    });
  } catch (e) {
    console.log("Error en checkIsProductPage: " + e);
  }
  return true;
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
    console.log("Error en applyInStockFilter");
    throw new Error(e);
  }
}

async function getProductsDataFromSubcategory(
  page,
  subcategory,
  isFiltersApplied
) {
  await page.goto(subcategory);

  if (await checkIsProductPage(page)) {
    console.log(
      "-------- Subcategoria " + subcategory + " es pagina de producto --------"
    );
  } else {
    let subcategoryWithFilters = subcategory;
    try {
      if (!isFiltersApplied) {
        subcategoryWithFilters = await applyInStockFilter(subcategory);
        isFiltersApplied = true;
      }
    } catch (e) {
      console.log("Error al aplicar filtros a subcategoria: " + subcategory);
      console.log("Mensaje de error: " + e);
      console.log("Se sigue proceso sin aplicar filtros");
    }
    await page.goto(subcategoryWithFilters);

    if (await checkHasMoreSubCategories(page)) {
      const moreSubcategories = await getSubcategories(page);
      for (const newSubcategory of moreSubcategories) {
        await new Promise((r) => setTimeout(r, 3000));
        await getProductsDataFromSubcategory(
          page,
          newSubcategory,
          isFiltersApplied
        );
      }
    } else {
      await getProductDataFromTable(page, subcategoryWithFilters);
    }
  }
}

async function getAllProductsData(page, categoriesCollection) {
  for (const category of categoriesCollection) {
    for (
      let i = category.subcategories.length - 1;
      i < category.subcategories.length;
      i++
    ) {
      var isFiltersApplied = false;
      await getProductsDataFromSubcategory(
        page,
        category.subcategories[i],
        isFiltersApplied
      );

      //espera para cambiar entre subcategorias
      await new Promise((r) => setTimeout(r, 3000));
    }
    console.log(
      "-------- Se termina de recorrer categoria " +
        category.category +
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
  const categoriesCollection = await getAllCategories(page);

  try {
    await getAllProductsData(page, categoriesCollection);
  } catch (e) {
    console.log("Error al recuperar datos de los productos " + e);
  }

  await browser.close();
}

App();
