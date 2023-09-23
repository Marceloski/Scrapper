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
    //armar arreglo de objetos
    const categoriesCollection = [];

    if (mainContainer) {
      const categories = mainContainer.children;
      Array.from(categories).forEach((category) => {
        const nav = category.querySelector("nav");
        const items = nav.querySelectorAll("li");
        const itemsList = [];
        let h2 = category.querySelector("h2");

        items.forEach((item) => {
          const a_element = item.querySelector("a");
          itemsList.push(a_element.textContent.trim());
        });

        categoriesCollection.push({
          category: h2.textContent.trim(),
          items: itemsList,
        });
      });
    } else {
      console.log("No existe mainContainer");
    }
    //debugger; // Pause execution here
    return categoriesCollection;
  });

  console.log(categories);

  // await page.goto("https://www.mouser.cl/electronic-components/");

  // await page.waitForSelector("#tblSplitCategories");

  // const categories = await page.evaluate(() => {
  //   const mainContainer = document.getElementById("tblSplitCategories");

  //   if (mainContainer) {
  //     const categories = mainContainer.children;
  //     Array.from(categories).forEach((category) => {
  //       let h2 = category.querySelector("h2");
  //       console.log(h2.textContent.trim());
  //     });
  //   } else {
  //     console.log("No existe mainContainer");
  //   }
  //   debugger; // Pause execution here
  // });

  // console.log(categories);

  await browser.close();
}

App();
