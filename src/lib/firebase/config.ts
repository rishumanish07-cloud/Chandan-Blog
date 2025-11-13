import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBcyHtSEnybdYnyYrcaPUtpSwXjuAQFRVo",
  authDomain: "chandanblog-318ea.firebaseapp.com",
  projectId: "chandanblog-318ea",
  storageBucket: "chandanblog-318ea.firebasestorage.app",
  messagingSenderId: "162169384018",
  appId: "1:162169384018:web:5381ee2c8c9355a214438b",
  measurementId: "G-Q64FT0Q3K1"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
