import { database } from "./config.js";
import {  getDatabase, ref, onValue, push, update, child , get , set } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

// Ambil data transaksi dari Firebase
const transaksiRef = ref(database, 'transaksi');
const transaksiTableBody = document.getElementById('transaksiTableBody'); // Sesuaikan ID jika perlu
const itemsPerPage = 5;
let dataTransaksi = [];
let filteredDataTransaksi = [];
let currentPage = 1;
let isSearching = false;
// Render tabel
export const renderTable = () => {
  transaksiTableBody.innerHTML = '';
  let dataToRender = isSearching ? filteredDataTransaksi : dataTransaksi;

  // Filter: Hanya ambil data dengan status 'pending'
  dataToRender = dataToRender.filter(transaksi => transaksi.status === 'pending');

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
          <button class="btn btn-success btn-sm" onclick="validasi('${transaksi.orderId}')">
            <i class="fas fa-check"></i> Validasi
          </button>
        </td>
      </tr>`;
    transaksiTableBody.innerHTML += row;
  });

  renderPagination();
};

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

// Fungsi untuk buka modal dan load data
function validasi(orderId) {
  const transaksiPath = child(transaksiRef, orderId);
  get(transaksiPath).then(snapshot => {
    const data = snapshot.val();

    if (!data) {
      alert('Data transaksi tidak ditemukan!');
      return;
    }

    // Reset form
    document.getElementById('formLepasKunci').classList.add('d-none');
    document.getElementById('formDenganSupir').classList.add('d-none');

    // Tampilkan form sesuai jenisSewa
    if (data.jenisSewa === 'lepasKunci') {
      document.getElementById('formLepasKunci').classList.remove('d-none');
    } else if (data.jenisSewa === 'denganSupir') {
      document.getElementById('formDenganSupir').classList.remove('d-none');
    }

    tampilkanGambar(data.jenisSewa, data);
    if (data.jenisSewa === 'denganSupir') loadSupir();

    // Buka modal
    $('#validasiModal').modal('show');

    // Monitor status checkbox
    monitorCheckboxes(data);
  }).catch(error => {
    console.error(error);
    alert('Terjadi kesalahan saat mengambil data!');
  });
}

function monitorCheckboxes(data) {
  const checkboxes = document.querySelectorAll('.form-check-input');
  const btnTerima = document.getElementById('btnTerima');
  const btnTolak = document.getElementById('btnTolak');

  // Mendapatkan referensi ke checkbox dari kedua form
  const checkboxesLepasKunci = document.querySelectorAll('#formLepasKunci .form-check-input');
  const checkboxesDenganSupir = document.querySelectorAll('#formDenganSupir .form-check-input');

  // Fungsi untuk memeriksa apakah semua checkbox di form Lepas Kunci dicentang
  const areAllCheckedLepasKunci = () => {
    return Array.from(checkboxesLepasKunci).every(checkbox => checkbox.checked);
  };

  // Fungsi untuk memeriksa apakah semua checkbox di form Dengan Supir dicentang
  const areAllCheckedDenganSupir = () => {
    return Array.from(checkboxesDenganSupir).every(checkbox => checkbox.checked);
  };

  // Mengaktifkan atau menonaktifkan tombol "Terima" berdasarkan checkbox yang dicentang
  const toggleBtnTerima = () => {
    if (data.jenisSewa === 'lepasKunci') {
      if (areAllCheckedLepasKunci()) {
        btnTerima.disabled = false;
      } else {
        btnTerima.disabled = true;
      }
    } else if (data.jenisSewa === 'denganSupir') {
      if (areAllCheckedDenganSupir()) {
        btnTerima.disabled = false;
      } else {
        btnTerima.disabled = true;
      }
    }
  };

  // Menambahkan event listener pada setiap checkbox di form Lepas Kunci dan Dengan Supir
  checkboxesLepasKunci.forEach(checkbox => {
    checkbox.addEventListener('change', toggleBtnTerima);
  });

  checkboxesDenganSupir.forEach(checkbox => {
    checkbox.addEventListener('change', toggleBtnTerima);
  });

  // Klik pada tombol "Tolak"
  btnTolak.addEventListener('click', () => {
    const transaksiPath = child(transaksiRef, data.orderId);
    set(transaksiPath, { ...data, status: 'rejected' }).then(() => {
      alert('Transaksi ditolak!');
      $('#validasiModal').modal('hide');
    }).catch(error => {
      console.error('Gagal memperbarui status transaksi:', error);
      alert('Terjadi kesalahan saat menolak transaksi.');
    });
  });

  btnTerima.addEventListener('click', () => {
  // Disable tombol agar tidak double click
  btnTerima.disabled = true;

  const transaksiPath = child(transaksiRef, data.orderId);

  // Cek apakah transaksi sudah ada dan status sudah accepted
  get(transaksiPath).then(snapshot => {
    if (snapshot.exists() && snapshot.val().status === 'accepted') {
      alert('Transaksi ini sudah diterima sebelumnya.');
      btnTerima.disabled = false; // Re-enable tombol
      return;
    }

    // Proses validasi untuk kedua jenis sewa
    if (data.jenisSewa === 'lepasKunci') {
      if (areAllCheckedLepasKunci()) {
        const updatedData = { ...data, status: 'accepted' };

        set(transaksiPath, updatedData).then(() => {
          alert('Transaksi diterima!');
          $('#validasiModal').modal('hide');
        }).catch(error => {
          console.error('Gagal memperbarui status transaksi:', error);
          alert('Terjadi kesalahan saat menerima transaksi.');
        }).finally(() => {
          btnTerima.disabled = false; // Re-enable tombol
        });
      } else {
        alert('Pastikan semua validasi checkbox Lepas Kunci telah dicentang!');
        btnTerima.disabled = false;
      }
    } else if (data.jenisSewa === 'denganSupir') {
      if (areAllCheckedDenganSupir()) {
        const selectedDriverId = document.getElementById('driverDropdown').value;

        if (selectedDriverId) {
          const driverPath = child(usersRef, selectedDriverId);

          get(driverPath).then(driverSnapshot => {
            const driverData = driverSnapshot.val();

            if (driverData) {
              const updatedData = {
                ...data,
                status: 'accepted',
                telephonesupir: driverData.telepon || '',
                namasupir: driverData.username || ''
              };

              set(transaksiPath, updatedData).then(() => {
                // Setelah transaksi sukses, update status supir jadi "bertugas"
                return set(child(usersRef, `${selectedDriverId}/status`), 'bertugas');
              }).then(() => {
                alert('Transaksi diterima dan supir telah ditetapkan!');
                $('#validasiModal').modal('hide');
              }).catch(error => {
                console.error('Gagal memproses transaksi atau update status supir:', error);
                alert('Terjadi kesalahan saat memproses transaksi.');
              }).finally(() => {
                btnTerima.disabled = false;
              });
            } else {
              alert('Supir yang dipilih tidak valid.');
              btnTerima.disabled = false;
            }
          }).catch(error => {
            console.error('Gagal mengambil data supir:', error);
            alert('Terjadi kesalahan saat mengambil data supir.');
            btnTerima.disabled = false;
          });
        } else {
          alert('Harap pilih supir terlebih dahulu.');
          btnTerima.disabled = false;
        }
      } else {
        alert('Pastikan semua validasi checkbox Dengan Supir telah dicentang!');
        btnTerima.disabled = false;
      }
    }
  }).catch(error => {
    console.error('Gagal memeriksa transaksi:', error);
    alert('Terjadi kesalahan saat memeriksa transaksi.');
    btnTerima.disabled = false;
  });
});
}

// Ambil dan tampilkan gambar
function tampilkanGambar(formType, data) {
  if (formType === 'lepasKunci') {
    document.getElementById('imgKTP').src = data.fotoKTP || '';
    document.getElementById('imgSIM').src = data.fotoSIM || '';
    document.getElementById('imgVerifikasi').src = data.fotoVerifikasi || '';
    document.getElementById('imgBuktiBayarLK').src = data.buktiBayar || '';
  } else {
    document.getElementById('imgBuktiBayarDS').src = data.buktiBayar || '';
  }
}

// Referensi ke users di database
const usersRef = ref(database, 'users');

// Fungsi untuk memuat dropdown driver
function loadSupir() {
  const driverDropdown = document.getElementById('driverDropdown');
  driverDropdown.innerHTML = '<option value="">Memuat supir...</option>';

  // Ambil data users
  get(usersRef).then(snapshot => {
    if (snapshot.exists()) {
      const usersData = snapshot.val();

      // Kosongkan dropdown dulu
      driverDropdown.innerHTML = '<option value="">Pilih Supir</option>';

      // Loop data user
      Object.keys(usersData).forEach(userId => {
        const user = usersData[userId];

        // Filter hanya yang role = drivers dan status = tersedia
        if (user.role === 'drivers' && user.status === 'tersedia') {
          const option = document.createElement('option');
          option.value = userId;
          option.text = user.username || 'Nama Tidak Diketahui'; // Menambahkan default 'Nama Tidak Diketahui'
          driverDropdown.appendChild(option);
        }
      });
    } else {
      console.log('Tidak ada data user.');
    }
  }).catch(error => {
    console.error('Error mengambil data users:', error);
  });
}

// Memanggil fungsi validasi
window.validasi = validasi;