import puppeteer from 'puppeteer';


async function App(){
    const browser = await puppeteer.launch({
      //executablePath: ('C:/Program Files/Google/Chrome/Application/Chrome.exe'),
      executablePath: ('C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe'),
      headless:false,
    });
    const page = await browser.newPage();
   // const xCoord = 32.84; // Cambia esto a la coordenada X deseada
  //const yCoord = 32.16; // Cambia esto a la coordenada Y deseada
    
    await page.goto('https://www.mouser.cl/c/semiconductors/integrated-circuits-ics/');
    await page.click('a#lnkPager_2');


    let arregloNavegacion[Paginas ]; 
    while(arregloNavegacion = NULL){
      await page.goto('https://www.mouser.cl/c/semiconductors/integrated-circuits-ics/'); //PaginaCentral
      await page.click(arregloNavegacion);
      ExtraerDatos();
      while(lnkPager_lnkNext = null){
        await page.click(lnkPager_lnkNext);
        ExtraerDatos();
      }

    }


    //await page.mouse.click(xCoord, yCoord);
    const elemento1 = document.querySelector('Link de articulo'); 
     const dato1 = elemento1.textContent.trim(); 
     const elemento2 = document.querySelector('Precio '); 
    const dato2 = elemento2.textContent.trim();
     const elemento3 = document.querySelector('Proveedor '); 
     const dato3 = elemento3.textContent.trim();
     const elemento4 = document.querySelector('Marca'); 
     const dato4 = elemento3.textContent.trim();
     const elemento5 = document.querySelector('Categoría'); 
     const dato5 = elemento3.textContent.trim();
     const elemento6 = document.querySelector('SubCategoria'); 
     const dato6 = elemento3.textContent.trim();
    Articulo.push(dato1, dato2, dato3,dato4,dato5,dato6);
    console.log(Articulo);
    await browser.close();
}
App();



