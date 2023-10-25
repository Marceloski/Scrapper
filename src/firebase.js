import dotenv from "dotenv";
// The Cloud Functions for Firebase SDK to create Cloud Functions and triggers.
import { logger } from "firebase-functions";
import { onRequest } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";

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
