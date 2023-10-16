const dotenv = require('dotenv');
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

// Cargar las variables de entorno
dotenv.config();

// Inicializar la aplicación de Firebase
initializeApp({
  credential: applicationDefault(),
});

// Obtener instancias de Firestore y Auth
const db = getFirestore();
const auth = getAuth();

module.exports = { db, auth };
