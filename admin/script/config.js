// config.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js';

const firebaseConfig = {
    apiKey: "AIzaSyCzTvQrtyFVd8gfxMDPenmhiOCD32QLIHk",
    authDomain: "drivego-f833b.firebaseapp.com",
    databaseURL: "https://drivego-f833b-default-rtdb.firebaseio.com",
    projectId: "drivego-f833b",
    storageBucket: "drivego-f833b.firebasestorage.app",
    messagingSenderId: "296648552361",
    appId: "1:296648552361:web:985acfc9a369b3f3841eb8",
    measurementId: "G-6YE8Z8FDL4"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Ekspor database untuk digunakan di file lain
export { database };
