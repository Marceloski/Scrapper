const puppeteer = require("puppeteer");

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
          hrefValue = a_element.getAttribute("href");
          subcategories.push(hrefValue);
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
    for (const subcategory of category.subcategories) {
      await page.goto(subcategory);
      //verificar si hay mas subcategorias
      const msg = await page.evaluate((subcategory) => {
        const mainContainer = document.getElementById("paraSearch");
        if (mainContainer) {
          const tableExists = mainContainer.querySelector("table");
          if (tableExists) {
            return subcategory + " tiene tabla";
          } else {
            return subcategory + " no tiene tabla";
          }
        } else {
          return "no se encuentra paraSearch en" + subcategory;
        }
      }, subcategory);
      //generar txt con los links que no tienen tabla, para poder recorrerlos
      console.log(msg);

      await new Promise((r) => setTimeout(r, 10000)); // 10000 milisegundos = 10 segundos
    }
  }
  await browser.close();
}

App();
