import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBqKQRg5Hn6GAzUhEVwPTlM-JwKOZ60y0U",
  authDomain: "medireportai-2c253.firebaseapp.com",
  projectId: "medireportai-2c253",
  storageBucket: "medireportai-2c253.firebasestorage.app",
  messagingSenderId: "261763392897",
  appId: "1:261763392897:web:5029020882f6c639b13480",
  measurementId: "G-T8H52Z202K",
  databaseURL: "https://medireportai-2c253-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
// Explicitly pass the databaseURL to getDatabase
const db = getDatabase(app, firebaseConfig.databaseURL);

export { app, auth, db };
