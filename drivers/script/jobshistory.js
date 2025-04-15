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

  // Ambil nama supir dari sessionStorage
  const targetSupir = sessionStorage.getItem("username");

  // Filter hanya yang statusnya 'selesai' dan namasupir sesuai
  dataToRender = dataToRender.filter(item =>
    item.status === 'selesai' && item.namasupir === targetSupir
  );

  // Urutkan data - status 'terlambat' dulu jika ada (meskipun di atas kita hanya ambil yang 'selesai')
  dataToRender = [...dataToRender].sort((a, b) => {
    if (a.status === 'terlambat' && b.status !== 'terlambat') return -1;
    if (b.status === 'terlambat' && a.status !== 'terlambat') return 1;
    return 0;
  });

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
          <span class="badge bg-${
            transaksi.status === 'selesai' ? 'primary' : 'primary'
          }">
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

// Render paginasi (tetap sama dengan penyesuaian variabel)
const renderPagination = () => {
  const paginationElement = document.getElementById('pagination');
  paginationElement.innerHTML = '';
  const dataToRender = isSearching ? filteredDataTransaksi : dataTransaksi;
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

// Function untuk handle delete
function handleDelete(orderId) {
  // Konfirmasi sebelum hapus
  if (!confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
    return;
  }

  // Cari transaksi dengan orderId yang sesuai
  get(transaksiRef).then((snapshot) => {
    if (snapshot.exists()) {
      const transaksiData = snapshot.val();
      let keyToDelete = null;

      // Loop data untuk cari key yang sesuai dengan orderId
      Object.keys(transaksiData).forEach((key) => {
        if (transaksiData[key].orderId === orderId) {
          keyToDelete = key;
        }
      });

      if (keyToDelete) {
        // Hapus data berdasarkan key yang ditemukan
        const transaksiToDeleteRef = child(transaksiRef, keyToDelete);
        remove(transaksiToDeleteRef)
          .then(() => {
            alert('Transaksi berhasil dihapus.');
          })
          .catch((error) => {
            console.error('Error saat menghapus transaksi:', error);
            alert('Terjadi kesalahan saat menghapus transaksi.');
          });
      } else {
        alert('Transaksi tidak ditemukan.');
      }
    } else {
      alert('Tidak ada data transaksi.');
    }
  }).catch((error) => {
    console.error('Error saat mengambil data transaksi:', error);
    alert('Terjadi kesalahan saat mengambil data transaksi.');
  });
}

window.handleDelete = handleDelete;
