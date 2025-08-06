import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCnvlriTLbA3Q1IbyciNRgGrGZVzEGw-Ek",
  authDomain: "my--form-app.firebaseapp.com",
  projectId: "my--form-app",
  storageBucket: "my--form-app.firebasestorage.app",
  messagingSenderId: "707055505246",
  appId: "1:707055505246:web:d748d24f93782b829589cf",
  measurementId: "G-0FNLMRQWPP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export default app; 