/* 
Scrapper.js es un script que se añadira al codigo final dentro de la aplicacion web local de la empresa "Tryall"
este script funciona bajo la pagina mouser, y actualmenten no funciona para ninguna otra utilizando Brave Browser para ser ejecutada y evitar sistema antibot de mouser
Se necesita npm install, npm install puppeteer

La logica de este script de puppeteer es la siguiente
ArregloNavegacion contendra todos los links directos de las categorias y subcategorias existentes para luego ser recorridos hasta que no quede ninguno

se usara la funcion page.goto() para recorrer todos y cada una de las paginas y categorias existentes.

luego se utilizara la funcion ExtraerDatos(NumeroArticulo) para extraer los datos de la primera pagina, luego entrara en un loop utilizando como referencia
la existencia del boton siguiente para saber si existe otra pagina la cual extraer los datos de la siguiente.(aun no implementado)

luego existira un ultimo loop donde se utilizara el numero de articulos hasta 20 para extraer los datos de cada articulo (aun no implementado)

Luego se implementara una funcion para enviar los datos a firebase

ExtraerDatos solo trabaja para 1 articulo directo, pero funciona bien (pensando en utilizar el link personal y no el de la tabla para hacer la extraccion de datos)


*/
import puppeteer from 'puppeteer';


async function App(){
    const browser = await puppeteer.launch({
      //executablePath: ('/usr/bin/brave-browser.exe'), //para version de prod
      executablePath: ('C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe'),
      headless:false,
    });
    const page = await browser.newPage();
    
    // const xCoord = 32.84; // Cambia esto a la coordenada X deseada
    // const yCoord = 32.16; // Cambia esto a la coordenada Y deseada //uso para conseguir un click deseado en una coordenada
    
    await page.goto('https://www.mouser.cl/c/semiconductors/integrated-circuits-ics/');
    await page.click('a#lnkPager_2');
    

    let arregloInformacion = [link, precio, Descripcion, marca, categoria, subcategoria];
   // const arregloNavegacion []; hacer y llenar arreglo navegacion sobre todas las categorias
    while(arregloNavegacion = NULL){
      await page.goto('https://www.mouser.cl/c/semiconductors/integrated-circuits-ics/'); //PaginaCentral
      await page.click(arregloNavegacion);
      ExtraerDatos();
      while(lnkPager_lnkNext = null){
        await page.click('lnkPager_lnkNext');
        ExtraerDatos();
      }

    }

    //await page.mouse.click(xCoord, yCoord);
   
    console.log(arregloInformacion);
    await browser.close();
}
App();
function ExtraerDatos(NumeroArticulo){
  //hacer funcion para traer llenado de antes el nombre de la categoria (la cual en mouser tiene varias subcategorias de conductores)
  const elemento1 = document.querySelector('lnkMfrPartNumber_1'); //link
  const dato1 = elemento1.textContent.trim(); 
  const elemento2 = document.querySelector('lblPrice_1_1'); //Precio
  const dato2 = elemento2.textContent.trim();
   const elemento3 = document.querySelector('"column desc-column hide-xsmall"');//nombre
 const dato3 = elemento3.textContent.trim();
  const elemento4 = document.querySelector('lnkSupplierPage_1'); //fabricante
  const dato4 = elemento4.textContent.trim();
  const elemento5 = document.querySelector(''); //categoria
  const dato5 = elemento5.textContent.trim();
  const elemento6 = document.querySelector('refine-category-txt'); //subcategoria
  const dato6 = elemento6.textContent.trim();
  return almacenarDatos(dato1, dato2,dato3,dato4,dato5,dato6);
  //no se si añadir la cantidad de existencias de la pagina
}

function almacenarDatos(link, precio, proveedor, marca, categoria, subcategoria) {
  const arregloInformacion = [link, precio, proveedor, marca, categoria, subcategoria];
  return arregloInformacion;
}
