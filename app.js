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
const puppeteer = require("puppeteer");

async function App() {
  const browser = await puppeteer.launch({
    //executablePath: ('/usr/bin/brave-browser.exe'), //para versión de prod
    executablePath:
      "C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe",
    headless: false,
  });
  const page = await browser.newPage();

  await page.goto("https://www.mouser.cl/electronic-components/");

  // Ahora puedes ejecutar código JavaScript en el contexto de la página web.
  const content = await page.evaluate(() => {
    const contenedor = document.querySelector("#tblSplitCategories");
    const parrafos = contenedor.querySelectorAll("ul");

    // Crear un array para almacenar el contenido de los párrafos
    const paragraphTexts = [];

    // Iterar sobre los párrafos y obtener su contenido de texto
    parrafos.forEach((parrafo) => {
      paragraphTexts.push(parrafo.textContent);
    });

    // Devolver el contenido como resultado
    return paragraphTexts;
  });

  // Imprimir el contenido obtenido
  console.log(content);

  await browser.close();
}

App();