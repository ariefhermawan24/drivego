import { database } from "./config.js";
import {  getDatabase, ref, onValue, push, update, remove , get } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

const showToast = (message, type = 'success') => {
  const toastElement = document.getElementById('toastNotification');
  const toastBody = toastElement.querySelector('.toast-body');

  toastElement.classList.remove('text-bg-success', 'text-bg-danger', 'text-bg-warning');
  toastElement.classList.add(`text-bg-${type}`);
  toastBody.textContent = message;

  const toast = new bootstrap.Toast(toastElement);
  toast.show();
};
// Ambil data garasi dari Firebase
const garasiRef = ref(database, 'garasi');
const garasiTableBody = document.getElementById('garasiTableBody');
const itemsPerPage = 5;
let dataGarasi = {}; // Stores all data fetched from Firebase
let filteredDataGarasi = {}; // Stores filtered data for search
let currentPage = 1; // Current page for pagination
let isSearching = false; // Flag to track if a search is active
let editGarasiId = null; // Deklarasikan variabel di luar fungsi

onValue(garasiRef, (snapshot) => {
  const data = snapshot.val() || [];
  dataGarasi = data;
  renderTable(); // Render ulang tabel setelah data garasi di-load
  populateGarasiOptions(); // Panggil untuk isi opsi garasi
});

// Fungsi untuk isi <select> Garasi
function populateGarasiOptions() {
  const selectGarasiList = document.querySelectorAll('.GarasiMobil');
  
  selectGarasiList.forEach(selectGarasi => {
    // Kosongkan dulu isinya
    selectGarasi.innerHTML = '<option value="">Pilih Garasi</option>';

    if (dataGarasi && typeof dataGarasi === 'object') {
      Object.entries(dataGarasi).forEach(([id, garasi]) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = garasi.nama_tempat;
        selectGarasi.appendChild(option);
      });
    }
  });
}

