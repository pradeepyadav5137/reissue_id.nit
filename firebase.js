
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBm11NXccZ6Ni6xhvzG2l1hRJ8uxII18n8",
  authDomain: "re-issue-id-card.firebaseapp.com",
  projectId: "re-issue-id-card",
  storageBucket: "re-issue-id-card.appspot.com",
  messagingSenderId: "118783977199",
  appId: "1:118783977199:web:06a8d0ac00fd0a417fdd1a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
