import { database } from "./config.js";
import {  getDatabase, ref, onValue, push, update, remove , get , child } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

// Ambil data transaksi dari Firebase
const transaksiRef = ref(database, 'transaksi');
const transaksiTableBody = document.getElementById('transaksiTableBody'); // Sesuaikan ID jika perlu
const itemsPerPage = 5;
let dataTransaksi = [];
let filteredDataTransaksi = [];
let currentPage = 1;
let isSearching = false;
window.formatPhoneNumber = formatPhoneNumber;
// Render tabel
export const renderTable = () => {
  transaksiTableBody.innerHTML = '';
  let dataToRender = isSearching ? filteredDataTransaksi : dataTransaksi;
  
  // Filter hanya yang statusnya 'selesai' atau 'dibatalkan'
  dataToRender = dataToRender.filter(item => item.status === 'selesai' || item.status === 'dibatalkan');

  if (dataToRender.length === 0) {
    transaksiTableBody.innerHTML = `
      <tr>
        <td colspan="12" class="text-center">Belum ada data history transaksi yang tersedia.</td>
      </tr>`;
    return;
  }

  // Paginasi
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = dataToRender.slice(startIndex, startIndex + itemsPerPage);
  // Render baris tabel
  paginatedData.forEach((transaksi, index) => {
    const row = `
      <tr>
        <td>${startIndex + index + 1}</td>
        <td>${transaksi.orderId || '-'}</td>
        <td>${transaksi.jenisSewa || '-'}</td>
        <td>${transaksi.namaPenyewa || '-'}</td>
        <td>${transaksi.nomertelephone || '-'}</td>
        <td>${transaksi.rangeSewa || '-'}</td>
        <td>
          ${typeof transaksi.hariSewa === 'number' && transaksi.hariSewa > 0 
            ? `${transaksi.hariSewa} hari` 
            : '-'}
        </td>
        <td>${transaksi.totalHarga ? `Rp${transaksi.totalHarga.toLocaleString()}` : '-'}</td>
        <td>
          ${(() => {
          const pembayaranDiTempat = Number(transaksi.pembayaranDiTempat) || 0;
            
            if(transaksi.jenisSewa === 'lepasKunci') {
              const kompensasi = Number(transaksi.kompensasi) || 0;
              return `Rp${(pembayaranDiTempat + kompensasi).toLocaleString()}`;
            }
            else if(transaksi.jenisSewa === 'denganSupir') {
              const tarifSupir = Number(transaksi.tarifSupir) || 0;
              return `Rp${(pembayaranDiTempat + tarifSupir).toLocaleString()}`;
            }
            return '-';
          })()}
        </td>
        <td>
          <span class = "badge bg-${
            transaksi.status === 'selesai' ? 'primary' :
            transaksi.status === 'dibatalkan' ? 'danger' :
              'secondary'
            } ">
            ${transaksi.status || '-'}
          </span>
        </td>
        <td>${transaksi.namaMobil || '-'}</td>
        <td>
          <button 
            class="btn btn-danger btn-sm"
            onclick="handleDelete('${transaksi.orderId}')"
          >
            <i class="fas fa-trash"></i> Hapus
          </button>
        </td>
      </tr>`;
    transaksiTableBody.innerHTML += row;
  });

  renderPagination();
};

// Tempatkan fungsi ini di bagian atas file atau sebelum digunakan
function formatPhoneNumber(num) {
  if (!num) return null;
  const cleaned = num.toString().replace(/\D/g, '');
  
  // Handle format 08xxx
  if (cleaned.startsWith('0')) {
    return `62${cleaned.slice(1)}`;
  }
  
  // Handle format +628xxx atau 628xxx
  return cleaned.replace(/^\+?62/, '62');
}

const renderPagination = () => {
  const paginationElement = document.getElementById('pagination');
  paginationElement.innerHTML = ''; // Kosongkan elemen pagination sebelumnya

  // Tentukan data yang akan digunakan: apakah hasil pencarian atau data keseluruhan
  let dataToRender = isSearching ? filteredDataTransaksi : dataTransaksi;

  dataToRender = dataToRender.filter(item =>
    item.status === 'selesai' || item.status === 'dibatalkan'
  );

  // Jika data yang tersedia lebih sedikit dari halaman yang dipilih, reset ke halaman 1
  const totalPages = Math.ceil(dataToRender.length / itemsPerPage);
  if (currentPage > totalPages) {
    currentPage = 1; // Reset ke halaman pertama jika jumlah halaman berkurang
  }

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
  const dataToRender = isSearching ? filteredDataTransaksi : dataTransaksi;
  const totalPages = Math.ceil(dataToRender.length / itemsPerPage);

  if (page >= 1 && page <= totalPages) {
    currentPage = page;
    renderTable();
  }
};

