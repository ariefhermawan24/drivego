// Inisialisasi Firebase
import {
    initializeApp
} from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js';
import {
    getDatabase,
    ref,
    set,
    onValue,
    get, // 🔥 Tambahkan ini
    child, // 🔥 Tambahkan ini
    update // 🔥 Tambahkan ini untuk memperbarui status mobil
} from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js';

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
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Referensi ke data 'mobil' di Firebase
const mobilRef = ref(database, 'mobil');
const garasiRef = ref(database, 'garasi');

// Container untuk menampilkan daftar mobil
const carcontainer = document.querySelector('.daftar-mobil .row')
const container = document.querySelector('.daftar-garasi .row');
const searchInput = document.getElementById('searchInput'); // Input pencarian
 
const filterGarasi = document.getElementById("filterGarasi");
const filterTipe = document.getElementById("filterTipe");
const filterKursi = document.getElementById("filterKursi");

// Fungsi untuk mengisi dropdown filter
function populateDropdown(ref, dropdown, keyName, property) {
    onValue(ref, (snapshot) => {
        dropdown.innerHTML = `<option selected>Pilih ${keyName}</option>`;
        const values = new Set();

        Object.values(snapshot.val() || {}).forEach((item) => {
            if (item && item[property]) {
                values.add(item[property]); // Tambahkan ke dalam Set untuk menghindari duplikasi
            }
        });

        values.forEach((value) => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = property === "jumlah_tempat_duduk" ? `${value} Kursi` : value;
            dropdown.appendChild(option);
        });
    });
}

// Mengisi dropdown berdasarkan data dari Firebase
populateDropdown(garasiRef, filterGarasi, "Garasi", "nama_tempat");
populateDropdown(mobilRef, filterTipe, "Tipe", "tipe_mobil");
populateDropdown(mobilRef, filterKursi, "Kursi", "jumlah_tempat_duduk");

// Fungsi untuk mencari dan memfilter mobil
function cariMobil() {
    const query = searchInput.value.toLowerCase();
    const selectedGarasi = filterGarasi.value.toLowerCase();
    const selectedTipe = filterTipe.value.toLowerCase();
    const selectedKursi = filterKursi.value;

    onValue(mobilRef, (snapshotMobil) => {
        onValue(garasiRef, (snapshotGarasi) => {
            const dataMobil = snapshotMobil.val();
            const dataGarasi = snapshotGarasi.val();

            const filteredMobil = Object.values(dataMobil || {}).filter((mobil) => {
                const namaMobil = mobil.nama_mobil ? mobil.nama_mobil.toLowerCase() : "";
                const tipeMobil = mobil.tipe_mobil ? mobil.tipe_mobil.toLowerCase() : "";
                const jumlahKursi = mobil.jumlah_tempat_duduk ? String(mobil.jumlah_tempat_duduk) : "";
                
                // Temukan nama garasi berdasarkan ID garasi mobil
                const namaGarasi = dataGarasi && dataGarasi[mobil.id_tempat] ? dataGarasi[mobil.id_tempat].nama_tempat.toLowerCase() : "";

                const cocokNama = query === "" || namaMobil.includes(query);
                const cocokGarasi = selectedGarasi === "pilih garasi" || namaGarasi === selectedGarasi;
                const cocokTipe = selectedTipe === "pilih tipe" || tipeMobil === selectedTipe;
                const cocokKursi = selectedKursi === "Pilih Kursi" || jumlahKursi === selectedKursi;

                return cocokNama && cocokGarasi && cocokTipe && cocokKursi;
            });

            // Tampilkan mobil yang sesuai filter
            tampilkanMobil(filteredMobil, dataGarasi);
        });
    });
}

// Event listener untuk pencarian dan filter
searchInput.addEventListener('input', cariMobil);
filterGarasi.addEventListener('change', cariMobil);
filterTipe.addEventListener('change', cariMobil);
filterKursi.addEventListener('change', cariMobil);

// reset filter
document.getElementById("resetFilters").addEventListener("click", function () {
    // Reset input pencarian
    document.getElementById("searchInput").value = "";

    // Reset dropdown filter ke pilihan pertama
    filterGarasi.selectedIndex = 0;
    filterTipe.selectedIndex = 0;
    filterKursi.selectedIndex = 0;

    // Panggil fungsi untuk menampilkan semua mobil kembali
    cariMobil();
});

