const puppeteer = require("puppeteer");
const fs = require("fs");

async function App() {
  const browser = await puppeteer.launch({
    executablePath:
      "C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe",
    headless: false,
  });
  const page = await browser.newPage();

  await page.goto("https://www.newark.com/browse-for-products");

  await page.waitForSelector(".categoryContainer");

  const categories = await page.evaluate(() => {
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

  //console.log(categories);

  for (const category of categories) {
    for (let i = category.subcategories.length - 1; i >= 0; i--) {
      const subcategory = category.subcategories[i];
      /* 
        PARA RESOLVER PROBLEMA DE SUBCATEGORIAS EXTENDIDAS: 
        1) Hacer goto a href de subcategory
        2) Hacer evaluate a pagina de subcategory
        3) Verificar si existe contenedor principal "paraSearch", si no existe, es porque es un producto.
        4) Si existe un elemento tabla en contenedor principal, significa que no tiene mas subcategorias. href se deja tal cual.
        5) Si no existe un elemento tabla en contenedor principal, significa que tiene mas subcategorias. Se debe reemplazar href 
          de subcategoria actual con los href de las sub-subcategorias.
      */
      await page.goto(subcategory);
      /*page.evaluate retornara un arreglo de href (nuevas subcategorias) 
      si es que existen mas subcategorias. En caso contrario retornara null.*/
      const moreSubCategories = await page.evaluate(() => {
        const mainContainer = document.getElementById("paraSearch");
        if (mainContainer) {
          const tableExists = mainContainer.querySelector("table");
          if (tableExists) {
            return null;
          } else {
            const nav = mainContainer.querySelector("nav");
            const items = nav.querySelectorAll("li");
            const newSubCategories = [];

            items.forEach((item) => {
              const divContainer = item.querySelector(".productName");
              const a_element = divContainer.querySelector("a");
              newSubCategories.push(a_element.getAttribute("href"));
            });

            return newSubCategories;
          }
        } else {
          //verificar si es un producto
          return null;
        }
      });

      if (moreSubCategories) {
        //eliminar href de subcategoria actual y agregar href de las sub-subcategorias.
        category.subcategories.splice(i, 1);
        category.subcategories.push(...moreSubCategories);
        console.log(category);
      }
      //generar txt con los links que no tienen tabla, para poder recorrerlos
      //console.log(msg);
      //fs.appendFileSync('linksTable.txt', msg + '\n');

      await new Promise((r) => setTimeout(r, 5000)); // 10000 milisegundos = 10 segundos
    }
  }

  console.log(categories);

  await browser.close();
}

App();
