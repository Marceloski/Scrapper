const puppeteer = require("puppeteer");
const fs = require("fs");
const { error } = require("console");

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

async function getProductsLinksInTable(page) {
  return await page.evaluate(() => {
    const mainContainer = document.getElementById("paraSearch");
    const tableElement = mainContainer.querySelector("table");
    const productsRowsInTable = tableElement.querySelectorAll(".productRow ");
    const productsLinksCollection = [];

    productsRowsInTable.forEach((productRow) => {
      const productImageElement = productRow.querySelector(".productImage");
      const a_element = productImageElement.querySelector("a");

      productsLinksCollection.push(a_element.getAttribute("href"));
    });
    return productsLinksCollection;
  });
}

async function getNextPage(page) {
  try {
    await page.waitForSelector(".paginLinks");
    return await page.evaluate(() => {
      const mainContainer = document.querySelector("#paraSearch");
      const paginLinks = mainContainer.querySelector(".paginLinks");
      const paginNextArrow = paginLinks.querySelector(".paginNextArrow");
      const a_element = paginNextArrow.querySelector("a");

      if (paginNextArrow)
        return { value: false, href: a_element.textContent.trim() };
      else return { value: true, href: "" };
    });
  } catch (e) {
    console.log(error);
    throw new Error("Elemento con clase .paginLinks no existe");
  }
}

async function getProductData(page) {
  //recuperar datos
}

async function getProductDataFromTable(page, newSubcategory) {
  await page.goto(newSubcategory);
  let previousPage = newSubcategory;
  //se inicializa nextPage no siendo pagina final
  let nextPage = { isLast: false };
  const productDataFromTable = [];

  while (!nextPage.isLast) {
    //recuperar links de articulos
    const productsLinksCollection = await getProductsLinksInTable(page);
    console.log(productsLinksCollection);

    //recorrer cada link y recuperar datos

    //volver a pagina anterior(tabla)

    //se recupera siguiente pagina
    nextPage = getNextPage(page);

    //si no es pagina final, ir a la siguiente pagina
    if (!nextPage.isLast) {
      await page.goto(nextPage.href);
      previousPage = nextPage.href;
    }
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
      const subcategoryProductsCollection = [];

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
          //agregar datos de productos que se encuentran en subcategoria
          subcategoryProductsCollection.push(
            //recupera los datos de productos que estan en la tabla
            await getProductDataFromTable(page, newSubcategory)
          );

          await new Promise((r) => setTimeout(r, 3000));
        }
      } else {
        //Si no tiene mas subcategorias
        if (!hasMoreSubCategories) {
          //agregar datos de productos que se encuentran en subcategoria
          subcategoryProductsCollection.push(
            //recupera los datos de productos que estan en la tabla
            await getProductDataFromTable(page, subcategory)
          );
          //si es una posible pagina de producto
        } else {
          //verificar si es pagina de producto, recuperar datos de el
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

  //console.log(categoriesCollection);
  //console.log(productsCollection);

  await browser.close();
}

App();
