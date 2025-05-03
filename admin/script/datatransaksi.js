import { database } from "./config.js";
import {  getDatabase, ref, onValue, push, update, remove , get , child } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

const parseTanggal = (tanggalString) => {
  const bulanMap = {
    Januari: '01',
    Februari: '02',
    Maret: '03',
    April: '04',
    Mei: '05',
    Juni: '06',
    Juli: '07',
    Agustus: '08',
    September: '09',
    Oktober: '10',
    November: '11',
    Desember: '12'
  };

  const [hari, bulan, tahun] = tanggalString.split(' ');
  const bulanAngka = bulanMap[bulan];
  return new Date(`${tahun}-${bulanAngka}-${hari}`);
};

// Fungsi untuk mengupdate status transaksi yang terlambat
const updateLateTransactions = () => {
  const today = new Date();
  const db = getDatabase();
  const transaksiRef = ref(db, "transaksi");

  // Ambil semua transaksi dan cek tanggalAkhirSewa
  onValue(transaksiRef, (snapshot) => {
    const dataTransaksi = snapshot.val();
    if (dataTransaksi) {
      Object.keys(dataTransaksi).forEach((orderId) => {
        const transaksi = dataTransaksi[orderId];

        // Hanya proses transaksi yang statusnya 'disewa'
        if (transaksi.status === "disewa") {
          const tanggalAkhirSewa = parseTanggal(transaksi.tanggalAkhirSewa);

          // Cek apakah tanggal akhir sewa sudah lewat hari ini
          if (tanggalAkhirSewa < today) {
            // Update status di Firebase Realtime Database
            const transaksiPath = ref(db, `transaksi/${orderId}`);
            update(transaksiPath, { status: "terlambat" })
              .then(() => {
                console.log(`Status transaksi ${orderId} berhasil diperbarui menjadi 'terlambat'`);
              })
              .catch((error) => {
                console.error("Error memperbarui status:", error);
              });
          }
        }
      });
    }
  });
};

// Panggil fungsi untuk memperbarui transaksi terlambat sebelum merender tabel
updateLateTransactions();

