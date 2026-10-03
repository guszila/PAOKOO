import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyA7RzBN2CiaV8t5qSGEeECN0c-2l7T-kRs",
  authDomain: "paokoo-c470c.firebaseapp.com",
  projectId: "paokoo-c470c",
  storageBucket: "paokoo-c470c.firebasestorage.app",
  messagingSenderId: "295393433955",
  appId: "1:295393433955:web:5ad04ccc3dd6b4f16f9b56",
  measurementId: "G-VWR3VVG066"
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Authentication
export const auth = getAuth(app);

// Initialize Cloud Firestore with multi-tab persistent offline cache (Spark Plan friendly)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
