// jobs.js
import { database } from "../script/config.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

// Ambil nama supir dari sessionStorage
const targetSupir = sessionStorage.getItem("username");

// Referensi ke transaksi
const transaksiRef = ref(database, "transaksi");

onValue(transaksiRef, (snapshot) => {
    if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
            const data = childSnapshot.val();

            // Skip jika status selesai
            if (data.status === "selesai") {
                 document.querySelector(".empty-job").style.display = "block";
                 document.querySelector(".active-job").style.display = "none";
                 document.querySelector(".card-footer").style.display = "none";
                return; // skip ke data berikutnya
            }

            // Filter sesuai kondisi
            if (
                (data.status === "disewa" || data.status === "terlambat") &&
                data.jenisSewa === "denganSupir" &&
                data.namasupir === targetSupir
            ) {// Jika kondisi terpenuhi, tampilkan active job
                document.querySelector(".empty-job").style.display = "none";
                document.querySelector(".active-job").style.display = "block";
                document.querySelector(".card-footer").style.display = "block";
                
                // Tampilkan data ke HTML
                document.querySelector(".orderid").textContent = data.orderId;
                document.querySelector(".tanggal").textContent = data.rangeSewa;
                document.querySelector('.nama-penyewa').textContent = data.namaPenyewa;
                // Hitung total pelunasan
                const totalPelunasan = Number(data.pembayaranDiTempat) + Number(data.tarifSupir);

                // Format manual dengan Rp.
                const formattedPelunasan = "Rp. " + totalPelunasan.toLocaleString("id-ID");

                // Tampilkan ke elemen .pelunasan
                document.querySelector(".pelunasan").textContent = formattedPelunasan;
                // Ambil elemen link
                const jemputLink = document.querySelector(".lokasi-jemput-link");

                // Update teks lokasi penjemputan
                const lokasiJemputText = document.querySelector(".lokasi-jemput");

                if (data.lokasiPenjemputan) {
                    lokasiJemputText.textContent = data.lokasiPenjemputan;
                    jemputLink.href = `https://www.google.com/maps/search/${encodeURIComponent(data.lokasiPenjemputan)}`;
                } else {
                    lokasiJemputText.textContent = "Lokasi tidak tersedia";
                    jemputLink.href = "#";
                }

                // Ambil elemen link WhatsApp dan div untuk nomor kontak
                const kontakLink = document.querySelector(".link-kontak");
                const kontakText = document.querySelector(".kontak");

                // Update nama mobil
                document.querySelector(".mobil").textContent = data.namaMobil;

                // Ambil referensi ke 'mobil' di database
                const mobilRef = ref(database, 'mobil');

                onValue(mobilRef, (mobilSnapshot) => {
                    if (mobilSnapshot.exists()) {
                        mobilSnapshot.forEach((mobilChildSnapshot) => {
                            const mobilData = mobilChildSnapshot.val();

                            // Cek jika nama_mobil cocok dengan data.namaMobil
                            if (mobilData.nama_mobil === data.namaMobil) {
                                // Update bahan bakar
                                document.querySelector(".bahan-bakar").textContent = mobilData.bahan_bakar;
                            }
                        });
                    } else {
                        console.log("Tidak ada data mobil.");
                    }
                });

                // Pastikan data.nomorKontak ada dalam data Firebase
                if (data.nomertelephone) {
                    // Format nomor telepon untuk URL (hapus spasi, strip, titik, dll.)
                    const rawNumber = data.nomertelephone.replace(/\D/g, ''); // Hapus semua non-digit

                    // Cek jika diawali 0, ganti dengan 62
                    const formattedNumber = rawNumber.startsWith('0') 
                        ? '62' + rawNumber.slice(1) 
                        : rawNumber;

                    // Update link WhatsApp
                    kontakLink.href = `https://wa.me/${formattedNumber}`;
                    
                    // Update teks kontak
                    kontakText.textContent = data.nomertelephone;
                } else {
                    // Jika nomor tidak ada, beri pesan default
                    kontakText.textContent = "Nomor kontak tidak tersedia";
                    kontakLink.href = "#";
                }

                // Ambil elemen <ul> tujuan
                const tujuanList = document.querySelector(".tujuan-list");

                // Kosongkan dulu isinya biar nggak dobel kalau realtime
                tujuanList.innerHTML = "";

                // Pastikan data.lokasiTujuan itu array
                if (Array.isArray(data.lokasiTujuan)) {
                    data.lokasiTujuan.forEach((tujuan) => {
                        const li = document.createElement("li");
                        li.textContent = tujuan;
                        tujuanList.appendChild(li);
                    });
                } else {
                    // Kalau nggak ada tujuan, kasih info default
                    const li = document.createElement("li");
                    li.textContent = "Tujuan tidak tersedia";
                    tujuanList.appendChild(li);
                }

                // Ambil elemen <ul> untuk dropdown maps
                const dropdownMenu = document.querySelector(".dropdown-menu");

                // Kosongkan dulu biar aman
                dropdownMenu.innerHTML = "";

                // Pastikan data.lokasiTujuan itu array
                if (Array.isArray(data.lokasiTujuan)) {
                    data.lokasiTujuan.forEach((tujuan) => {
                        // Buat <li>
                        const li = document.createElement("li");

                        // Buat <a>
                        const a = document.createElement("a");
                        a.className = "dropdown-item d-flex justify-content-between align-items-center";
                        a.href = `https://www.google.com/maps/search/${encodeURIComponent(tujuan)}`;
                        a.target = "_blank";
                        a.textContent = tujuan;

                        // Buat icon
                        const icon = document.createElement("i");
                        icon.className = "fas fa-map-marker-alt";

                        // Masukkan icon ke dalam <a>
                        a.appendChild(icon);

                        // Masukkan <a> ke dalam <li>
                        li.appendChild(a);

                        // Masukkan <li> ke dalam <ul>
                        dropdownMenu.appendChild(li);
                    });
                } else {
                    // Kalau tidak ada data, kasih satu item default
                    const li = document.createElement("li");
                    li.innerHTML = `<a class="dropdown-item text-muted">Tidak ada tujuan tersedia</a>`;
                    dropdownMenu.appendChild(li);
                }

                /// Update status badge
                const statusBadge = document.querySelector(".status");
                statusBadge.textContent = data.status.charAt(0).toUpperCase() + data.status.slice(1); // Kapitalisasi huruf pertama

                // Hapus class lama dari badge
                statusBadge.classList.remove("bg-success", "bg-danger");

                // Ambil elemen alert
                const statusAlert = document.querySelector(".status-alert");

                // Hapus class lama dari alert
                statusAlert.classList.remove("alert-info", "alert-success", "alert-danger");

                if (data.status === "disewa") {
                    statusBadge.classList.add("bg-success");
                    statusAlert.classList.add("alert-success"); // ganti warna alert
                } else if (data.status === "terlambat") {
                    statusBadge.classList.add("bg-danger");
                    statusAlert.classList.add("alert-danger"); // ganti warna alert
                } else {
                    // Jika status lain, bisa default ke info
                    statusAlert.classList.add("alert-info");
                }
            } else {
                document.querySelector(".empty-job").style.display = "block";
                document.querySelector(".active-job").style.display = "none";
                document.querySelector(".card-footer").style.display = "none";
            }
        });
    } else {
        console.log("Tidak ada data transaksi.");
         document.querySelector(".empty-job").style.display = "block";
         document.querySelector(".active-job").style.display = "none";
         document.querySelector(".card-footer").style.display = "none";
    }
});
