import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDWjuY8S1E-5GMX6pCmHIQ5arbfcYpLEvw",
  authDomain: "lanusdigital-292fc.firebaseapp.com",
  projectId: "lanusdigital-292fc",
  storageBucket: "lanusdigital-292fc.firebasestorage.app",
  messagingSenderId: "211479742852",
  appId: "1:211479742852:web:3f593aad2c98cd5641b5d1",
  measurementId: "G-0HDFK5QBXC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export { app, db, auth, storage, analytics };
