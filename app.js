const puppeteer = require("puppeteer");
const fs = require("fs");
const { error, table } = require("console");

// async function retryPageGoto(page, url, maxRetries = 3) {
//   let retries = 0;
//   while (retries < maxRetries) {
//     try {
//       await page.goto(url);
//       return; // Navigation succeeded, exit the loop
//     } catch (error) {
//       console.error(
//         `Error navigating to ${url}, retrying...` + "(" + retries + ")"
//       );
//       retries++;
//       // You can adjust the delay time between retries as needed
//       await new Promise((r) => setTimeout(r, 3000));
//     }
//   }
//   throw new Error(`Failed to navigate to ${url} after ${maxRetries} retries.`);
// }

// async function getProductsPagesInTable(page) {
//   return await page.evaluate(() => {
//     const mainContainer = document.getElementById("paraSearch");
//     const tableElement = mainContainer.querySelector("table");
//     const productsRowsInTable = tableElement.querySelectorAll(".productRow ");
//     const productsPageCollection = [];

//     productsRowsInTable.forEach((productRow) => {
//       const productImageElement = productRow.querySelector(".productImage");
//       const a_element = productImageElement.querySelector("a");

//       productsPageCollection.push(a_element.getAttribute("href"));
//     });
//     return productsPageCollection;
//   });
// }

// async function getProductData(page) {
//   await page.waitForSelector("#product");
//   console.log("Entra en getProductData");
//   return true;
//   //recuperar datos
// }

// async function getProductDataFromTable(page, subcategory) {
//   if (subcategory) await page.goto(subcategory);
//   //previousPage permite volver a la pagina anterior, despues de haber entrado a la pagina de un producto
//   let previousPage = subcategory;
//   //se inicializa nextPage no siendo pagina final
//   let nextPage = { isLast: false };
//   const productDataFromTable = [];

//   try {
//     while (!nextPage.isLast) {
//       const productsPageCollection = await getProductsPagesInTable(page);

//       // Use a for...of loop to iterate over productsPageCollection
//       for (const productPage of productsPageCollection) {
//         try {
//           await new Promise((r) => setTimeout(r, 500));
//           await retryPageGoto(page, productPage);
//           productDataFromTable.push(await getProductData(page));
//         } catch (error) {
//           console.error(error);
//         }
//       }

//       await page.goto(previousPage);
//       nextPage = await getNextPage(page, previousPage);

//       if (!nextPage.isLast) {
//         await page.goto(nextPage.href);
//         previousPage = nextPage.href;
//       }
//     }
//     console.log(
//       "-------- Se termina de recorrer productos en subcategoria -------- "
//     );
//   } catch (e) {
//     console.log(e);
//   }

//   return true;
// }

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
    return;
    //console.log("pagina del error: " + previousPage);
  }
}

