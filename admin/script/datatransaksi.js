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
  // Tampilkan alert konfirmasi dulu
  const konfirmasi = confirm(`Apakah Anda yakin ingin menyelesaikan transaksi ${orderId}?`);

  if (!konfirmasi) {
    return; // Kalau user klik "Cancel", proses berhenti di sini
  }

  const transaksiRef = ref(database, 'transaksi/' + orderId);

  // Ambil dulu data transaksi untuk mendapatkan nama supir dan mobil
  get(transaksiRef).then((snapshot) => {
    if (snapshot.exists()) {
      const transaksiData = snapshot.val();
      const namaSupir = transaksiData.namasupir;
      const mobil = transaksiData.namaMobil;

      // Cari mobil yang memiliki nama_mobil yang sesuai dengan nama mobil di transaksi
      const mobilRef = ref(database, 'mobil'); // Path untuk data mobil
      return get(mobilRef).then((mobilSnapshot) => {
        if (mobilSnapshot.exists()) {
          const mobilData = mobilSnapshot.val();

          // Mencari mobil yang statusnya sesuai dengan nama_mobil dari transaksi
          for (const mobilId in mobilData) {
            const mobilItem = mobilData[mobilId];
            if (mobilItem.nama_mobil === mobil) {
              const mobilRefUpdate = ref(database, `mobil/${mobilId}`);

              // Update status mobil menjadi 'tersedia'
              return update(mobilRefUpdate, {
                  status: 'tersedia'
                })
                .then(() => {
                  console.log(`Status mobil ${mobil} berhasil diubah menjadi tersedia.`);

                  // Setelah mobil selesai, update status transaksi menjadi 'selesai'
                  const transaksiRefUpdate = ref(database, 'transaksi/' + orderId);
                  return update(transaksiRefUpdate, {
                      status: 'selesai'
                    })
                    .then(() => {
                      alert(`Transaksi ${orderId} berhasil diubah menjadi Selesai.`);

                      if (namaSupir) {
                        const usersRef = ref(database, 'users');

                        // Cari user yang rolenya 'driver' dan username-nya sesuai dengan namasupir
                        return get(usersRef).then((usersSnapshot) => {
                          if (usersSnapshot.exists()) {
                            const usersData = usersSnapshot.val();

                            for (const userId in usersData) {
                              const user = usersData[userId];

                              if (user.role === 'drivers' && user.username === namaSupir) {
                                const driverRef = ref(database, `users/${userId}`);

                                // Update status driver menjadi 'tersedia'
                                return update(driverRef, {
                                    status: 'tersedia'
                                  })
                                  .then(() => {
                                    console.log(`Status supir ${namaSupir} berhasil diubah menjadi tersedia.`);
                                    location.reload(); // Optional, refresh tampilan setelah selesai semua proses
                                  });
                              }
                            }
                          }
                        });
                      } else {
                        location.reload(); // Kalau nggak ada supir, langsung reload
                      }
                    });
                });
            }
          }
        }
      });
    } else {
      alert('Data transaksi tidak ditemukan.');
    }
  }).catch((error) => {
    console.error("Gagal update status:", error);
    alert('Terjadi kesalahan saat mengubah status. Silakan coba lagi.');
  });
}


window.handleReturn = handleReturn;
