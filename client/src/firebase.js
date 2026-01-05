import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_API_KEY,
    authDomain: import.meta.env.VITE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Optimize Firestore for faster local testing
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

// Re-init with specific settings if needed
export const db = initializeFirestore(app, {
    experimentalForceLongPolling: true, // Fix for some slow corporate/school networks
});
export const storage = getStorage(app);
export const functions = getFunctions(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
    hd: "iare.ac.in" // Force domain if possible, though backend MUST check it.
});

// Detect local environment variable to switch to emulators
if (import.meta.env.VITE_USE_EMULATOR === 'true') {
    console.log("Using Firebase Emulators...");
    connectAuthEmulator(auth, "http://127.0.0.1:9099");
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectStorageEmulator(storage, '127.0.0.1', 9199);
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
}
