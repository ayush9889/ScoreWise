import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB_DZvjAAVWzf1RD9FXJXUBG-Tn0PiCFss",
  authDomain: "scorewise-df5db.firebaseapp.com",
  projectId: "scorewise-df5db",
  storageBucket: "scorewise-df5db.firebasestorage.app",
  messagingSenderId: "765931483263",
  appId: "1:765931483263:web:2d3ad52cade5d03b298f4a",
  measurementId: "G-PQL2ZXZXRB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with better error handling and offline support
let db;

try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
} catch (error) {
  console.warn('Failed to initialize Firestore with persistent cache, falling back to default:', error);
  // Fallback to default Firestore initialization
  db = getFirestore(app);
}

export { db };