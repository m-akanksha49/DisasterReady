// Import Firebase core
import { initializeApp } from "firebase/app";

// 🔐 Auth
import { getAuth } from "firebase/auth";

// 🔥 ADD THIS (Firestore)
import { getFirestore } from "firebase/firestore";

// Your config (keep as it is)
const firebaseConfig = {
  apiKey: "AIzaSyAbqgMeJVEYwSQWhsKmZdaNwH6S_UsAPV0",
  authDomain: "disasterready-e8597.firebaseapp.com",
  projectId: "disasterready-e8597",
  storageBucket: "disasterready-e8597.firebasestorage.app",
  messagingSenderId: "881186177728",
  appId: "1:881186177728:web:cbbff70a5ee20fa23ce325",
  measurementId: "G-T0LLC3NT0D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Auth
export const auth = getAuth(app);

// 🔥 ADD THIS (THIS FIXES YOUR ERROR)
export const db = getFirestore(app);