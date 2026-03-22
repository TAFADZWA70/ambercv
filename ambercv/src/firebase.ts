import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";


const firebaseConfig = {
    apiKey: "AIzaSyApvpFmzMaQ5Ms1vlCcXGPPh8cyhShwYcU",
    authDomain: "ambesiwe-6e71f.firebaseapp.com",
    projectId: "ambesiwe-6e71f",
    storageBucket: "ambesiwe-6e71f.firebasestorage.app",
    messagingSenderId: "15107850676",
    appId: "1:15107850676:web:708243e586d6d34b6272e1",
    databaseURL: "https://ambesiwe-6e71f-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);


export const db = getDatabase(app);

export default app;