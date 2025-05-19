import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your Firebase configuration
// Replace these with your actual Firebase project details
const firebaseConfig = {
  apiKey: "AIzaSyAS0j66r1lPbLElzETG-S1bEfTtvYanUrM",
  authDomain: "advice-app-701cd.firebaseapp.com",
  projectId: "advice-app-701cd",
  storageBucket: "advice-app-701cd.firebasestorage.app",
  messagingSenderId: "137761398284",
  appId: "1:137761398284:web:fbd63bd9f7745a4d785829",
  measurementId: "G-8TD0J1317Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const provider = new GoogleAuthProvider();

export default app; 