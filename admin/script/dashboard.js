import { database } from "../script/config.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

// Referensi ke database
const mobilRef = ref(database, "mobil");
const garasiRef = ref(database, "garasi");
const usersRef = ref(database, "users");

function countTransactions() {
  const transaksiRef = ref(database, "transaksi");
  
  onValue(transaksiRef, (snapshot) => {
    let requestRentCount = 0;
    let lateRentCount = 0;

    // Loop melalui semua transaksi
    snapshot.forEach((childSnapshot) => {
      const transaction = childSnapshot.val();
      
      // Hitung Request Rent (pending)
      if (transaction.status === "pending") {
        requestRentCount++;
      }
      
      // Hitung Late Rent (terlambat)
      if (transaction.status === "terlambat") {
        lateRentCount++;
      }
    });

    // Update tampilan
    document.getElementById('request-rent').textContent = requestRentCount;
    document.getElementById('late-rent').textContent = lateRentCount;
    
  }, (error) => {
    console.error("Error reading data: ", error);
    document.getElementById('request-rent').textContent = 0;
    document.getElementById('late-rent').textContent = 0;
  });
}

// Panggil fungsi untuk pertama kali
countTransactions();

onValue(mobilRef, (snapshot) => {
    const data = snapshot.val();
    let totalMobil = 0;
    let mobilTersedia = 0;
    let mobilTersewa = 0;
    let totalPenyewa = 0;

    if (data) {
        Object.values(data)
            .filter(mobil => mobil !== null) // Filter null dulu
            .forEach((mobil) => {
                totalMobil++;
                if (mobil.status === "tersedia") {
                    mobilTersedia++;
                } else if (mobil.status === "disewa") {
                    mobilTersewa++;
                    totalPenyewa++;
                }
            });
    }
    document.getElementById("jumlah-mobil").textContent = totalMobil;
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

onValue(garasiRef, (snapshot) => {
  const garasiData = snapshot.val();
  
  let jumlahGarasi = 0;
  
  if (garasiData) {
    jumlahGarasi = Object.keys(garasiData).length;
  }
  
  document.getElementById("jumlah-garasi").innerText = jumlahGarasi;
});
