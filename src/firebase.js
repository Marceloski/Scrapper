import dotenv from "dotenv";
// The Cloud Functions for Firebase SDK to create Cloud Functions and triggers.

import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Cargar las variables de entorno
dotenv.config();

// Inicializar la aplicación de Firebase
initializeApp({
  credential: applicationDefault(),
});

// Obtener instancias de Firestore y Auth
export const db = getFirestore();
export const auth = getAuth();