// Pencarian transaksi
function searchRental() {
  const input = document.getElementById("searchTransaksi").value.toLowerCase();
  isSearching = input.trim() !== '';

  if (isSearching) {
    filteredDataTransaksi = dataTransaksi.filter(transaksi => {
      return [
        transaksi.orderId?.toLowerCase(),
        transaksi.namaPenyewa?.toLowerCase(),
        transaksi.nomertelephone?.toLowerCase(),
        transaksi.namaMobil.toLowerCase(),
        transaksi.jenisSewa.toLowerCase(),
        transaksi.status?.toLowerCase()
      ].some(field => field?.includes(input));
    });
  } else {
    filteredDataTransaksi = [];
  }

  currentPage = 1;
  renderTable();
}

// Listener data transaksi dari Firebase
onValue(transaksiRef, (snapshot) => {
  const transactions = snapshot.val() || {};
  dataTransaksi = Object.keys(transactions).map(orderId => ({
    ...transactions[orderId],
    orderId
  }));

  const totalPages = Math.ceil(dataTransaksi.length / itemsPerPage);
  if (currentPage > totalPages) currentPage = totalPages > 0 ? totalPages : 1;
  
  renderTable();
});

// Export fungsi ke global scope
window.searchRental = searchRental;
window.changePage = changePage;

function handleDelete(orderId) {
  // Tampilkan konfirmasi menggunakan toast tengah
  showCenterToast(
    'Apakah Anda yakin ingin menghapus History Transaksi ini?',
    'fas fa-exclamation-triangle',
    'Konfirmasi Hapus',
    () => {
      // Jika dikonfirmasi, lanjut hapus
      get(transaksiRef).then((snapshot) => {
        if (snapshot.exists()) {
          const transaksiData = snapshot.val();
          let keyToDelete = null;

          Object.keys(transaksiData).forEach((key) => {
            if (transaksiData[key].orderId === orderId) {
              keyToDelete = key;
            }
          });

          if (keyToDelete) {
            const transaksiToDeleteRef = child(transaksiRef, keyToDelete);
            remove(transaksiToDeleteRef)
              .then(() => {
                showToastalert('Transaksi berhasil dihapus!', 'success', 'fas fa-check-circle');
              })
              .catch((error) => {
                console.error('Error saat menghapus transaksi:', error);
                showToastalert('Gagal menghapus transaksi.', 'danger', 'fas fa-times-circle');
              });
          } else {
            showToastalert('Transaksi tidak ditemukan.', 'warning', 'fas fa-info-circle');
          }
        } else {
          showToastalert('Tidak ada data transaksi.', 'warning', 'fas fa-info-circle');
        }
      }).catch((error) => {
        console.error('Error saat mengambil data transaksi:', error);
        showToastalert('Terjadi kesalahan saat mengambil data.', 'danger', 'fas fa-times-circle');
      });
    }
  );
}

window.handleDelete = handleDelete;

function showToastalert(message, type = 'success', icon = null) {
  const toastEl = document.getElementById('bootstrapToast');
  const toastBody = document.getElementById('bootstrapToastBody');
  const toastContainer = document.getElementById("bootstrapToastContainer");

  // Tampilkan container (jika sempat disembunyikan)
  toastContainer.classList.remove("d-none");

  // Map default icon berdasarkan type
  const defaultIcons = {
    success: 'fas fa-check-circle',
    danger: 'fas fa-times-circle',
    warning: 'fas fa-exclamation-circle',
    info: 'fas fa-info-circle'
  };

  const toastType = ['success', 'danger', 'warning', 'info'].includes(type) ? type : 'success';

  // Reset background dan set yang baru
  toastEl.classList.remove('bg-success', 'bg-danger', 'bg-warning', 'bg-info');
  toastEl.classList.add(`bg-${toastType}`);

  const iconClass = icon || defaultIcons[toastType];

  toastBody.innerHTML = `<i class="${iconClass} me-2"></i>${message}`;

  const toast = new bootstrap.Toast(toastEl);
  toast.show();

  // Sembunyikan container setelah toast menghilang (opsional)
  toastEl.addEventListener('hidden.bs.toast', () => {
    toastContainer.classList.add("d-none");
  });
}


function showCenterToast(message, icon = 'fas fa-info-circle', title = 'Konfirmasi', onConfirm) {
  const container = document.getElementById('centeredToast');
  const content = document.getElementById('centeredToastContent');

  content.innerHTML = `
    <i class="${icon} fa-2x text-warning mb-3"></i>
    <h5 class="fw-bold mb-2">${title}</h5>
    <p class="mb-3">${message}</p>
    <div class="d-flex justify-content-center gap-2">
      <button class="btn btn-danger px-3" id="confirmDeleteBtn"><i class="fas fa-trash-alt me-1"></i>Hapus</button>
      <button class="btn btn-secondary px-3" onclick="document.getElementById('centeredToast').classList.add('d-none')">
        <i class="fas fa-times me-1"></i>Batal
      </button>
    </div>
  `;
  container.classList.remove('d-none');

  // Bind tombol konfirmasi
  setTimeout(() => {
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    if (confirmBtn) {
      confirmBtn.onclick = () => {
        container.classList.add('d-none');
        onConfirm();
      };
    }
  }, 100);
}
