import { database } from "../script/config.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

// Referensi ke database
const mobilRef = ref(database, "mobil");
const garasiRef = ref(database, "garasi");const usersRef = ref(database, "users");

// Ambil data mobil
onValue(mobilRef, (snapshot) => {
    const data = snapshot.val();
    let totalMobil = 0;
    let mobilTersedia = 0;
    let mobilTersewa = 0;
    let totalPenyewa = 0;

    if (data) {
        Object.values(data)
            .filter(mobil => mobil !== null) // Filter null terlebih dahulu
            .forEach((mobil) => {
                totalMobil++;
                if (mobil.status === "tersedia") {
                    mobilTersedia++;
                } else if (mobil.status === "disewa") {
                    mobilTersewa++;
                    totalPenyewa++; // Asumsi 1 penyewa per mobil yang disewa
                }
            });
    }

    // Update semua elemen DOM
    document.getElementById("jumlah-mobil").textContent = totalMobil;
    document.getElementById("mobil-tersedia").textContent = mobilTersedia;
    document.getElementById("mobil-tersewa").textContent = mobilTersewa;
    document.getElementById("jumlah-penyewa").textContent = totalPenyewa;
});

// Ambil data user untuk menghitung jumlah supir
onValue(usersRef, (snapshot) => {
    const data = snapshot.val();
    let totalSupir = 0;

    if (data) {
        data.forEach((user, index) => {
            if (index !== 0 && user && user.role === "drivers") {  // Mengabaikan elemen pertama (null)
                totalSupir++;
            }
        });
    }

    // Masukkan ke dalam HTML
    document.getElementById("jumlah-supir").textContent = totalSupir;
});

// Fungsi untuk mengambil data garasi dan menghitung jumlahnya
onValue(garasiRef, (snapshot) => {
  const garasiData = snapshot.val();
  
  let jumlahGarasi = 0;
  
  if (garasiData) {
    jumlahGarasi = Object.keys(garasiData).length;
  }
  
  document.getElementById("jumlah-garasi").innerText = jumlahGarasi;
});
