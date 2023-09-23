const puppeteer = require("puppeteer");

async function App() {
  const browser = await puppeteer.launch({
    executablePath:
      "C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe",
    headless: false,
  });
  const page = await browser.newPage();

  await page.goto("https://www.mouser.cl/electronic-components/");

  await page.waitForSelector("#tblSplitCategories");

  await page.evaluate(() => {
    const mainContainer = document.getElementById("tblSplitCategories");

    if (mainContainer) {
      const categories = mainContainer.children;
      Array.from(categories).forEach((category) => {
        let h2 = category.querySelector("h2");
        console.log(h2.textContent.trim());
      });
    } else {
      console.log("No existe mainContainer");
    }
    debugger; // Pause execution here
  });

  await browser.close();
}

App();
