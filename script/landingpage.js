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
    carcontainer.innerHTML = ''; // Kosongkan elemen
    // Urutkan data mobil berdasarkan status
    const mobilList = Object.values(dataMobil || {}).sort((a, b) => {
        const statusA = a.status || 'undefined';
        const statusB = b.status || 'undefined';
        return statusA === 'tersedia' ? -1 : 1;
    });

    // Cek apakah ada mobil yang ditemukan
    if (mobilList.length === 0) {
        const noResultsMessage = `
            <div class="col-12">
                <p class="text-center text-danger">Mobil yang Anda cari tidak Tersedia.</p>
            </div>
        `;
        carcontainer.insertAdjacentHTML('beforeend', noResultsMessage);
        return;
    }

    mobilList.forEach((mobil) => {
        const isDisewa = mobil.status === 'disewa';
        const card = `
                <div class="col-md-4">
                    <div class="card mb-4 ${isDisewa ? 'opacity-50' : 'cursor'}" ${isDisewa ? '' : 'data-bs-toggle="modal" data-bs-target="#transaksiModal"'}>
                        <img src="../drivego/source/image/mobil/${encodeURIComponent(mobil.foto || 'default.png')}" class="card-img-top" alt="${mobil.nama_mobil || 'Nama Mobil'}">
                        <div class="card-body">
                            <h5 class="card-title">${mobil.nama_mobil || 'Nama Mobil Tidak Tersedia'}</h5>
                            <div class="card-specs">
                                <div><i class="fas fa-car"></i> Tipe: ${mobil.tipe_mobil || 'Tidak Diketahui'}</div>
                                <div><i class="fas fa-chair"></i> Tempat Duduk: ${mobil.jumlah_tempat_duduk || '0'}</div>
                                <div><i class="fas fa-tachometer-alt"></i> Kilometer: ${mobil.kilometer || '0 km'}</div>
                                <div><i class="fas fa-gas-pump"></i> Bahan Bakar: ${mobil.bahan_bakar || 'Tidak Diketahui'}</div>
                                <div><i class="fas fa-cogs"></i> Transmisi: ${mobil.transmisi || 'Tidak Diketahui'}</div>
                                <div><i class="fas fa-money-bill-wave"></i> Harga: Rp ${new Intl.NumberFormat('id-ID').format(mobil.harga_sewa || 0)}/hari</div>
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

