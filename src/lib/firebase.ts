import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  "projectId": "studio-7903526903-e4cdf",
  "appId": "1:836210131551:web:621774412fc8525c8991ea",
  "apiKey": "AIzaSyCXrqE--5kdGbS8VcOlxlOjUd7yzOq68k8",
  "authDomain": "studio-7903526903-e4cdf.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "836210131551",
  "databaseURL": "https://studio-7903526903-e4cdf-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getDatabase(app);

export { app, auth, db };
