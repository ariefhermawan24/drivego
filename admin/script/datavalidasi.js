import { database } from "./config.js";
import {  getDatabase, ref, onValue, push, update, child , get , set } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

const showToast = (message, type = 'success') => {
  const toastElement = document.getElementById('toastNotification');
  const toastBody = toastElement.querySelector('.toast-body');

  toastElement.classList.remove('text-bg-success', 'text-bg-danger', 'text-bg-warning');
  toastElement.classList.add(`text-bg-${type}`);
  toastBody.textContent = message;

  const toast = new bootstrap.Toast(toastElement);
  toast.show();
};

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
        <td colspan="12" class="text-center">Belum ada data validasi transaksi yang tersedia.</td>
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

const renderPagination = () => {
  const paginationElement = document.getElementById('pagination');
  paginationElement.innerHTML = ''; // Kosongkan elemen pagination sebelumnya

  // Tentukan data yang akan digunakan: apakah hasil pencarian atau data keseluruhan
  let dataToRender = isSearching ? filteredDataTransaksi : dataTransaksi;

  // Filter: Hanya ambil data dengan status 'pending'
  dataToRender = dataToRender.filter(transaksi => transaksi.status === 'pending');

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
      showToastalert('Transaksi Ditolak!', 'success');
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
        showToastalert('Transaksi ini sudah diterima sebelumnya.', 'danger');
        btnTerima.disabled = false; // Re-enable tombol
        return;
      }

      // Proses validasi untuk kedua jenis sewa
      if (data.jenisSewa === 'lepasKunci') {
        if (areAllCheckedLepasKunci()) {
          const updatedData = { ...data, status: 'disewa' };

          // Set data transaksi
          set(transaksiPath, updatedData).then(() => {
            alert('Transaksi diterima!');
            $('#validasiModal').modal('hide');

            // Mengupdate status mobil yang disewa
            const targetMobilRef = ref(database, 'mobil');
            get(targetMobilRef).then(snapshot => {
              if (snapshot.exists()) {
                const dataMobil = snapshot.val();

                for (const key in dataMobil) {
                  if (dataMobil[key].nama_mobil === data.namaMobil) {
                    const mobilRef = ref(database, `mobil/${key}`);
                    // Update status mobil menjadi 'disewa'
                    update(mobilRef, { status: 'disewa' })
                      .then(() => {
                        console.log('Status mobil berhasil diubah menjadi disewa.');
                        setTimeout(() => {
                          location.reload();
                        }, 500);
                      })
                      .catch(error => {
                        console.error('Gagal mengubah status mobil:', error);
                      });
                    break;
                  }
                }
              } else {
                console.error('Mobil tidak ditemukan di database.');
              }
            }).catch(error => {
              console.error('Gagal mengambil data mobil:', error);
            });

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
                  status: 'disewa',
                  telephonesupir: driverData.telepon || '',
                  namasupir: driverData.username || ''
                };

                // Set data transaksi
                set(transaksiPath, updatedData).then(() => {
                  // Setelah transaksi sukses, update status supir jadi "bertugas"
                  return set(child(usersRef, `${selectedDriverId}/status`), 'bertugas');
                }).then(() => {
                  showToastalert('Transaksi diterima dan supir telah ditetapkan!', 'success');
                  $('#validasiModal').modal('hide');

                  // Mengupdate status mobil yang disewa
                  const targetMobilRef = ref(database, 'mobil');
                  get(targetMobilRef).then(snapshot => {
                    if (snapshot.exists()) {
                      const dataMobil = snapshot.val();

                      for (const key in dataMobil) {
                        if (dataMobil[key].nama_mobil === data.namaMobil) {
                          const mobilRef = ref(database, `mobil/${key}`);
                          // Update status mobil menjadi 'disewa'
                          update(mobilRef, { status: 'disewa' })
                            .then(() => {
                              console.log('Status mobil berhasil diubah menjadi disewa.');
                              setTimeout(() => {
                                location.reload();
                              }, 500);
                            })
                            .catch(error => {
                              console.error('Gagal mengubah status mobil:', error);
                            });
                          break;
                        }
                      }
                    } else {
                      console.error('Mobil tidak ditemukan di database.');
                    }
                  }).catch(error => {
                    console.error('Gagal mengambil data mobil:', error);
                  });

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

    document.getElementById('linkimgKTP').href = data.fotoKTP || '';
    document.getElementById('linkimgSIM').href = data.fotoSIM || '';
    document.getElementById('linkimgVerifikasi').href = data.fotoVerifikasi || '';
    document.getElementById('linkimgBuktiBayarLK').href = data.buktiBayar || '';
  } else {
    document.getElementById('imgBuktiBayarDS').src = data.buktiBayar || '';

    document.getElementById('linkBuktiBayarDS').href = data.buktiBayar || '';
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
