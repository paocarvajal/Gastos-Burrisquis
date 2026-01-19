// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

// TODO: Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/setup#available-libraries
const firebaseConfig = {
    apiKey: "AIzaSyC1-TOQz33gwIaFv-fUPr5IBAiJoh7HlqU",
    authDomain: "expenses-a7519.firebaseapp.com",
    projectId: "expenses-a7519",
    storageBucket: "expenses-a7519.firebasestorage.app",
    messagingSenderId: "46899781746",
    appId: "1:46899781746:web:318820d01821a95b0862eb",
    measurementId: "G-PXD7MPTJR2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Database Helper Functions
export const saveUserData = async (userId: string, data: any) => {
    try {
        await setDoc(doc(db, "users", userId), data, { merge: true });
        console.log("Document written with ID: ", userId);
        return true;
    } catch (e) {
        console.error("Error adding document: ", e);
        return false;
    }
};

export const loadUserData = async (userId: string) => {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data();
    } else {
        return null;
    }
};
