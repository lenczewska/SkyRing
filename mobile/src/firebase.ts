import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDcl_gDUzN4FIB7AOQma98irul6snJF0cM",
  authDomain: "skyring-58eb9.firebaseapp.com",
  projectId: "skyring-58eb9",
  storageBucket: "skyring-58eb9.firebasestorage.app",
  messagingSenderId: "735579606228",
  appId: "1:735579606228:web:3cb7f86eb6413020a4ff41",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);
