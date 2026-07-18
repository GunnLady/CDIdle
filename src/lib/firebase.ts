import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuration loaded from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyAKkG98AvhQh-_9HsjDDELobvEyr9IftBs",
  authDomain: "majestic-fragment-0jlsj.firebaseapp.com",
  projectId: "majestic-fragment-0jlsj",
  storageBucket: "majestic-fragment-0jlsj.firebasestorage.app",
  messagingSenderId: "1002054909655",
  appId: "1:1002054909655:web:a037c95fed75fd4212fa92"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore on the custom database id
export const db = getFirestore(app, "ai-studio-816036e6-d0e7-466c-96c3-50e874ec98eb");

export default app;