async function getTablePageData(page, tableHeadElements) {
  try {
    await page.waitForSelector("#paraSearch");
    return await page.evaluate((tableHeadElements) => {
      const mainContainer = document.getElementById("paraSearch");
      const tableElement = mainContainer.querySelector("table");
      const tableBodyElement = tableElement.querySelector("tbody");
      const tableRows = tableBodyElement.querySelectorAll(".productRow");
      const tableProductData = [];

      //recorriendo filas de la tabla (recorriendo filas de productos en tabla)
      for (let i = 0; i < tableRows.length; i++) {
        //obteniendo las casillas de una fila
        const tableRowData = tableRows[i].children;
        const productObj = {};

        //se empieza a iterar desde la segunda casilla, ya que la primera esta vacia (recorriendo datos de productos en tabla)
        for (let j = 1; j < tableRowData.length; j++) {
          switch (j) {
            case 1:
              const imgElement = tableRowData[j].querySelector("img");

              productObj[tableHeadElements[j]] =
                imgElement.getAttribute("title");
              productObj.imgSrc = imgElement.getAttribute("data-src");
              break;

            case 2:
              break;

            case 3:
              break;

            case 4:
              break;

            case 5:
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
        tableProductData.push(productObj);
      }

      return tableProductData;
    }, tableHeadElements);
  } catch (e) {
    console.log(e);
    return;
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
    console.log(e);
    return;
  }
}

async function getProductDataFromTable(page) {
  //se inicializa nextPage no siendo pagina final
  let nextPage = { isLast: false };

  const productDataFromTable = [];

  try {
    while (!nextPage.isLast) {
      //espera para cambiar entre paginas de la tabla
      await new Promise((r) => setTimeout(r, 3000));
      nextPage = await getNextPage(page);

      const tableHeadElements = await getTableHeadElements(page);
      const tablePageData = await getTablePageData(page, tableHeadElements);

      if (!nextPage.isLast) {
        await page.goto(nextPage.href);
      }
      productDataFromTable.push(...tablePageData);
    }
    console.log(productDataFromTable);
    console.log(
      "-------- Se termina de recorrer productos en subcategoria -------- "
    );
  } catch (e) {
    console.log(e);
  }

  return true;
}

async function getSubcategories(page) {
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
}

async function checkHasMoreSubCategories(page) {
  //si no existe paraSearch da error y termina codigo
  //await page.waitForSelector("#paraSearch");
  return await page.evaluate(() => {
    const mainContainer = document.getElementById("paraSearch");
    if (mainContainer) {
      const tableExists = mainContainer.querySelector("table");
      if (tableExists) {
        // Hay productos
        return false;
      } else {
        // No hay productos
        return true;
      }
    } else {
      //Es un producto
      return null;
    }
  });
}

async function getAllProducts(page, categoriesCollection) {
  const productsCollection = [];
  for (const category of categoriesCollection) {
    const categoryProductsCollection = [];
    for (const subcategory of category.subcategories) {
      const subcategoriesProductsCollection = [];

      //entra en subcategoria
      await page.goto(subcategory);

      //revisa si subcategoria tiene mas subcategorias
      const hasMoreSubCategories = await checkHasMoreSubCategories(page);

      //Si tiene mas subcategorias
      if (hasMoreSubCategories) {
        // Se recuperan las nuevas subcategorias
        const newSubcategories = await getSubcategories(page);

        //recorrer nuevas subcategorias
        for (const newSubcategory of newSubcategories) {
          //espera para entrar a nuevas subcategorias
          await new Promise((r) => setTimeout(r, 3000));

          await page.goto(newSubcategory);
          const newSubcategoryhasMoreSubCategories =
            await checkHasMoreSubCategories(page);

          //si nueva subcategoria tiene tabla (productos)
          if (!newSubcategoryhasMoreSubCategories) {
            //agregar datos de productos que se encuentran en nueva subcategoria
            subcategoriesProductsCollection.push(
              await getProductDataFromTable(page) //recupera los datos de productos que estan en la tabla
            );
          } else {
            //si es un producto
            if (newSubcategoryhasMoreSubCategories === null) {
              console.log(
                "nueva subcategoria es pagina de producto " + newSubcategory
              );
            }
          }
        }
      } else {
        //Si no tiene mas subcategorias
        if (!hasMoreSubCategories) {
          //agregar datos de productos que se encuentran en subcategoria
          subcategoriesProductsCollection.push(
            await getProductDataFromTable(page) //recupera los datos de productos que estan en la tabla
          );
          //si es una posible pagina de producto
        } else {
          //verificar si es pagina de producto, recuperar datos de ella
          console.log("subcategoria es pagina de producto" + subcategory);
        }
      }
      console.log("-------- Se termina de recorrer subcategoria -------- ");
      categoryProductsCollection.push({
        category: category.category,
        productsCollection: subcategoriesProductsCollection,
      });

      //espera para cambiar entre subcategorias
      await new Promise((r) => setTimeout(r, 3000));
    }
    console.log("-------- Se termina de recorrer categoria -------- ");
    productsCollection.push(categoryProductsCollection);
  }
  return productsCollection;
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
  const browser = await puppeteer.launch({
    executablePath:
      "C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe",
    headless: false,
  });
  const page = await browser.newPage();
  const categoriesCollection = await getAllCategories(page);
  const productsCollection = await getAllProducts(page, categoriesCollection);

  //console.log(categoriesCollection);
  //console.log(productsCollection);

  await browser.close();
}

App();
