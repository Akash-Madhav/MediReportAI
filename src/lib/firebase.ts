import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDx9mhWylbNwt9cCB2FiKrvWU7tTD-5-z8",
  authDomain: "medir-a6f0a.firebaseapp.com",
  projectId: "medir-a6f0a",
  storageBucket: "medir-a6f0a.firebasestorage.app",
  messagingSenderId: "153917471576",
  appId: "1:153917471576:web:4801742c7163e3ec46032d",
  measurementId: "G-WFPWZLW9R8",
  databaseURL: "https://medir-a6f0a-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
// Explicitly pass the databaseURL to getDatabase to ensure correct connection
const db = getDatabase(app, firebaseConfig.databaseURL);

export { app, auth, db };
