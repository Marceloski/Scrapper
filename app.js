const puppeteer = require("puppeteer");
const fs = require("fs");

// async function getTableHeadElements(page) {
//   return await page.evaluate(() => {
//     const mainContainer = document.getElementById("paraSearch");
//     const tableElement = mainContainer.querySelector("table");
//     const tableHead = tableElement.querySelector("thead");
//     const tableHeadRow = tableHead.querySelector("tr");
//     const tableHeadElements = tableHeadRow.children;
//     const tableHeadElementsData = [];

//     for (let i = 1; i < tableHeadElements.length; i++) {
//       const tableHeadElement = tableHeadElements[i];

//       tableHeadElementsData.push(tableHeadElement.textContent.trim());
//     }

//     return tableHeadElementsData;
//   });
// }

async function getProductData(page) {
  //recuperar datos
}

async function getProductDataFromTable(page) {
  //recorrer cada tabla

  //recorrer cada producto en tabla
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
      const subcategoryProductsCollection = [];

      //entra en subcategoria
      await page.goto(subcategory);

      //revisa si subcategoria tiene sub-subcategorias
      const hasMoreSubCategories = await checkHasMoreSubCategories(page);

      //Si tiene mas subcategorias
      if (hasMoreSubCategories) {
        // Se recuperan las nuevas subcategorias
        const newSubcategories = await getSubcategories(page);

        //recorrer nuevas subcategorias
        for (const newSubcategory of newSubcategories) {
          //ir a pagina de subcategoria
          await page.goto(newSubcategory);

          //recuperar datos de productos en subcategoria
          subcategoryProductsCollection.push(
            //recupera los datos de productos que estan en la tabla
            await getProductDataFromTable(page)
          );

          await new Promise((r) => setTimeout(r, 3000));
        }
      } else {
        //Si no tiene mas subcategorias
        if (!hasMoreSubCategories) {
          //recuperar datos de productos en subcategoria
          subcategoryProductsCollection.push(
            //recupera los datos de productos que estan en la tabla
            await getProductDataFromTable(page)
          );
        //si hasMoreSubCategories es null
        } else {
          //verificar si es producto, recuperar datos de el
        }
      }
      categoryProductsCollection.push(subcategoryProductsCollection);
      await new Promise((r) => setTimeout(r, 3000));
    }
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
    //debugger; // Pause execution here

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

  console.log(categoriesCollection);
  //console.log(productsCollection);

  await browser.close();
}

App();
