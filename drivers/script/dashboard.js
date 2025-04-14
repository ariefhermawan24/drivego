import { database } from "../script/config.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

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
    document.getElementById("jumlah-penyewa").textContent = totalPenyewa;
});

// Ambil data user untuk menghitung jumlah supir
onValue(usersRef, (snapshot) => {
    const data = snapshot.val();
    let totalSupir = 0;

    if (data) {
        Object.values(data).forEach(user => {
            if (user && user.role === "drivers") {
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

// Ambil nama supir dari sessionStorage
const targetSupir = sessionStorage.getItem("username");

// Inisialisasi database
const db = getDatabase();
const transaksiRef = ref(db, "transaksi");

// Langsung pakai onValue untuk listen perubahan data
onValue(transaksiRef, (snapshot) => {
    let rentalAktif = 0;
    let totalSewaDiselesaikan = 0;

    snapshot.forEach((childSnapshot) => {
        const transaksi = childSnapshot.val();

        if (transaksi.namasupir === targetSupir) {
            if (transaksi.status === "disewa") {
                rentalAktif++;
            } else if (transaksi.status === "selesai") {
                totalSewaDiselesaikan++;
            }
        }
    });

    // Update text content di HTML
    document.getElementById("rental-aktif").textContent = rentalAktif;
    document.getElementById("total-sewa").textContent = totalSewaDiselesaikan;
});
