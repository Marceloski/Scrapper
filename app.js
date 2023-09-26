const puppeteer = require("puppeteer");
const fs = require("fs");

async function getProductData(page, subcategory) {
  //entra en subcategoria
  await page.goto(subcategory);
  const mainContainer = getElementById("paraSearch");
  const tableElement = mainContainer.querySelector("table");
  const tableHeader = tableElement.querySelector("thead");
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
          //recuperar datos de productos en subcategoria
          subcategoryProductsCollection.push(
            await getProductData(page, newSubcategory)
          );

          await new Promise((r) => setTimeout(r, 3000));
        }
      } else {
        //Si no tiene mas subcategorias
        if (!hasMoreSubCategories) {
          //recuperar datos
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
