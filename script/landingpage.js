// Inisialisasi Firebase
import {
    initializeApp
} from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js';
import {
    getDatabase,
    ref,
    onValue
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

// Fungsi untuk menampilkan data mobil
function tampilkanMobil(dataMobil, dataGarasi) {
    // Tampilkan loading sebelum data dimuat
    document.querySelector('.loading-container').style.display = 'flex';
    document.querySelector('.loading-box').style.display = 'flex';
    document.querySelector('.loading-text').style.display = 'flex';

    carcontainer.innerHTML = ''; // Kosongkan elemen
    // Urutkan data mobil berdasarkan status
    const mobilList = Object.values(dataMobil || {}).sort((a, b) => {
        const statusA = a.status || 'undefined';
        const statusB = b.status || 'undefined';
        return statusA === 'tersedia' ? -1 : 1;
    });

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

// Fungsi untuk mencari mobil berdasarkan input
function cariMobil() {
    const query = searchInput.value.toLowerCase(); // Ambil nilai input pencarian dan ubah ke huruf kecil

    // Ambil data mobil dan garasi dari Firebase
    onValue(mobilRef, (snapshotMobil) => {
        onValue(garasiRef, (snapshotGarasi) => {
            const dataMobil = snapshotMobil.val();
            const dataGarasi = snapshotGarasi.val();

            // Filter mobil berdasarkan pencarian
            const filteredMobil = Object.values(dataMobil || {}).filter((mobil) =>
                mobil.nama_mobil.toLowerCase().includes(
                    query) // Cek apakah nama mobil sesuai dengan pencarian
            );

            // Tampilkan mobil yang sudah difilter
            tampilkanMobil(filteredMobil, dataGarasi);
        });
    });
}

// Tambahkan event listener pada kolom pencarian
searchInput.addEventListener('input', cariMobil);

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


