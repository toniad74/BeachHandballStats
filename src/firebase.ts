import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDxuWf6jVgKLqOouHm9Ubi8vEMhjePagT0",
  authDomain: "beachhandball-stats.firebaseapp.com",
  projectId: "beachhandball-stats",
  storageBucket: "beachhandball-stats.firebasestorage.app",
  messagingSenderId: "862815970385",
  appId: "1:862815970385:web:0cf01cd50ed4480fda4470",
  measurementId: "G-K0KH24TZSW",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