function isTodayInRange(rangeSewa) {
  if (!rangeSewa) return false;

  const [startStr, endStr] = rangeSewa.split(' - ');
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Hilangkan jam supaya fair comparison

  const parseDate = (dateStr) => {
    const [day, monthName, year] = dateStr.split(' ');
    const months = {
      "Januari": 0,
      "Februari": 1,
      "Maret": 2,
      "April": 3,
      "Mei": 4,
      "Juni": 5,
      "Juli": 6,
      "Agustus": 7,
      "September": 8,
      "Oktober": 9,
      "November": 10,
      "Desember": 11
    };
    return new Date(year, months[monthName], day);
  };

  const startDate = parseDate(startStr);
  const endDate = parseDate(endStr);

  return today >= startDate && today <= endDate;
}

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

  dataToRender = dataToRender.filter(item =>
    !['selesai', 'dibatalkan'].includes(item.status)
  );

  // Urutkan data - status terlambat pertama
  dataToRender = [...dataToRender].sort((a, b) => {
    if (a.status === 'terlambat' && b.status !== 'terlambat') return -1;
    if (b.status === 'terlambat' && a.status !== 'terlambat') return 1;
    return 0;
  });

  if (dataToRender.length === 0) {
    transaksiTableBody.innerHTML = `
      <tr>
        <td colspan="12" class="text-center">Belum ada data transaksi yang tersedia.</td>
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
            transaksi.status === 'pending' ? 'warning' :
            transaksi.status === 'disewa' ? 'success' :
            transaksi.status === 'terlambat' ? 'danger' :
            transaksi.status === 'selesai' ? 'secondary' : 'primary'
          }">
            ${transaksi.status || '-'}
          </span>
        </td>
        <td>${transaksi.namaMobil || '-'}</td>
        <td>
          <!-- Tautan Penyewa -->
          <a 
            class="btn btn-success btn-sm ${!transaksi.nomertelephone ? 'disabled' : ''}" 
            href="${transaksi.nomertelephone ? `https://wa.me/${formatPhoneNumber(transaksi.nomertelephone)}` : '#'}" 
            target="_blank"
            ${!transaksi.nomertelephone ? 'disabled aria-disabled="true"' : ''}
            style="${!transaksi.nomertelephone ? 'pointer-events: none;' : ''}"
          >
            <i class="fab fa-whatsapp"></i> Penyewa
          </a>

          <!-- Tautan Supir -->
          <a 
            class="btn btn-success btn-sm ${!transaksi.telephonesupir ? 'disabled' : ''}" 
            href="${transaksi.telephonesupir ? `https://wa.me/${formatPhoneNumber(transaksi.telephonesupir)}` : '#'}" 
            target="_blank"
            ${!transaksi.telephonesupir ? 'disabled aria-disabled="true"' : ''}
            style="${!transaksi.telephonesupir ? 'pointer-events: none;' : ''}"
          >
            <i class="fab fa-whatsapp"></i> Supir
          </a>
          <!-- Tombol Pick Up -->
          <button 
            class="btn btn-primary btn-sm ${transaksi.status === 'disewa' || transaksi.status === 'terlambat' ? '' : 'disabled'}"
            ${transaksi.status === 'disewa' || transaksi.status === 'terlambat' ? '' : 'disabled aria-disabled="true"'}
            style="${transaksi.status === 'disewa' || transaksi.status === 'terlambat' ? '' : 'pointer-events: none;'}"
            onclick="handleReturn('${transaksi.orderId}')"
          >
            <i class="fas fa-undo"></i> Kembalikan
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

  // Filter: Buang data yang statusnya 'selesai' atau 'dibatalkan'
  dataToRender = dataToRender.filter(item => item.status !== 'selesai' && item.status !== 'dibatalkan');

  // Tentukan jumlah halaman berdasarkan data yang sudah difilter
  const totalPages = Math.ceil(dataToRender.length / itemsPerPage);

  // Jika data yang tersedia lebih sedikit dari halaman yang dipilih, reset ke halaman 1
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

function handleReturn(orderId) {
  showCenterToast(
    `
    Apakah Anda yakin ingin menyelesaikan transaksi <strong>${orderId}</strong>?<br>
    <small class="text-warning d-block mt-2"><i class="fas fa-exclamation-circle me-1"></i>Pastikan mobil sudah kembali sebelum diselesaikan.</small>
    `,
    'fas fa-clipboard-check',
    'Konfirmasi Selesaikan Transaksi',
    () => {
      const transaksiRef = ref(database, 'transaksi/' + orderId);

      get(transaksiRef).then((snapshot) => {
        if (snapshot.exists()) {
          const transaksiData = snapshot.val();
          const namaSupir = transaksiData.namasupir;
          const mobil = transaksiData.namaMobil;

          const mobilRef = ref(database, 'mobil');

          return get(mobilRef).then((mobilSnapshot) => {
            if (mobilSnapshot.exists()) {
              const mobilData = mobilSnapshot.val();

              for (const mobilId in mobilData) {
                const mobilItem = mobilData[mobilId];
                if (mobilItem.nama_mobil === mobil) {
                  const mobilRefUpdate = ref(database, `mobil/${mobilId}`);

                  return update(mobilRefUpdate, {
                    status: 'tersedia'
                  }).then(() => {
                    const transaksiRefUpdate = ref(database, 'transaksi/' + orderId);
                    return update(transaksiRefUpdate, {
                      status: 'selesai'
                    }).then(() => {
                      showToastalert(`Transaksi <strong>${orderId}</strong> berhasil diselesaikan.`, 'success', 'fas fa-check-circle');

                      if (namaSupir) {
                        const usersRef = ref(database, 'users');
                        return get(usersRef).then((usersSnapshot) => {
                          if (usersSnapshot.exists()) {
                            const usersData = usersSnapshot.val();

                            for (const userId in usersData) {
                              const user = usersData[userId];
                              if (user.role === 'drivers' && user.username === namaSupir) {
                                const driverRef = ref(database, `users/${userId}`);
                                return update(driverRef, {
                                  status: 'tersedia'
                                }).then(() => {
                                  showToastalert(`Supir <strong>${namaSupir}</strong> sekarang tersedia.`, 'info', 'fas fa-user-check');
                                  setTimeout(() => location.reload(), 1000);
                                });
                              }
                            }
                          }
                        });
                      } else {
                        setTimeout(() => location.reload(), 1000);
                      }
                    });
                  });
                }
              }
            }
          });
        } else {
          showToastalert('Data transaksi tidak ditemukan.', 'warning', 'fas fa-exclamation-triangle');
        }
      }).catch((error) => {
        console.error("Gagal update status:", error);
        showToastalert('Terjadi kesalahan saat mengubah status.', 'danger', 'fas fa-times-circle');
      });
    }
  );
}

window.handleReturn = handleReturn;

function showToastalert(message, type = 'success', icon = null) {
  const toastEl = document.getElementById('bootstrapToast');
  const toastBody = document.getElementById('bootstrapToastBody');

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
}


function showCenterToast(message, icon = 'fas fa-info-circle', title = 'Konfirmasi', onConfirm, confirmLabel = 'selesaikan') {
  const container = document.getElementById('centeredToast');
  const content = document.getElementById('centeredToastContent');

  content.innerHTML = `
    <div class="text-center px-3">
      <i class="${icon} fa-3x text-warning mb-3"></i>
      <h5 class="fw-bold mb-3">${title}</h5>
      <p class="mb-3">${message}</p>
      <div class="d-flex justify-content-center gap-3">
        <button class="btn btn-success px-4" id="confirmBtn">
          <i class="fas fa-check-circle me-2"></i>${confirmLabel}
        </button>
        <button class="btn btn-secondary px-4" onclick="document.getElementById('centeredToast').classList.add('d-none')">
          <i class="fas fa-times me-2"></i>Batal
        </button>
      </div>
    </div>
  `;

  container.classList.remove('d-none');

  setTimeout(() => {
    const confirmBtn = document.getElementById('confirmBtn');
    if (confirmBtn) {
      confirmBtn.onclick = () => {
        container.classList.add('d-none');
        onConfirm();
      };
    }
  }, 100);
}