// Fungsi untuk menampilkan data mobil
function tampilkanMobil(dataMobil, dataGarasi) {
    // Tampilkan loading sebelum data dimuat
    document.querySelector('.loading-container').style.display = 'flex';
    document.querySelector('.loading-box').style.display = 'flex';
    document.querySelector('.loading-text').style.display = 'flex';

    carcontainer.innerHTML = ''; // Kosongkan elemen
    // Filter hanya mobil yang tersedia
    const mobilList = Object.values(dataMobil || {}).filter(mobil => mobil.status === 'tersedia');

    // Cek apakah ada mobil yang ditemukan
    if (mobilList.length === 0) {
        setTimeout(() => {
            document.querySelector('.loading-container').style.display = 'none';
            document.querySelector('.loading-box').style.display = 'none';
            document.querySelector('.loading-text').style.display = 'none'; // Sembunyikan loading setelah selesai
            
            // Pastikan pesan tidak muncul lebih dari sekali
            if (!document.querySelector('.no-results-message')) {
                const noResultsMessage = `
                    <div class="col-12 no-results-message">
                        <p class="text-center text-danger">Mobil yang Anda cari tidak Tersedia.</p>
                    </div>
                `;
                carcontainer.insertAdjacentHTML('beforeend', noResultsMessage);
            }
        }, 500); // Delay agar efek loading lebih terlihat
        return;
    }

    mobilList.forEach((mobil) => {
    const isDisewa = mobil.status === 'disewa';
    const card = `
        <div class="col-md-4">
            <div class="card mb-4 ${isDisewa ? 'opacity-50 blocked-cursor' : 'cursor'}"
                ${!isDisewa ? `
                    data-bs-toggle="modal" 
                    data-bs-target="#transaksiModal" 
                    data-mobil="${mobil.nama_mobil || ''}"
                    data-foto="${encodeURIComponent(mobil.foto || 'default.png')}"
                    data-harga="${mobil.harga_sewa || 0}"
                    data-tipe="${mobil.tipe_mobil || 'Tidak Diketahui'}"
                    data-tempat-duduk="${mobil.jumlah_tempat_duduk || '0'}"
                    data-bahan-bakar="${mobil.bahan_bakar || 'Tidak Diketahui'}"
                    data-transmisi="${mobil.transmisi || 'Tidak Diketahui'}"
                    data-warna="${mobil.warna || 'Tidak Diketahui'}"
                    data-tahun="${mobil.tahun || 'Tidak Diketahui'}"
                    data-garasi="${dataGarasi[mobil.id_tempat]?.nama_tempat || 'Garasi Tidak Diketahui'}"
                    data-status="${mobil.status || 'Tidak Diketahui'}"
                ` : ''}>
                <img src="../drivego/source/image/mobil/${encodeURIComponent(mobil.foto || 'default.png')}" 
                    class="card-img-top" alt="${mobil.nama_mobil || 'Nama Mobil'}">
                <div class="card-body">
                    <h5 class="card-title nama-mobil">${mobil.nama_mobil || 'Nama Mobil Tidak Tersedia'}</h5>
                    <div class="harga">
                        <i class="fas fa-money-bill-wave"></i> Harga: Rp ${new Intl.NumberFormat('id-ID').format(mobil.harga_sewa || 0)}/hari
                    </div>
                    <div class="card-specs">
                        <div><i class="fas fa-car"></i> Tipe: ${mobil.tipe_mobil || 'Tidak Diketahui'}</div>
                        <div><i class="fas fa-chair"></i> Tempat Duduk: ${mobil.jumlah_tempat_duduk || '0'}</div>
                        <div><i class="fas fa-gas-pump"></i> Bahan Bakar: ${mobil.bahan_bakar || 'Tidak Diketahui'}</div>
                        <div><i class="fas fa-cogs"></i> Transmisi: ${mobil.transmisi || 'Tidak Diketahui'}</div>
                        <div><i class="fas fa-palette"></i> Warna: ${mobil.warna || 'Tidak Diketahui'}</div>
                        <div><i class="fas fa-calendar"></i> Tahun: ${mobil.tahun || 'Tidak Diketahui'}</div>
                        <div><i class="fas fa-home"></i> Garasi: ${dataGarasi[mobil.id_tempat]?.nama_tempat || 'Garasi Tidak Diketahui'}</div>
                        <div>
                            <i class="fas ${mobil.status === 'disewa' ? 'fa-times-circle text-danger' : 'fa-check-circle text-success'}"></i> 
                            Status: ${mobil.status || 'Tidak Diketahui'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    carcontainer.insertAdjacentHTML('beforeend', card);
    });
    // Sembunyikan loading setelah data selesai dimuat
    setTimeout(() => {
        document.querySelector('.loading-container').style.display = 'none';
        document.querySelector('.loading-box').style.display = 'none';
        document.querySelector('.loading-text').style.display = 'none';
    });
        
    document.querySelectorAll('.card[data-mobil]').forEach(card => {
        card.addEventListener('click', (e) => {
            const dataset = card.dataset;

            // Ambil elemen-elemen di dalam modal
            const modalNamaMobil = document.querySelector('#transaksiModal .nama-mobil');
            const modalFoto = document.querySelector('#transaksiModal .foto-mobil');
            const modalHarga = document.querySelector('#transaksiModal .harga-mobil');
            const modalTipe = document.querySelector('#transaksiModal .tipe-mobil');
            const modalTempatDuduk = document.querySelector('#transaksiModal .tempat-duduk');
            const modalBahanBakar = document.querySelector('#transaksiModal .bahan-bakar');
            const modalTransmisi = document.querySelector('#transaksiModal .transmisi');
            const modalWarna = document.querySelector('#transaksiModal .warna');
            const modalTahun = document.querySelector('#transaksiModal .tahun');
            const modalGarasi = document.querySelector('#transaksiModal .garasi');
            const modalStatus = document.querySelector('#transaksiModal .status');

            // Isi modal dengan data dari kartu
            if (modalNamaMobil) modalNamaMobil.textContent = dataset.mobil || 'Nama Mobil Tidak Diketahui';
            if (modalFoto) modalFoto.src = `../drivego/source/image/mobil/${dataset.foto || 'default.png'}`;
            if (modalHarga) modalHarga.textContent = `Rp ${new Intl.NumberFormat('id-ID').format(dataset.harga || 0)}`;
            if (modalTipe) modalTipe.textContent = dataset.tipe || 'Tidak Diketahui';
            if (modalTempatDuduk) modalTempatDuduk.textContent = dataset.tempatDuduk || '0';
            if (modalBahanBakar) modalBahanBakar.textContent = dataset.bahanBakar || 'Tidak Diketahui';
            if (modalTransmisi) modalTransmisi.textContent = dataset.transmisi || 'Tidak Diketahui';
            if (modalWarna) modalWarna.textContent = dataset.warna || 'Tidak Diketahui';
            if (modalTahun) modalTahun.textContent = dataset.tahun || 'Tidak Diketahui';
            if (modalGarasi) modalGarasi.textContent = dataset.garasi || 'Garasi Tidak Diketahui';
            if (modalStatus) modalStatus.textContent = dataset.status || 'Tidak Diketahui';

            // Ambil elemen-elemen di dalam step3
            const hargaPerHariElement = document.querySelector('#step3 #hargaPerHari');

            // Pastikan harga dari backend diset sebelum perhitungan dilakukan
            if (hargaPerHariElement) {
                const hargaDariBackend = dataset.harga || 0; // Ambil harga dari backend
                hargaPerHariElement.dataset.harga = hargaDariBackend; // Simpan di atribut data
                setHargaPerHari(hargaDariBackend); // Update harga per hari di frontend
            }
        });
    });
}
// modal script
document.addEventListener("DOMContentLoaded", function() {
    let currentStep = 1;
    const progressBar = document.getElementById("progressBar");
    const steps = document.querySelectorAll(".step");
    const jenisSewa = document.getElementById("jenisSewa");
    const lepasKunciFields = document.getElementById("lepasKunciFields");
    const denganSupirFields = document.getElementById("denganSupirFields");
    const tujuanSewa = document.getElementById("tujuanSewa");
    const detailMobil = document.getElementById("detail-mobil"); // Elemen detail mobil
    const lokasiTujuanContainer = document.getElementById("lokasiTujuanContainer");

    function toggleDetailMobil() {
        detailMobil.classList.toggle("d-none", !(currentStep === 1 || currentStep === 3));
    }

    // 🔥 Simpan data ke localStorage setiap perubahan
    function saveProgress() {
        let formData = {};
        const excludedFields = ["filterGarasi", "filterKursi", "filterTipe", "searchInput"]; // 🛑 Hindari penyimpanan field ini

        document.querySelectorAll("input, select, textarea").forEach(input => {
            // 🛑 Hindari input file dan field yang harus diabaikan
            if (input.type !== "file" && !excludedFields.includes(input.id)) {
                formData[input.id] = input.value;
            }
        });

        // ✅ Simpan "Tujuan lainnya" jika dipilih
        if (document.getElementById("tujuanSewa")?.value === "lainnya") {
            formData.tujuanLainnya = document.getElementById("tujuanLainnya")?.value || "";
        } else {
            formData.tujuanLainnya = "";
        }

        // ✅ Simpan semua tujuan sebagai array dalam localStorage
        let tujuanValues = [];
        document.querySelectorAll("input[name='lokasiTujuan[]']").forEach(input => {
            tujuanValues.push(input.value);
        });
        formData.lokasiTujuan = tujuanValues;

        // ✅ Simpan step terakhir
        formData.currentStep = typeof currentStep !== "undefined" ? currentStep : 1;

        localStorage.setItem("formProgress", JSON.stringify(formData));
    }

    // 🔄 Tambahkan event listener untuk memantau perubahan
    document.querySelectorAll("input, select, textarea").forEach(input => {
        input.addEventListener("input", saveProgress);
    });

    // 🔥 Load data dari localStorage saat halaman/modal dibuka
    function loadProgress() {
        const savedData = JSON.parse(localStorage.getItem("formProgress"));
        console.log("🔍 Data di localStorage saat ini:", savedData); // Debugging

        if (savedData) {
            Object.keys(savedData).forEach(key => {
                const element = document.getElementById(key);

                if (element) {
                    // 🛑 Lewati input file agar tidak menyebabkan error
                if (element.type !== "file") {
                    element.value = savedData[key];
                }
            }
        });

        // ✅ Muat kembali input "Tujuan lainnya" jika ada nilai tersimpan
        if (savedData.tujuanSewa === "lainnya") {
            tujuanLainContainer.style.display = "block";
            tujuanLainInput.value = savedData.tujuanLainnya || "";
        }

        // ✅ Load input lokasi tujuan
        if (savedData.lokasiTujuan && savedData.lokasiTujuan.length > 0) {
            const firstTujuanInput = document.getElementById("tujuan-1");
            if (firstTujuanInput) {
                firstTujuanInput.value = savedData.lokasiTujuan[0];
            }

            for (let i = 1; i < savedData.lokasiTujuan.length; i++) {
                addTujuanInput(savedData.lokasiTujuan[i], i + 1);
            }
        }

        // 🔥 Load step terakhir
        currentStep = savedData.currentStep && savedData.currentStep <= steps.length ? savedData.currentStep : 1;

        console.log("🔄 Data dimuat, Current Step:", currentStep);

        updateProgress();
        showStep(currentStep);
    }
}

    // ✅ Simpan data setiap input berubah
    document.querySelectorAll("input, select, textarea").forEach(input => {
        input.addEventListener("input", saveProgress);
    });

    function showStep(step) {
        steps.forEach((s, index) => {
            s.classList.toggle("d-none", index + 1 !== step);
        });

        updateProgress();
        toggleDetailMobil();
        updateFields();
        updateLabel();
    }

    // 🔥 Membuat container pembungkus untuk input "Tujuan lainnya"
    const tujuanLainContainer = document.createElement("div");
    tujuanLainContainer.style.display = "none"; // Default disembunyikan
    tujuanLainContainer.classList.add("mt-2");

    // 🔥 Membuat input tambahan untuk "Tujuan lainnya"
    const tujuanLainInput = document.createElement("input");
    tujuanLainInput.type = "text";
    tujuanLainInput.classList.add("form-control");
    tujuanLainInput.id = "tujuanLainnya";
    tujuanLainInput.placeholder = "Masukkan tujuan lainnya";

    tujuanLainContainer.appendChild(tujuanLainInput);
    tujuanSewa.parentNode.appendChild(tujuanLainContainer);

    // 🔥 Event listener untuk menampilkan input "Tujuan lainnya" saat opsi dipilih
    tujuanSewa.addEventListener("change", function () {
        if (tujuanSewa.value === "lainnya") {
            tujuanLainContainer.style.display = "block";
            tujuanLainInput.setAttribute("required", "true");
        } else {
            tujuanLainContainer.style.display = "none";
            tujuanLainInput.removeAttribute("required");
            tujuanLainInput.value = ""; // Kosongkan input saat disembunyikan
        }
        saveProgress(); // Simpan perubahan ke localStorage
    });

    // 🔥 Simpan perubahan pada input "Tujuan lainnya" secara real-time
    tujuanLainInput.addEventListener("input", saveProgress);
    
    function updatePlaceholders() {
        const inputs = document.querySelectorAll("input[name='lokasiTujuan[]']");
        inputs.forEach((input, index) => {
            const newId = `tujuan-${index + 1}`;
            input.placeholder = `Tujuan ${index + 1}`;
            input.id = newId; // Pastikan ID sesuai dengan indeks terbaru
        });
    }

    function addTujuanInput(value = "", index = 2) {
        console.log("📌 addTujuanInput() dipanggil dengan:", value, index);

        const lokasiTujuanContainer = document.getElementById("lokasiTujuanContainer");
        if (!lokasiTujuanContainer) return;

        const inputGroup = document.createElement("div");
        inputGroup.classList.add("input-group", "mb-2");

        const newId = `tujuan-${index}`; // 🟢 Pastikan ID mulai dari tujuan-2

        const inputField = document.createElement("input");
        inputField.type = "text";
        inputField.classList.add("form-control");
        inputField.name = "lokasiTujuan[]";
        inputField.placeholder = `Tujuan ${index}`;
        inputField.required = true;
        inputField.value = value;
        inputField.id = newId; // 🟢 ID dimulai dari tujuan-2

        inputField.addEventListener("input", saveProgress);

        console.log(`✅ Input ${newId} dibuat dengan nilai:`, value);

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.classList.add("btn", "btn-danger");
        removeButton.innerHTML = " - ";

        removeButton.addEventListener("click", function () {
            inputGroup.remove();
            saveProgress();
            updatePlaceholders();
        });

        const buttonWrapper = document.createElement("div");
        buttonWrapper.classList.add("input-group-append");
        buttonWrapper.appendChild(removeButton);

        inputGroup.appendChild(inputField);
        inputGroup.appendChild(buttonWrapper);
        lokasiTujuanContainer.appendChild(inputGroup);
    }

    // Event listener tombol tambah tujuan
    document.getElementById("tambahTujuan").addEventListener("click", function (event) {
        event.preventDefault();
        addTujuanInput();
    });

    function updateFields() {
        if (jenisSewa.value === "lepasKunci") {
            lepasKunciFields.classList.remove("d-none");
            denganSupirFields.classList.add("d-none");
        } else {
            lepasKunciFields.classList.add("d-none");
            denganSupirFields.classList.remove("d-none");
        }
    }

    function updateLabel() {
    if (jenisSewa.value === "lepasKunci") {
        document.getElementById("label-jam").textContent = "Jam Pengambilan";
        document.getElementById("penjelasan-jam").textContent = "Pilih jam untuk pengambilan mobil di garasi kami.";
    } else {
        document.getElementById("label-jam").textContent = "Jam Penjemputan";
        document.getElementById("penjelasan-jam").textContent = "Pilih jam penjemputan yang diinginkan.";
    }
}

    jenisSewa.value = "lepasKunci";
    updateFields();
    jenisSewa.addEventListener("change", updateFields);

    // 🔥 Update progress bar & step label
    function updateProgress() {
        progressBar.style.width = (currentStep * 25) + "%";
        progressBar.innerText = currentStep + "/4";
        updateStepLabels();
    }

    function updateStepLabels() {
        document.querySelectorAll(".step-label").forEach((label, index) => {
            label.classList.toggle("active", index + 1 === currentStep);
        });
    }

    document.querySelectorAll(".next-step").forEach(button => {
        button.addEventListener("click", function() {
            const currentStepForm = steps[currentStep - 1].querySelectorAll("input[required], select[required], textarea[required]");
            let isValid = true;

            if (currentStep === 2) {
                let activeFields = jenisSewa.value === "lepasKunci" ? lepasKunciFields : denganSupirFields;
                const requiredInputs = activeFields.querySelectorAll("input[required], select[required], textarea[required]");
                requiredInputs.forEach(input => {
                    if (!input.checkValidity()) {
                        input.reportValidity();
                        isValid = false;
                    }
                });
            } else {
                currentStepForm.forEach(input => {
                    if (!input.checkValidity()) {
                        input.reportValidity();
                        isValid = false;
                    }
                });
            }

            if (isValid) {
                steps[currentStep - 1].classList.add("d-none");
                currentStep++;

                if (currentStep <= steps.length) {
                    steps[currentStep - 1].classList.remove("d-none");
                    updateStepLabels(); // 🔥 Update label aktif
                    updateProgress();
                    toggleDetailMobil();
                    updateFields();
                    updateLabel();
                    saveProgress();
                }

                // 🔥 Simpan & kirim data saat Step 3 Next ditekan
                if (currentStep === 4) {
                    simpanKeFirebase();
                }
            }
        });
    });

    document.getElementById("jenisSewa").addEventListener("change", function() {
        updateFields();
        updateLabel();
        saveProgress();
    });
    
    function updatePlaceholders() {
        const inputs = lokasiTujuanContainer.querySelectorAll("input");
        inputs.forEach((input, index) => {
            input.placeholder = `Tujuan ${index + 1}`;
            input.setAttribute("required", "true");
        });
    }

    // 🔥 Load data saat modal dibuka atau halaman di-refresh
    loadProgress();
    updateFields();
    toggleDetailMobil(); // ✅ Panggil saat halaman dimuat
    updateStepLabels(); // Inisialisasi label saat pertama kali halaman dimuat
});

// 🔥 Fungsi untuk Generate ID Pesanan Unik
async function generateUniqueOrderId() {
    let orderId;
    let exists = true;

    while (exists) {
        // 🔥 Buat ID Pesanan Baru
        orderId = "ORD-" + Math.floor(100000 + Math.random() * 900000);

        // 🔥 Cek ke Firebase apakah ID sudah ada
        const orderRef = ref(database, "transaksi/" + orderId);
        const snapshot = await get(orderRef);

        // 🔥 Jika ID belum ada, lanjutkan
        if (!snapshot.exists()) {
            exists = false;
        }
    }

    return orderId;
}

// 🔥 Fungsi untuk Menyimpan Data ke Firebase
async function simpanKeFirebase() {
    // 🔥 Generate ID Pesanan yang Unik
    const orderId = await generateUniqueOrderId();
    
    // 🔥 Ambil Data dari LocalStorage
    let formData = JSON.parse(localStorage.getItem("formProgress")) || {};

    // 🔥 Ambil namaPenyewa dari LocalStorage
    const username = formData.namaPenyewa || "UnknownUser"; 

    // 🔥 Ambil Data Detail Mobil
    const NamaMobil = document.querySelector('#transaksiModal .nama-mobil');
    const garasi = document.querySelector('#transaksiModal .garasi');
    const harga = document.querySelector('#transaksiModal .harga-mobil');

    if (NamaMobil) formData.namaMobil = NamaMobil.textContent.trim();
    if (garasi) formData.garasi = garasi.textContent.trim();
    if (harga) {
        let hargaSewa = parseInt(harga.textContent.replace(/\D/g, ''), 10);
        let hariSewa = parseInt(localStorage.getItem("hariSewa"), 10) || 1;
        let totalHarga = hargaSewa * hariSewa;
        let pembayaranDP = totalHarga * 0.2;
        let pembayaranDiTempat = totalHarga - pembayaranDP;

        let tanggalSewaInput = document.querySelector("#tanggalSewa").value;
        let [tahun, bulan, tanggal] = tanggalSewaInput.split('-').map(Number);
        let tanggalSewa = new Date(tahun, bulan - 1, tanggal);
        let tanggalAkhirSewa = new Date(tahun, bulan - 1, tanggal);
        tanggalAkhirSewa.setDate(tanggalAkhirSewa.getDate() + hariSewa);

        const formatTanggal = (tanggal) => {
            const bulan = [
                "Januari", "Februari", "Maret", "April", "Mei", "Juni",
                "Juli", "Agustus", "September", "Oktober", "November", "Desember"
            ];
            return `${tanggal.getDate()} ${bulan[tanggal.getMonth()]} ${tanggal.getFullYear()}`;
        };

        formData.hargaSewa = hargaSewa;
        formData.hariSewa = hariSewa;
        formData.totalHarga = totalHarga;
        formData.pembayaranDP = pembayaranDP;
        formData.pembayaranDiTempat = pembayaranDiTempat;
        formData.tanggalSewa = formatTanggal(tanggalSewa);
        formData.tanggalAkhirSewa = formatTanggal(tanggalAkhirSewa);
        formData.rangeSewa = `${formatTanggal(tanggalSewa)} - ${formatTanggal(tanggalAkhirSewa)}`;
    }

    // 🔥 Fungsi untuk Upload Gambar ke Cloudinary
    async function uploadToCloudinary(file, orderId, username, kategori) {
        const cloudName = "dcvcatmaw"; // Ganti dengan Cloud Name dari Cloudinary
        const uploadPreset = "user_uploads"; // Ganti dengan Upload Preset yang sudah dibuat

        // 🔥 Format nama penyewa agar tidak ada spasi (gunakan _ atau -)
        const formattedUsername = username.replace(/\s+/g, "-");

        // 🔥 Tentukan path folder
        const folderPath = `${orderId}/${formattedUsername}/${kategori}`;
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", uploadPreset);
        formData.append("folder", folderPath);

        try {
            const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("Gagal mengunggah ke Cloudinary");

            const data = await response.json();
            console.log("✅ Upload berhasil:", data);
            return file.name; // 🔥 Simpan nama file saja, bukan URL
        } catch (error) {
            console.error("❌ Error saat upload ke Cloudinary:", error);
            return null;
        }
    }

    // 🔥 Upload & Simpan Nama File ke LocalStorage & Firebase
    async function saveFileName(inputId, keyName, kategori) {
        const fileInput = document.getElementById(inputId);
        if (fileInput && fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const allowedTypes = ['image/jpeg', 'image/png'];

            if (file) {
                if (file.size > 1048576) {
                    showToast("❌ Ukuran file tidak boleh lebih dari 1MB!");
                    fileInput.value = "";
                } else if (!allowedTypes.includes(file.type)) {
                    showToast("❌ Hanya boleh mengunggah file gambar dengan format JPG atau PNG!");
                    fileInput.value = "";
                } else {
                    const fileName = await uploadToCloudinary(file, orderId, username, kategori);
                    if (fileName) formData[keyName] = fileName;
                }
            }
        }
    }

    await saveFileName("fotoKTP", "fotoKTP", "fotobukti");
    await saveFileName("fotoSIM", "fotoSIM", "fotobukti");
    await saveFileName("fotoVerifikasi", "fotoVerifikasi", "fotobukti");
    await saveFileName("buktiBayar", "buktiBayar", "pembayaran");

    // 🔥 Tambahkan ID Pesanan
    formData.orderId = orderId;

    // 🔥 Simpan ke LocalStorage
    localStorage.setItem("formProgress", JSON.stringify(formData));

    console.log("✅ Data Tersimpan di LocalStorage:", formData);

    // 🔥 Buat Salinan Data Tanpa `currentStep`
    let firebaseData = { ...formData }; 
    delete firebaseData.currentStep; // 🔥 Hapus currentStep sebelum dikirim ke Firebase
    
    // 🔥 Simpan Data ke Firebase Realtime Database
    set(ref(database, "transaksi/" + orderId), firebaseData)
    .then(() => {
        console.log("✅ Data berhasil disimpan ke Firebase!");

        // 🔥 Update Status Mobil ke "pending"
        updateMobilStatus(firebaseData.namaMobil);
    })
    .catch((error) => {
        console.error("❌ Gagal menyimpan ke Firebase:", error);
    });
}

function updateMobilStatus(namaMobil) {
    const mobilRef = ref(database, "mobil");

    get(mobilRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                let mobilData = snapshot.val();

                Object.keys(mobilData).forEach((key) => {
                    if (mobilData[key] && mobilData[key].nama_mobil === namaMobil) {
                        // 🔥 Update status mobil menjadi "pending"
                        update(ref(database, `mobil/${key}`), { status: "pending" })
                            .then(() => {
                                console.log(`✅ Status mobil "${namaMobil}" berhasil diubah menjadi 'pending'`);
                            })
                            .catch((error) => {
                                console.error(`❌ Gagal mengupdate status mobil "${namaMobil}":`, error);
                            });
                    }
                });
            } else {
                console.warn("⚠️ Data mobil tidak ditemukan.");
            }
        })
        .catch((error) => {
            console.error("❌ Gagal mengambil data mobil:", error);
        });
}

// ============================
// 📌 Form Nama Penyewa (Modal)
// ============================
document.getElementById('namaPenyewa').addEventListener('input', function (e) {
    const inputField = e.target;
    let value = inputField.value;

    // 🔤 Hapus angka dari input
    let formattedValue = value.replace(/[0-9]/g, '');

    // 🔠 Kapitalisasi huruf pertama setiap kata
    formattedValue = formattedValue.replace(/\b\w/g, char => char.toUpperCase());

    // 📝 Perbarui nilai input
    inputField.value = formattedValue;

    // ⚠️ Validasi: Nama tidak boleh mengandung angka
    if (value.match(/[0-9]/)) {
        inputField.classList.add("input-invalid");
        inputField.setCustomValidity("Nama tidak boleh mengandung angka.");
    } else {
        inputField.classList.remove("input-invalid");
        inputField.setCustomValidity("");
    }

    // 🚨 Tampilkan pesan error langsung
    inputField.reportValidity();
});

// ===============================
// ☎️ Form Nomor Telepon (Modal)
// ===============================
//
document.getElementById('nomertelephone').addEventListener('input', function (e) {
    const borderTelephone = e.target;
    let value = e.target.value.replace(/\D/g, ''); // 🔢 Hanya angka
    let formattedValue = value;
    let maxLength = 12; // Default max untuk nomor Indonesia
    let errorMessage = ""; // Pesan error default kosong

    // 🚫 Deteksi Nomor Luar Negeri (tidak diawali 0)
    if (!value.startsWith("0")) {
        maxLength = 15; // Maksimal 15 digit
        if (value.length > maxLength) value = value.substring(0, maxLength);
        formattedValue = value.replace(/(\d{4})(?=\d)/g, '$1 ');
        errorMessage = "Hanya nomor Indonesia yang diperbolehkan.";

    // 📱 Mobile Number (08xxx - max 12 digit)
    } else if (value.startsWith("08")) {
        if (value.length > maxLength) value = value.substring(0, maxLength);
        formattedValue = value.replace(/(\d{4})(?=\d)/g, '$1 ');
        if (value.length < 12) errorMessage = "Nomor HP harus 12 digit.";

    // ☎️ Landline Number (02xxx - 09xxx - max 12 digit)
    } else if (/^(02|03|04|05|06|07|09)/.test(value)) {
        if (value.length > maxLength) value = value.substring(0, maxLength);
        formattedValue = value.replace(/^(\d{3})(\d{4})(\d{0,5})$/, "$1-$2-$3").replace(/-$/, "");
        if (value.length < 10) errorMessage = "Nomor telepon rumah minimal 10 digit.";

    // ❌ Format Tidak Dikenal
    } else {
        if (value.length > maxLength) value = value.substring(0, maxLength);
        formattedValue = value.replace(/(\d{4})(?=\d)/g, '$1 ');
        errorMessage = "Format nomor tidak valid di Indonesia.";
    }

    // 🔄 Perbarui nilai input
    e.target.value = formattedValue;

    // ⚠️ Jika ada error, langsung tampilkan validasi
    e.target.setCustomValidity(errorMessage);
    e.target.reportValidity(); // Memunculkan pesan validasi langsung
    borderTelephone.classList.toggle("input-invalid", !!errorMessage);
});

// 🎯 Validasi tetap berjalan saat submit
document.querySelector("form").addEventListener("submit", function (e) {
    const phoneInput = document.getElementById('nomertelephone');
    if (!phoneInput.checkValidity()) {
        phoneInput.reportValidity();
        e.preventDefault(); // ⛔ Mencegah submit jika tidak valid
    }
});

// ==============================
// 🗓️ Form Tanggal Sewa (Modal)
// ==============================
document.addEventListener("DOMContentLoaded", function () {
    const tanggalInput = document.getElementById("tanggalSewa");

    // 🕒 Set tanggal minimal hari ini + 3 hari
    const today = new Date();
    const minValidDate = new Date(today.setDate(today.getDate() + 3));

    const minDate = minValidDate.toISOString().split("T")[0];
    tanggalInput.setAttribute("min", minDate); // 🛡️ Mencegah pemilihan tanggal sebelum minimal
});

// ==============================
// 🗓️ Form Jam (Modal)
// ==============================

document.addEventListener("DOMContentLoaded", function () {
    const jamPenjemputan = document.getElementById("jamPenjemputan");
    const toastEl = document.getElementById("jamToast");
    const toastBootstrap = new bootstrap.Toast(toastEl, { delay: 3000 }); // Otomatis hilang setelah 1 detik
    const minTime = "04:00";
    const maxTime = "23:59"; // 24:00 tidak valid di HTML

    function validateTime() {
        let selectedTime = jamPenjemputan.value;

        if (selectedTime < minTime || selectedTime > maxTime) {
            jamPenjemputan.value = minTime; // Ubah otomatis ke jam minimum
            toastBootstrap.show(); // Tampilkan notifikasi
        }
    }

    // Set min dan max pada input
    jamPenjemputan.setAttribute("min", minTime);
    jamPenjemputan.setAttribute("max", maxTime);

    // Event listener untuk validasi input
    jamPenjemputan.addEventListener("change", validateTime);
});

// ===================================
// 💰 Form DP & Harga Sewa (Modal)
// ===================================

// 🏷️ Ambil elemen-elemen
const hariSewaRange = document.getElementById('hariSewaRange');
const hariSewaNumber = document.getElementById('hariSewa');
const hargaSewaElement = document.getElementById('hargaSewa');
const dpElement = document.getElementById('dp');
const hargaPerHariElement = document.getElementById('hargaPerHari');

// 💸 Harga per hari dari data atribut (backend bisa mengatur ini)
let hargaPerHari = parseInt(hargaPerHariElement.dataset.harga, 10) || 0;

// 🔄 Saat range diubah, update input number & harga
hariSewaRange.addEventListener('input', function () {
    hariSewaNumber.value = hariSewaRange.value;
    updateHarga();
});

// 🔄 Saat input number diubah, update range & harga
hariSewaNumber.addEventListener('input', function () {
    if (hariSewaNumber.value < 1) hariSewaNumber.value = 1;
    else if (hariSewaNumber.value > 100) hariSewaNumber.value = 100;

    hariSewaRange.value = hariSewaNumber.value;
    updateHarga();
});

// 💡 Fungsi untuk memperbarui harga sewa dan DP
function updateHarga() {
    const hari = parseInt(hariSewaRange.value, 10);
    const totalHargaSewa = hari * hargaPerHari;
    const dp = totalHargaSewa * 0.2;

    hargaSewaElement.innerText = totalHargaSewa.toLocaleString('id-ID');
    dpElement.innerText = dp.toLocaleString('id-ID');
}

// ⚙️ Fungsi untuk memperbarui harga per hari (jika dari backend)
function setHargaPerHari(harga) {
    hargaPerHari = parseInt(harga, 10) || 0;
    hargaPerHariElement.dataset.harga = hargaPerHari;
    updateHarga();
}

// 🔥 Panggil fungsi updateHarga saat pertama kali load
updateHarga();

// Pantau perubahan data di Firebase (untuk pertama kali load)
onValue(mobilRef, (snapshotMobil) => {
    onValue(garasiRef, (snapshotGarasi) => {
        const dataMobil = snapshotMobil.val();
        const dataGarasi = snapshotGarasi.val();
        tampilkanMobil(dataMobil, dataGarasi);
    });
});
// Fungsi untuk menampilkan data garasi
function tampilkanGarasi(dataGarasi) {
    const garasiContainer = document.querySelector('.daftar-garasi');
    garasiContainer.innerHTML = ''; // Kosongkan elemen sebelumnya

    Object.values(dataGarasi || {}).forEach((garasi) => {
        if (garasi) { // Pastikan data garasi tidak null
            const card = `
                <div class="col-md-6 mb-4">
                    <div class="p-4 bg-secondary rounded shadow">
                        <div class="d-flex align-items-center mb-3">
                            <div class="icon-container bg-light rounded-circle me-3 d-flex justify-content-center align-items-center">
                                <i class="fas fa-map-marker-alt text-dark"></i>
                            </div>
                            <h4 class="m-0">${garasi.nama_tempat}</h4>
                        </div>
                        <p class="mb-2">
                            <i class="fas fa-location-dot me-2 text-light"></i>
                            <strong>Alamat:</strong> ${garasi.alamat}
                        </p>
                        <p class="mb-2">
                            <i class="fas fa-phone me-2 text-light"></i>
                            <strong>Telepon:</strong> <a href="tel:${garasi.telepon}" class="text-light">${garasi.telepon}</a>
                        </p>
                    </div>
                </div>
            `;
            garasiContainer.insertAdjacentHTML('beforeend', card);
        }
    });
}

// Pantau perubahan data garasi di Firebase
onValue(garasiRef, (snapshot) => {
    const dataGarasi = snapshot.val();
    tampilkanGarasi(dataGarasi);
});



// Ambil semua link navbar
const navLinks = document.querySelectorAll('.text-nav');

// Fungsi untuk memperbarui status aktif
const updateActiveNav = () => {
    let currentSection = "home"; // Set nilai awal ke "home"

    // Ambil semua section dengan ID
    document.querySelectorAll('section').forEach((section) => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;

        if (window.pageYOffset >= sectionTop - sectionHeight / 3) {
            currentSection = section.getAttribute('id');
        }
    });

    // Hapus dan tambahkan class 'active' pada link yang sesuai
    navLinks.forEach((link) => {
        link.classList.remove('active');
        if (link.getAttribute('href').includes(currentSection)) {
            link.classList.add('active');
        }
    });
};

// Jalankan fungsi saat halaman pertama kali dimuat
updateActiveNav();

// Tambahkan event listener pada scroll
window.addEventListener('scroll', updateActiveNav);

document.addEventListener("DOMContentLoaded", function () {
    const toggler = document.querySelector(".navbar-toggler");
    const icon = toggler.querySelector("i");
    const navbar = document.getElementById("navbarNav");

    toggler.addEventListener("click", function () {
        if (navbar.classList.contains("show")) {
            icon.classList.remove("fa-xmark", "rotate-enter");
            icon.classList.add("fa-bars", "rotate-exit");
        } else {
            icon.classList.remove("fa-bars", "rotate-exit");
            icon.classList.add("fa-xmark", "rotate-enter");
        }
    });

    // Pastikan ikon kembali ke hamburger setelah navbar ditutup
    navbar.addEventListener("hidden.bs.collapse", function () {
        icon.classList.remove("fa-xmark", "rotate-enter");
        icon.classList.add("fa-bars", "rotate-exit");
    });

    navbar.addEventListener("shown.bs.collapse", function () {
        icon.classList.remove("fa-bars", "rotate-exit");
        icon.classList.add("fa-xmark", "rotate-enter");
    });
});

// pop up info
const infoBtn = document.getElementById('infoBtn');
const popupInfo = document.getElementById('popupInfo');
const btnIcon = document.querySelector('.btn-icon');
const footer = document.getElementById('footer');
let popupVisible = false;

// Fungsi untuk menampilkan popup dan ubah ikon
const showPopup = () => {
    popupInfo.style.setProperty('display', 'block', 'important');
    setTimeout(() => popupInfo.classList.add('popup-show'), 10);

    // Animasi ikon ke 'X'
    btnIcon.classList.add('change');
    setTimeout(() => {
        btnIcon.textContent = 'X';
        btnIcon.classList.remove('change');
    }, 300);
};

const hidePopup = () => {
    popupInfo.classList.remove('popup-show');
    setTimeout(() => popupInfo.style.setProperty('display', 'none', 'important'), 300);

    // Animasi ikon kembali ke '?'
    btnIcon.classList.add('change');
    setTimeout(() => {
        btnIcon.textContent = '?';
        btnIcon.classList.remove('change');
    }, 300);
};

// Toggle popup saat tombol diklik
infoBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    popupVisible = !popupVisible;
    popupVisible ? showPopup() : hidePopup();
});

// Hover tambahan
infoBtn.addEventListener('mouseenter', () => {
    if (!popupVisible) showPopup();
});

infoBtn.addEventListener('mouseleave', () => {
    if (!popupVisible) hidePopup();
});

popupInfo.addEventListener('mouseleave', () => {
    if (!popupVisible) hidePopup();
});

// Klik di luar popup untuk menyembunyikan
document.addEventListener('click', (e) => {
    if (popupVisible && !popupInfo.contains(e.target) && e.target !== infoBtn) {
        hidePopup();
        popupVisible = false;
    }
});

// 🔥 Mengatur batas floating button di atas footer
window.addEventListener('scroll', () => {
    const footerRect = footer.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const overlap = windowHeight - footerRect.top - 5; // di atas footer

    infoBtn.style.transform = overlap > 0 ? `translateY(-${overlap}px)` : `translateY(0)`;
});
// file max 1mb
document.querySelectorAll('input[type="file"]').forEach(input => {
    input.addEventListener('change', function () {
        const file = this.files[0];
        if (file) {
            const allowedTypes = ['image/jpeg', 'image/png'];

            // Cek ukuran file
            if (file.size > 1048576) { // 1MB = 1048576 bytes
                showToast("Ukuran file tidak boleh lebih dari 1MB!");
                this.value = ""; // Reset input
                return;
            }

            // Cek tipe file
            if (!allowedTypes.includes(file.type)) {
                showToast("Hanya boleh mengunggah file gambar dengan format JPG atau PNG!");
                this.value = ""; // Reset input
            }
        }
    });
});

// Fungsi untuk menampilkan toast
function showToast(message) {
    const toastEl = document.getElementById('toastFileError');
    toastEl.querySelector('.toast-body').textContent = message;
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}