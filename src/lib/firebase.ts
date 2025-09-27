import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  "projectId": "studio-7903526903-e4cdf",
  "appId": "1:836210131551:web:621774412fc8525c8991ea",
  "apiKey": "AIzaSyCXrqE--5kdGbS8VcOlxlOjUd7yzOq68k8",
  "authDomain": "studio-7903526903-e4cdf.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "836210131551"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
