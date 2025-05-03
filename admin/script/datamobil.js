import { database } from "../script/config.js";
import { ref, onValue, push, update, remove , get } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

const showToast = (message, type = 'success') => {
  const toastElement = document.getElementById('toastNotification');
  const toastBody = toastElement.querySelector('.toast-body');

  toastElement.classList.remove('text-bg-success', 'text-bg-danger', 'text-bg-warning');
  toastElement.classList.add(`text-bg-${type}`);
  toastBody.textContent = message;

  const toast = new bootstrap.Toast(toastElement);
  toast.show();
};

const mobilRef = ref(database, 'mobil');
const mobilTableBody = document.getElementById('mobilTableBody');
const itemsPerPage = 5;
let currentPage = 1;
let dataMobil = [];
let filteredDataMobil = []; // Tambahan untuk data hasil search
let isSearching = false;
let dataGarasi = []; // <-- pastikan ini ditulis di sini!
let initialMobilData = null; // Simpan data awal di sini

// Ambil data garasi dari Firebase
const garasiRef = ref(database, 'garasi');
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


// Fungsi untuk dapatkan nama garasi dari id_tempat
const getNamaGarasi = (id_tempat) => {
  const garasi = dataGarasi?.[id_tempat];
  return garasi ? garasi.nama_tempat : '-';
};

 export const renderTable = () => {
  mobilTableBody.innerHTML = '';

  const dataToRender = isSearching ? filteredDataMobil : dataMobil;
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginatedItems = dataToRender.slice(start, end);

  if (paginatedItems.length === 0) {
    mobilTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center">
          ${isSearching ? 'Mobil tidak ditemukan.' : 'Belum ada data mobil yang tersedia.'}
        </td>
      </tr>
    `;
    return;
  }

  paginatedItems.forEach((mobil, index) => {
    const row = `
      <tr>
        <td>${start + index + 1}</td>
        <td>${mobil.nama_mobil || '-'}</td>
        <td>${mobil.merk_mobil || '-'}</td>
        <td>${mobil.tahun || '-'}</td>
        <td>${mobil.warna || '-'}</td>
        <td>${mobil.transmisi || '-'}</td>
        <td>${mobil.bahan_bakar || '-'}</td>
        <td>${mobil.jumlah_tempat_duduk || '-'}</td>
        <td>Rp ${mobil.harga_sewa ? mobil.harga_sewa.toLocaleString() : '-'}</td>
        <td><span class="badge bg-${mobil.status === 'tersedia' ? 'success' : 'danger'}">${mobil.status || '-'}</span></td>
        <td>${getNamaGarasi(mobil.id_tempat)}</td>
        <td>${mobil.tipe_mobil || '-'}</td>
        <td>
          <button class="btn btn-warning btn-sm" onclick="editMobil('${mobil.key}')"><i class="fas fa-edit"></i> Edit</button>
          <button class="btn btn-danger btn-sm" onclick="hapusMobil('${mobil.key}')"><i class="fas fa-trash"></i> Hapus</button>
        </td>
      </tr>
    `;
    mobilTableBody.innerHTML += row;
  });
};

const renderPagination = () => {
  const paginationElement = document.getElementById('pagination');
  paginationElement.innerHTML = '';

  const dataToRender = isSearching ? filteredDataMobil : dataMobil;
  const totalPages = Math.ceil(dataToRender.length / itemsPerPage);

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


const changePage = (page) => {
  const dataToRender = filteredDataMobil.length > 0 ? filteredDataMobil : dataMobil;
  const totalPages = Math.ceil(dataToRender.length / itemsPerPage);

  if (page >= 1 && page <= totalPages) {
    currentPage = page;
    renderTable();
    renderPagination();
  }
};

onValue(mobilRef, (snapshot) => {
  dataMobil = [];
  snapshot.forEach((childSnapshot) => {
    dataMobil.push({ key: childSnapshot.key, ...childSnapshot.val() });
  });

  const totalPages = Math.ceil(dataMobil.length / itemsPerPage);

  if (currentPage > totalPages) {
    currentPage = totalPages > 0 ? totalPages : 1;
  }

  filteredDataMobil = []; // Reset filter saat data berubah
  renderTable();
  renderPagination();
});

// ✅ Ini fungsi search yang benar untuk semua halaman
function searchTable() {
  let input = document.getElementById("searchMobil").value.toLowerCase();
  isSearching = input.trim() !== '';

  if (isSearching) {
    filteredDataMobil = dataMobil.filter(mobil => {
      return (
        mobil.nama_mobil.toLowerCase().includes(input) ||
        mobil.merk_mobil.toLowerCase().includes(input) ||
        mobil.status.toLowerCase().includes(input) ||
        mobil.harga_sewa.toString().includes(input)
      );
    });
  } else {
    filteredDataMobil = [];
  }

  currentPage = 1; // reset ke halaman pertama
  renderTable();
  renderPagination();
}


window.searchTable = searchTable;
window.changePage = changePage; // jangan lupa supaya pagination jalan

let isEditingMobil = false; // Flag global

window.editMobil = (key) => {
  if (isEditingMobil) return; // Cegah eksekusi ganda

  isEditingMobil = true; // Set flag menjadi true saat mulai

  const modal = new bootstrap.Modal(document.getElementById('modalEditMobil'));
  const editMobilRef = ref(database, `mobil/${key}`);

  onValue(editMobilRef, (snapshot) => {
    const mobil = snapshot.val();
    if (mobil) {
      initialMobilData = {
        ...mobil,
        key
      }; // Simpan data awal
      isiFormMobil(mobil, key);
      modal.show();

      // Tambahkan event listener saat modal ditutup untuk reset flag
      const modalElement = document.getElementById('modalEditMobil');
      modalElement.addEventListener('hidden.bs.modal', () => {
        isEditingMobil = false; // Reset flag ketika modal ditutup
      }, {
        once: true
      }); // Hanya sekali, supaya tidak menumpuk event listener
    } else {
      isEditingMobil = false; // Reset flag jika data tidak ditemukan
    }
  }, {
    onlyOnce: true // Pastikan hanya satu kali ambil data
  });
};


// Function isi form supaya bisa dipakai ulang untuk isi form dan reset
function isiFormMobil(mobil, key) {
  document.getElementById('editMobilId').value = key;
  const namaMobilFull = mobil.nama_mobil;
  const match = namaMobilFull.match(/^(.*?)\s+\((.*?)\)$/);

  if (match) {
    document.getElementById('editNamaMobil').value = match[1]; // Nama mobil
    document.getElementById('displayInisialMobil').textContent = match[2]; // Inisial + nomor
  } else {
    document.getElementById('editNamaMobil').value = mobil.nama_mobil;
    document.getElementById('displayInisialMobil').textContent = '';
  }
  document.getElementById('editMerkMobil').value = mobil.merk_mobil;
  document.getElementById('editStatusMobil').value = mobil.status;
  document.getElementById('editHargaSewa').value = mobil.harga_sewa;
  document.getElementById('editjumlahTempatDuduk').value = mobil.jumlah_tempat_duduk;
  document.getElementById('editwarnaMobil').value = mobil.warna;
  document.getElementById('edittahunMobil').value = mobil.tahun;

  const handleSelect = (id, value, extraCheck = null) => {
    const select = document.getElementById(id);
    if (select && value) {
      if (extraCheck && !extraCheck(value)) {
        select.selectedIndex = 0;
      } else {
        select.value = value;
        if (!Array.from(select.options).some(option => option.value === value)) {
          select.selectedIndex = 0;
        }
      }
    }
  };

  handleSelect('editTipeMobil', mobil.tipe_mobil);
  handleSelect('editbahanBakarMobil', mobil.bahan_bakar);
  handleSelect('edittransmisiMobil', mobil.transmisi);
  const selectGarasi = document.getElementById('editGarasiMobil');

  // Bersihkan dulu option lama
  selectGarasi.innerHTML = '';

  // Tambahkan option default
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = '-- Pilih Garasi --';
  selectGarasi.appendChild(defaultOption);

  // Generate option dari dataGarasi
  Object.entries(dataGarasi).forEach(([id, garasi]) => {
    const option = document.createElement('option');
    option.value = id; // value tetap id_tempat
    option.textContent = garasi.nama_tempat; // tampilannya nama garasi
    selectGarasi.appendChild(option);
  });

  // Setelah option digenerate, baru set value-nya pakai handleSelect
  handleSelect('editGarasiMobil', mobil.id_tempat, (value) => dataGarasi?.[value]);
}

// Tambahkan event listener buat tombol reset
document.getElementById('resetEditMobilButton').addEventListener('click', () => {
  if (initialMobilData) {
    isiFormMobil(initialMobilData, initialMobilData.key);
  }
});

document.getElementById('formEditMobil').addEventListener('submit', async (e) => {
  e.preventDefault();

  const key = document.getElementById('editMobilId').value;
  const namaBaru = document.getElementById('editNamaMobil').value.trim();
  const merk = document.getElementById('editMerkMobil').value;
  const status = document.getElementById('editStatusMobil').value;
  const harga = parseInt(document.getElementById('editHargaSewa').value);
  const jumlahTempatDuduk = parseInt(document.getElementById('editjumlahTempatDuduk').value);
  const warna = document.getElementById('editwarnaMobil').value;
  const tahun = document.getElementById('edittahunMobil').value;
  const tipeMobil = document.getElementById('editTipeMobil').value;
  const bahanBakar = document.getElementById('editbahanBakarMobil').value;
  const transmisi = document.getElementById('edittransmisiMobil').value;
  const idTempat = document.getElementById('editGarasiMobil').value;

  const mobilRef = ref(database, 'mobil');
  const editMobilRef = ref(database, `mobil/${key}`);

   // Validasi required
   if (!namaBaru || !merk || !status || isNaN(harga) || isNaN(jumlahTempatDuduk) ||
     !warna || !tahun || !tipeMobil || !bahanBakar || !transmisi || !idTempat) {
     showToastalert('Semua field wajib diisi dengan benar.', 'danger');
     return;
   }

  try {
    const snapshot = await get(editMobilRef);
    if (!snapshot.exists()) {
      showToastalert('Data mobil tidak ditemukan.', 'danger');
      return;
    }

    const dataLama = snapshot.val();
    let finalNamaMobil = dataLama.nama_mobil;

    // Ambil nama asli dari data lama tanpa inisial & nomor urut
    const namaLamaClean = dataLama.nama_mobil.replace(/\s\([A-Z]{2,4}\s\d{2}\)$/, '').trim();

    if (namaBaru !== namaLamaClean) {
      const inisial = await ambilInisial(namaBaru);
      const nomorUrut = await cariNomorUrutTersedia(namaBaru);
      finalNamaMobil = `${namaBaru} (${inisial} ${nomorUrut})`;
    }

    // Update data
    await update(editMobilRef, {
      nama_mobil: finalNamaMobil,
      merk_mobil: merk,
      status: status,
      harga_sewa: harga,
      jumlah_tempat_duduk: jumlahTempatDuduk,
      warna: warna,
      tahun: tahun,
      tipe_mobil: tipeMobil,
      bahan_bakar: bahanBakar,
      transmisi: transmisi,
      id_tempat: idTempat
    });

    showToastalert('Mobil berhasil diperbarui!', 'success');
    bootstrap.Modal.getInstance(document.getElementById('modalEditMobil')).hide();
  } catch (error) {
    console.error(error);
    showToastalert('Terjadi kesalahan saat mengedit data.', 'danger');
  }
});


// Fungsi untuk ambil inisial dari nama mobil
const ambilInisial = (namaMobil) => {
  const kata = namaMobil.trim().split(' ');
  if (kata.length === 1) {
    return kata[0].substring(0, 4).toUpperCase();
  } else {
    const depan = kata[0].substring(0, 2);
    const belakang = kata[kata.length - 1].substring(0, 2);
    return (depan + belakang).toUpperCase();
  }
};

// Fungsi cari nomor urut terkecil yang belum dipakai
const cariNomorUrutTersedia = async (namaMobil) => {
  const inisial = ambilInisial(namaMobil);
  const snapshot = await get(mobilRef);
  let nomorDipakai = [];

  if (snapshot.exists()) {
    snapshot.forEach(childSnapshot => {
      const data = childSnapshot.val();
      const regex = new RegExp(`^${namaMobil} \\(${inisial} (\\d{2})\\)$`, 'i');
      const match = data.nama_mobil.match(regex);
      if (match) {
        nomorDipakai.push(parseInt(match[1], 10));
      }
    });
  }

  let nomorUrut = 1;
  while (nomorDipakai.includes(nomorUrut)) {
    nomorUrut++;
  }

  return String(nomorUrut).padStart(2, '0');
};


let isDeletingMobil = false; // Flag global

window.hapusMobil = (key) => {
  if (isDeletingMobil) return; // Cegah eksekusi ganda

  showCenterToast(
    'Apakah Anda yakin ingin menghapus data mobil ini?',
    'fas fa-car-crash',
    'Konfirmasi Hapus Mobil',
    () => {
      isDeletingMobil = true;

      remove(ref(database, `mobil/${key}`))
        .then(() => {
          showToastalert('Mobil berhasil dihapus!', 'success', 'fas fa-check-circle');
        })
        .catch(() => {
          showToastalert('Terjadi kesalahan saat menghapus mobil.', 'danger', 'fas fa-times-circle');
        })
        .finally(() => {
          isDeletingMobil = false;
        });
    }
  );
};

function showCenterToast(message, icon = 'fas fa-info-circle', title = 'Konfirmasi', onConfirm) {
  const container = document.getElementById('centeredToast');
  const content = document.getElementById('centeredToastContent');

  content.innerHTML = `
    <div class="text-center">
      <i class="${icon} fa-2x text-warning mb-3 d-block"></i>
      <h5 class="fw-bold mb-2">${title}</h5>
      <p class="mb-3">${message}</p>
      <div class="d-flex justify-content-center gap-2">
        <button id="confirmDeleteBtn" class="btn btn-danger px-3">
          <i class="fas fa-trash-alt me-1"></i> Hapus
        </button>
        <button id="cancelDeleteBtn" class="btn btn-secondary px-3">
          <i class="fas fa-times me-1"></i> Batal
        </button>
      </div>
    </div>
  `;

  // Tampilkan toast
  container.classList.remove('d-none');

  // Tunggu tombol ditambahkan ke DOM
  setTimeout(() => {
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    const cancelBtn = document.getElementById('cancelDeleteBtn');

    if (confirmBtn) {
      confirmBtn.onclick = () => {
        container.classList.add('d-none');
        onConfirm(); // Jalankan fungsi yang dikirim
      };
    }

    if (cancelBtn) {
      cancelBtn.onclick = () => {
        container.classList.add('d-none'); // Sembunyikan tanpa melakukan apapun
      };
    }
  }, 50);
}

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


// Tambahkan event listener untuk hapus backdrop saat modal ditutup
document.getElementById('modalEditMobil').addEventListener('hidden.bs.modal', () => {
  const backdrop = document.querySelector('.modal-backdrop');
  if (backdrop) {
    backdrop.remove();
  }
});

// Cloudinary config
const cloudName = "dcvcatmaw";
const uploadPreset = "user_uploads";

// Input File Handler
const fileInput = document.getElementById('fotomobil');
const namaFileInput = document.getElementById('namaFile');
const resetFileButton = document.getElementById('resetButton');

fileInput.addEventListener('change', () => {
  const fileName = fileInput.files[0]?.name || '';
  namaFileInput.value = fileName;
});

// Upload ke Cloudinary
async function uploadFotoMobil(file, namaMobilFinal) {
  const folderPath = `mobil/${namaMobilFinal.replace(/\s+/g, "-")}`;
  const fileName = file.name.replace(/\s+/g, "-");
  const publicId = `${folderPath}/${fileName}`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", folderPath);
  formData.append("public_id", publicId); // 🔥 Tambahkan ini supaya path sesuai

  const progressContainer = document.getElementById('progressContainer');
  const progressBar = document.getElementById('progressBar');

  progressContainer.style.display = 'block';
  progressBar.style.width = '0%';
  progressBar.textContent = '0%';

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        progressBar.style.width = `${percent}%`;
        progressBar.textContent = `${percent}%`;
      }
    });

    xhr.onload = () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        progressContainer.style.display = 'none';
        resolve(response.secure_url); // Lebih baik simpan URL gambar!
      } else {
        console.error("❌ Error saat upload ke Cloudinary:", xhr.responseText);
        progressContainer.style.display = 'none';
        reject(null);
      }
    };

    xhr.onerror = () => {
      console.error("❌ Error saat upload ke Cloudinary");
      progressContainer.style.display = 'none';
      reject(null);
    };

    xhr.send(formData);
  });
}

// Handle Submit Form
document.getElementById('formTambahMobil').addEventListener('submit', async function (e) {
  e.preventDefault();

  // Flag untuk memastikan hanya satu proses yang berjalan pada waktu tertentu
  if (this.submitting) return; // Jika sudah ada proses, cegah submit lagi
  this.submitting = true; // Tandai bahwa proses sedang berjalan

  const nama = document.getElementById('namaMobil').value.trim();
  const merk = document.getElementById('merkMobil').value.trim();
  const tahun = document.getElementById('tahunMobil').value.trim();
  const warna = document.getElementById('warnaMobil').value.trim();
  const transmisi = document.getElementById('transmisiMobil').value.trim();
  const bahanBakar = document.getElementById('bahanBakarMobil').value.trim();
  const jumlahTempatDuduk = parseInt(document.getElementById('jumlahTempatDuduk').value.trim());
  const garasi = document.getElementById('GarasiMobil').value.trim();
  const tipemobil = document.getElementById('tipemobil').value.trim();
  const statusMobil = document.getElementById('StatusMobil').value.trim();
  const harga = document.getElementById('HargaSewa').value.trim();
  const fileInput = document.getElementById('fotomobil');
  const file = fileInput.files[0];

  let namaFileFoto = null;

  // Validasi input
  if (!nama || !merk || !tahun || !warna || !transmisi || !bahanBakar || isNaN(jumlahTempatDuduk) || !garasi || !tipemobil || !statusMobil || isNaN(harga)) {
    showToastalert('Harap lengkapi semua field terlebih dahulu!', 'warning');
    this.submitting = false; // Reset flag
    return;
  }

  const generateInisial = (namaMobil) => {
    const words = namaMobil.trim().split(' ');
    let depan = words[0].substring(0, 2).toUpperCase();
    let belakang = words.length > 1 ? words[words.length - 1].substring(0, 2).toUpperCase() : words[0].substring(0, 2).toUpperCase();
    return depan + belakang;
  };

  const cariNomorUrutTersedia = async (namaMobil, inisial) => {
    const snapshot = await get(mobilRef);
    let nomorDipakai = [];
    if (snapshot.exists()) {
      snapshot.forEach(childSnapshot => {
        const data = childSnapshot.val();
        const regex = new RegExp(`^${namaMobil} \\(${inisial} (\\d{2})\\)$`);
        const match = data.nama_mobil.match(regex);
        if (match) {
          nomorDipakai.push(parseInt(match[1], 10));
        }
      });
    }

    let nomorUrut = 1;
    while (nomorDipakai.includes(nomorUrut)) {
      nomorUrut++;
    }

    return String(nomorUrut).padStart(2, '0');
  };

  try {
    const inisial = generateInisial(nama);
    const nomorUrut = await cariNomorUrutTersedia(nama, inisial);
    const namaMobilFinal = `${nama} (${inisial} ${nomorUrut})`;

    if (file) {
      try {
        namaFileFoto = await uploadFotoMobil(file, namaMobilFinal);
      } catch (error) {
        showToastalert('Gagal upload foto mobil!', 'danger');
        this.submitting = false; // Reset flag
        return;
      }
    }

    await push(mobilRef, {
      nama_mobil: namaMobilFinal,
      merk_mobil: merk,
      tahun: tahun,
      warna: warna,
      transmisi: transmisi,
      bahan_bakar: bahanBakar,
      jumlah_tempat_duduk: jumlahTempatDuduk,
      id_tempat: garasi,
      tipe_mobil: tipemobil,
      status: statusMobil,
      harga_sewa: harga,
      foto: namaFileFoto
    });

    console.log('Data berhasil ditambahkan!');
    showToastalert('Mobil berhasil ditambahkan!', 'success');
    document.getElementById('formTambahMobil').reset();
    fileInput.value = '';
    resetFileButton.classList.add('d-none');
    bootstrap.Modal.getInstance(document.getElementById('modalTambahMobil')).hide();
  } catch (error) {
    console.error('Error saat menambahkan mobil:', error);
    showToastalert('Terjadi kesalahan saat menambahkan mobil.', 'danger');
  } finally {
    this.submitting = false; // Reset flag setelah proses selesai
  }
});