// ✅ This function renders the table based on the data (either filtered or all)
export const renderTable = () => {
  const garasiTableBody = document.getElementById('garasiTableBody'); // Make sure this exists in your HTML
  garasiTableBody.innerHTML = '';

  // Choose the correct data to display based on the search flag
  const dataToRender = isSearching ? Object.values(filteredDataGarasi) : Object.values(dataGarasi);

  if (dataToRender.length === 0) {
    garasiTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center">Belum ada data garasi yang tersedia.</td>
      </tr>
    `;
    return;
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = dataToRender.slice(startIndex, startIndex + itemsPerPage);

  // Render each row
  paginatedData.forEach((garasi, index) => {
    const row = `
      <tr>
        <td>${startIndex + index + 1}</td>
        <td>${garasi.nama_tempat || '-'}</td>
        <td>${garasi.alamat || '-'}</td>
        <td>${garasi.telepon || '-'}</td>
        <td>
          <button class="btn btn-warning btn-sm" onclick="editGarasi('${garasi.key}')">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="btn btn-danger btn-sm" onclick="hapusGarasi('${garasi.key}')">
            <i class="fas fa-trash"></i> Hapus
          </button>
        </td>
      </tr>
    `;
    garasiTableBody.innerHTML += row;
  });
};

// ✅ This function renders pagination based on the data
const renderPagination = () => {
  const paginationElement = document.getElementById('pagination');
  paginationElement.innerHTML = '';

  const dataToRender = isSearching ? filteredDataGarasi : dataGarasi;
  const totalPages = Math.ceil(Object.keys(dataToRender).length / itemsPerPage);

  if (totalPages > 1) {
    paginationElement.innerHTML += `
      <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
        <button class="page-link" onclick="changePage(${currentPage - 1})">Previous</button>
      </li>
    `;

    for (let i = 1; i <= totalPages; i++) {
      paginationElement.innerHTML += `
        <li class="page-item ${currentPage === i ? 'active' : ''}">
          <button class="page-link" onclick="changePage(${i})">${i}</button>
        </li>
      `;
    }

    paginationElement.innerHTML += `
      <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
        <button class="page-link" onclick="changePage(${currentPage + 1})">Next</button>
      </li>
    `;
  }
};

// ✅ This function changes the current page for pagination
const changePage = (page) => {
  const dataToRender = isSearching ? filteredDataGarasi : dataGarasi;
  const totalPages = Math.ceil(Object.keys(dataToRender).length / itemsPerPage);

  if (page >= 1 && page <= totalPages) {
    currentPage = page;
    renderTable();
    renderPagination();
  }
};

// ✅ This function performs the search for garasi data
function searchGarasi() {
  let input = document.getElementById("searchGarasi").value.toLowerCase();
  isSearching = input.trim() !== ''; // If there's input, search is active

  if (isSearching) {
    filteredDataGarasi = {}; // Reset filtered data
    Object.entries(dataGarasi).forEach(([key, garasi]) => {
      if (
        garasi.nama_tempat.toLowerCase().includes(input) ||
        garasi.alamat.toLowerCase().includes(input) ||
        garasi.telepon.toLowerCase().includes(input)
      ) {
        filteredDataGarasi[key] = garasi; // Add matching garasi to filtered data
      }
    });
  } else {
    filteredDataGarasi = {}; // If search is cleared, reset filtered data
  }

  currentPage = 1; // Reset to first page after search
  renderTable(); // Render table based on search
  renderPagination(); // Render pagination based on search
}

window.searchGarasi = searchGarasi;
window.changePage = changePage; // Ensure pagination works

// Firebase data listener
onValue(garasiRef, (snapshot) => {
  dataGarasi = {}; // Reset dataGarasi to be an empty object

  snapshot.forEach((childSnapshot) => {
    dataGarasi[childSnapshot.key] = { key: childSnapshot.key, ...childSnapshot.val() };
  });

  const totalPages = Math.ceil(Object.keys(dataGarasi).length / itemsPerPage);

  if (currentPage > totalPages) {
    currentPage = totalPages > 0 ? totalPages : 1;
  }

  filteredDataGarasi = {}; // Reset filtered data
  renderTable(); // Render table based on new data
  renderPagination(); // Render pagination
});

// Fungsi untuk membuka modal dan mengisi data berdasarkan key
function editGarasi(key) {
  console.log("Editing Garasi Key:", key); // Verifikasi Key yang dipilih

  // Mengakses data garasi berdasarkan key langsung
  const garasi = dataGarasi[key]; // menggunakan key yang dipilih, pastikan 'dataGarasi' adalah objek yang memiliki key sebagai identifier

  if (garasi) {
    console.log("Garasi Data:", garasi);

    // Mengisi form dengan data yang akan diedit
    document.getElementById('editNamaTempat').value = garasi.nama_tempat || '';
    document.getElementById('editAlamat').value = garasi.alamat || '';
    document.getElementById('editTelepon').value = garasi.telepon || '';

    // Menyimpan key untuk update nanti
    editGarasiId = key;

    // Menampilkan modal untuk mengedit
    new bootstrap.Modal(document.getElementById('editGarasiModal')).show();
  } else {
    alert("Data garasi tidak ditemukan!");
  }
}

// Fungsi untuk mengupdate data garasi
document.getElementById('editGarasiForm').addEventListener('submit', function(event) {
  event.preventDefault();

  // Ambil data dari input form
  const updatedData = {
    nama_tempat: document.getElementById('editNamaTempat').value.trim(),
    alamat: document.getElementById('editAlamat').value.trim(),
    telepon: document.getElementById('editTelepon').value.trim()
  };

  // Validasi data sebelum diupdate
  if (!updatedData.nama_tempat || !updatedData.alamat || !updatedData.telepon) {
    showToast('Semua Wajib Diisi!', 'danger');
    return;
  }

  // Pastikan editGarasiId berisi key yang valid
  if (editGarasiId && dataGarasi[editGarasiId]) {
    // Update data menggunakan Firebase Modular SDK
    update(ref(database, 'garasi/' + editGarasiId), updatedData)
      .then(() => {
        showToast('Data garasi berhasil diperbarui', 'success');
        bootstrap.Modal.getInstance(document.getElementById('editGarasiModal')).hide();
        renderTable(); // Render ulang tabel setelah update
      })
      .catch(error => {
        console.error("Error updating data:", error);
        showToast('gagal memperbarui data', 'danger');
      });
  } else {
    showToast('data tidak ditemukan', 'warning');
  }
});

// Supaya dipanggil dari HTML onclick
window.editGarasi = editGarasi;


function hapusGarasi(key) {
  if (confirm("Apakah Anda yakin ingin menghapus data ini?")) {
    const db = getDatabase(); // Ambil instance dari database
    const garasiRef = ref(db, 'garasi/' + key); // Referensi ke data garasi yang ingin dihapus berdasarkan key
    
    // Menghapus data dari Firebase berdasarkan key
    remove(garasiRef)
      .then(() => {
        showToast('Data garasi berhasil dihapus!', 'success');
        renderTable(); // Render ulang tabel setelah data dihapus
      })
      .catch(error => {
        console.error("Error deleting data:", error);
        alert('Gagal menghapus data');
      });
  }
}


window.hapusGarasi = hapusGarasi;

function tambahGarasi() {
  // Ambil nilai dari input form
  const namaTempat = document.getElementById("namaTempat").value;
  const alamat = document.getElementById("alamat").value;
  const telepon = document.getElementById("telepon").value;

  // Validasi input
  if (!namaTempat || !alamat || !telepon) {
    showToast('Semua kolom wajib diisi!', 'danger');
    return;
  }

  // Ambil instance database
  const db = getDatabase();
  const garasiRef = ref(db, 'garasi'); // Referensi ke lokasi garasi dalam database

  // Menambahkan data baru ke Firebase
  push(garasiRef, {
    nama_tempat: namaTempat,
    alamat: alamat,
    telepon: telepon
  })
  .then(() => {
    showToast('Garasi berhasil ditambahkan!', 'success');
    renderTable(); // Render ulang tabel setelah data ditambahkan
    // Tutup modal setelah berhasil menambah
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalTambahGarasi'));
    modal.hide();
    // Reset form setelah data ditambahkan
    document.getElementById("formTambahGarasi").reset();
  })
  .catch((error) => {
    console.error("Error adding data: ", error);
    showToast('Gagal menambahkan data!', 'danger');
  });
}

window.tambahGarasi = tambahGarasi;