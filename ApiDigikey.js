import  OAuth from "oauth";
async function App(){
  

    // Configuración de OAuth
    const oauth = new OAuth.OAuth2(
      'YIvnS5AiL6eDcYnKsw8yAqU5qA1iHer8',       // Reemplaza con el ID de cliente de tu aplicación
      'I9BUj3UsvOwvIXB6',   // Reemplaza con el secreto de cliente de tu aplicación
      'https://api.digikey.com/v1/oauth2/authorize',  // URL de autorización
      'https://api.digikey.com/v1/oauth2/token', // URL de obtención de token
    );
    
    // URL de autorización
    const authorizationUrl = oauth.getAuthorizeUrl({
      response_type: 'https://sandbox-api.digikey.com/v1/oauth2/authorize/oauth/authorize',
      client_id: 'YIvnS5AiL6eDcYnKsw8yAqU5qA1iHer8', // Alcance de acceso
      redirect_uri: '',
      state: '', // Tipo de respuesta
    });
    
    
    // Después de que el usuario regrese, intercambia el código de autorización por un token de acceso
     const authorizationCode = authorizationUrl; // Reemplaza con el código de autorización obtenido
    console.log(authorizationCode)
    
       const apiUrl = 'https://sandbox-api.digikey.com/SupplyChain/v1/BondedQuantity/Products';
    
      // Define los encabezados requeridos para la solicitud
      const headers = {
        code: '',
        client_id: 'YIvnS5AiL6eDcYnKsw8yAqU5qA1iHer8',
        client_secret: 'I9BUj3UsvOwvIXB6',
        redirect_uri: '',
        grant_type: authorizationCode, 
      };
      
      // Configura la solicitud GET
      const requestOptions = {
        method: 'GET',
        headers: headers,
      };
      
      // Realiza la solicitud GET
      fetch(apiUrl, requestOptions)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Solicitud fallida con estado: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          // Maneja la respuesta exitosa aquí
          console.log('Respuesta exitosa:', data);
        })
        .catch(error => {
          // Maneja los errores aquí
          console.error('Error al realizar la solicitud:', error);
        });
    }
    App();