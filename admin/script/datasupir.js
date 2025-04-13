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

// Ambil data sopir dari Firebase
const userRef = ref(database, 'users');
const sopirTableBody = document.getElementById('sopirTableBody');
const itemsPerPage = 5;
let dataSopir = []; // Menyimpan data sopir
let filteredDataSopir = []; // Untuk pencarian
let currentPage = 1;
let isSearching = false;
let userRefCallback = null; // simpan callback listener

// Render tabel
export const renderTable = () => {
  sopirTableBody.innerHTML = '';
  const dataToRender = isSearching ? filteredDataSopir : dataSopir;

  if (dataToRender.length === 0) {
    sopirTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center">Belum ada data sopir yang tersedia.</td>
      </tr>`;
    return;
  }

  // Paginasi
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = dataToRender.slice(startIndex, startIndex + itemsPerPage);

  // Render baris tabel
  paginatedData.forEach((sopir, index) => {
    const row = `
      <tr>
        <td>${startIndex + index + 1}</td>
        <td>${sopir.username || '-'}</td>
        <td>${sopir.telepon || '-'}</td>
        <td>${sopir.email || '-'}</td>
        <td><span class="badge bg-${sopir.status === 'tersedia' ? 'success' : 'danger'}">${sopir.status || '-'}</span></td>
        <td>
          <button 
            class="btn ${getStatusButtonClass(sopir.status)} btn-sm" 
            onclick="toggleStatus('${sopir.key}', '${sopir.status || 'tersedia'}')"
          >
            ${sopir.status || '-'}
          </button>
          <button class="btn btn-danger btn-sm" onclick="hapusSopir('${sopir.key}')">
            <i class="fas fa-trash"></i> Hapus
          </button>
        </td>
      </tr>`;
    sopirTableBody.innerHTML += row;
  });

  renderPagination();
};

// Fungsi helper untuk kelas button
function getStatusButtonClass(status) {
  switch(status) {
    case 'tersedia':
      return 'btn-success';
    case 'tidak tersedia':
      return 'btn-warning';
    default:
      return 'btn-warning'; // Default untuk status lainnya
  }
}

// Fungsi toggle status dengan konfirmasi
async function toggleStatus(key, currentStatus) {
  const action = currentStatus === 'tersedia' ? 'menonaktifkan' : 'mengaktifkan';
  
  if(!confirm(`Anda yakin ingin ${action} sopir ini?`)) {
    return;
  }

  const newStatus = currentStatus === 'tersedia' ? 'tidak tersedia' : 'tersedia';
  
  try {
    const sopirRef = ref(database, `users/${key}`);
    await update(sopirRef, { status: newStatus });
  } catch (error) {
    console.error('Gagal update status:', error);
    alert('Gagal mengubah status');
  }
}

window.toggleStatus = toggleStatus;

// Render paginasi (tetap sama dengan penyesuaian variabel)
const renderPagination = () => {
  const paginationElement = document.getElementById('pagination');
  paginationElement.innerHTML = '';
  const dataToRender = isSearching ? filteredDataSopir : dataSopir;
  const totalPages = Math.ceil(dataToRender.length / itemsPerPage);

  if (totalPages > 1) {
    // Tombol Previous
    paginationElement.innerHTML += `
      <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
        <button class="page-link" onclick="changePage(${currentPage - 1})">Previous</button>
      </li>`;

    // Nomor halaman
    for (let i = 1; i <= totalPages; i++) {
      paginationElement.innerHTML += `
        <li class="page-item ${currentPage === i ? 'active' : ''}">
          <button class="page-link" onclick="changePage(${i})">${i}</button>
        </li>`;
    }

    // Tombol Next
    paginationElement.innerHTML += `
      <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
        <button class="page-link" onclick="changePage(${currentPage + 1})">Next</button>
      </li>`;
  }
};

// Fungsi paginasi (tetap sama)
const changePage = (page) => {
  const dataToRender = isSearching ? filteredDataSopir : dataSopir;
  const totalPages = Math.ceil(dataToRender.length / itemsPerPage);

  if (page >= 1 && page <= totalPages) {
    currentPage = page;
    renderTable();
  }
};

// ✅ Fungsi pencarian untuk data sopir
function searchSopir() {
  const input = document.getElementById("searchSopir").value.toLowerCase();
  isSearching = input.trim() !== '';

  if (isSearching) {
    filteredDataSopir = dataSopir.filter(sopir => {
      // Handle null/undefined dan konversi ke string kosong
      const username = sopir.username?.toLowerCase() || '';
      const telepon = sopir.telepon?.toLowerCase() || '';
      const email = sopir.email?.toLowerCase() || '';
      
      return (
        username.includes(input) ||
        telepon.includes(input) ||
        email.includes(input)
      );
    });
  } else {
    filteredDataSopir = [];
  }

  currentPage = 1;
  renderTable();
  renderPagination();
}

window.searchSopir = searchSopir;
window.changePage = changePage;

// Listener data Firebase untuk sopir
onValue(userRef, (snapshot) => {
  const users = snapshot.val() || {};
  const drivers = [];
  
  Object.keys(users).forEach(key => {
    const user = users[key];
    if (user && user.role === 'drivers') {
      drivers.push({ ...user, key });
    }
  });
  
  dataSopir = drivers;
  const totalPages = Math.ceil(dataSopir.length / itemsPerPage);

  if (currentPage > totalPages) {
    currentPage = totalPages > 0 ? totalPages : 1;
  }

  filteredDataSopir = [];
  renderTable();
  renderPagination();
});

document.getElementById('formTambahSopir').addEventListener('submit', async function (e) {
  e.preventDefault();

  // Flag untuk memastikan hanya satu proses yang berjalan pada waktu tertentu
  if (this.submitting) return; // Jika sudah ada proses, cegah submit lagi
  this.submitting = true; // Tandai bahwa proses sedang berjalan

  try {
    const username = document.getElementById('namaSopir').value.trim();
    const telepon = document.getElementById('teleponSopir').value.trim();
    const email = document.getElementById('emailSopir').value.trim();

    const sopirRef = ref(database, 'users');
    const snapshot = await get(sopirRef);

    let usernameExists = false;
    let teleponExists = false;
    let emailExists = false;

    snapshot.forEach(childSnapshot => {
      const data = childSnapshot.val();
      if (data.username === username) usernameExists = true;
      if (data.telepon === telepon) teleponExists = true;
      if (data.email === email) emailExists = true;
    });

    if (usernameExists) {
      showToast('Username sudah digunakan. Silakan pilih username lain!', 'danger');
      this.submitting = false; // Reset flag
      return;
    }

    if (teleponExists) {
      showToast('Nomor telepon sudah terdaftar. Silakan gunakan nomor lain!', 'danger');
      this.submitting = false; // Reset flag
      return;
    }

    if (emailExists) {
      showToast('Email sudah terdaftar. Silakan gunakan email lain!', 'danger');
      this.submitting = false; // Reset flag
      return;
    }

    // Generate salt dan hash password
    const salt = generateRandomString(32);
    const password = await hashPassword(username + salt);

    const sopirData = {
      username: username,
      telepon: telepon,
      email: email,
      status: document.getElementById('statusSopir').value,
      role: "drivers",
      password: password,
      salt: salt,
      soal_verifikasi: "siapa nama anda?",
      jawaban_verifikasi: username.toLowerCase(),
      created_at: new Date().toISOString()
    };

    await push(sopirRef, sopirData);
    showToast('Supir berhasil ditambahkan', 'success');
    document.getElementById('formTambahSopir').reset();

    // Tutup modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalTambahSopir'));
    modal.hide();

  } catch (error) {
    console.error('Error adding sopir:', error);
    showToast('Gagal menambahkan supir', 'danger');
  } finally {
    this.submitting = false; // Reset flag setelah proses selesai
  }
});

// Fungsi generate random string untuk salt
function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Fungsi hash password SHA-256
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function hapusSopir(key) {
  if (confirm('Apakah Anda yakin ingin menghapus sopir ini?')) {
    try {
      const sopirRef = ref(database, `users/${key}`);
      remove(sopirRef)
        .then(() => {
          showToast('Supir berhasil dihapus', 'succes');
        })
        .catch((error) => {
          console.error('Gagal menghapus sopir:', error);
          alert('Gagal menghapus sopir');
        });
    } catch (error) {
      console.error('Error:', error);
      alert('Terjadi kesalahan saat menghapus');
    }
  }
}

window.hapusSopir = hapusSopir;

function setupListener() {
  // Kalau sebelumnya sudah ada listener, matikan dulu
  if (userRefCallback) {
    off(userRef, userRefCallback);
  }

  userRefCallback = (snapshot) => {
    const users = snapshot.val() || {};
    const drivers = [];
  
    Object.keys(users).forEach(key => {
      const user = users[key];
      if (user && user.role === 'drivers') {
        drivers.push({ ...user, key });
      }
    });
  
    dataSopir = drivers;
    renderTable();
  };

  onValue(userRef, userRefCallback);
}

// Panggil setup listener ketika halaman dipanggil
setupListener();