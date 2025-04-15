import { database } from "./config.js";
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
        <td>Rp ${mobil.harga_sewa ? mobil.harga_sewa.toLocaleString() : '-'}</td>
        <td><span class="badge bg-${mobil.status === 'tersedia' ? 'success' : 'danger'}">${mobil.status || '-'}</span></td>
        <td>${getNamaGarasi(mobil.id_tempat)}</td>
        <td>${mobil.tipe_mobil || '-'}</td>
        <td><img src="${mobil.foto}" alt="Foto Mobil" style="width: 150px; height: 100px; object-fit: cover; border-radius: 4px;" /></td>
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

let isEditing = false; // Flag global untuk mencegah double trigger

window.editMobil = (key) => {
  if (isEditing) return; // Jika sedang dalam proses, langsung hentikan
  isEditing = true; // Set flag: sedang proses

  const modal = new bootstrap.Modal(document.getElementById('modalEditFoto'));
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
    }

    isEditing = false; // Reset flag setelah proses selesai
  }, (error) => {
    console.error('Gagal mengambil data mobil:', error);
    showToast('Gagal mengambil data mobil.', 'danger');
    isEditing = false; // Reset flag walaupun gagal
  });
};


function isiFormMobil(mobil, key) {
  document.getElementById('editMobilId').value = key;
  document.getElementById('nama-mobil').innerText = mobil.nama_mobil;
  document.getElementById('currentFotoMobil').src = mobil.foto;
  console.log(mobil.foto);
}

// File input untuk edit foto
const fileInputEdit = document.getElementById('fotomobilEdit');

// Update nama file kalau dipilih (optional, kalau kamu mau pakai display nama file)
fileInputEdit.addEventListener('change', () => {
  const fileName = fileInputEdit.files[0]?.name || '';
  console.log("File dipilih:", fileName);
});

// Fungsi upload foto ke Cloudinary dan update URL ke Firebase
const BUEF = document.getElementById('uploadEditFoto');
async function uploadFotoMobilEdit() {
  const file = fileInputEdit.files[0];
  BUEF.disabled = true;

  if (!file) {
    alert('Silakan pilih file gambar terlebih dahulu.');
    return;
  }

  if (file.size > 1024 * 1024) { // Batas 1MB
    alert('Ukuran gambar maksimal 1MB.');
    return;
  }

  // Ambil nama mobil dari span modal (pastikan sudah ada isinya!)
  const namaMobil = document.getElementById('nama-mobil').innerText;
  const folderPath = `mobil/${namaMobil.replace(/\s+/g, "-")}`;
  const fileName = file.name.replace(/\s+/g, "-");
  const publicId = `${folderPath}/${fileName}`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", folderPath);
  formData.append("public_id", publicId); // 🔥 path sesuai folder

  // Progress bar tampil
  const progressContainer = document.getElementById('progressContainerEdit');
  const progressBar = document.getElementById('progressBarEdit');
  progressContainer.classList.remove('d-none');
  progressContainer.style.display = 'block';
  progressBar.style.width = '0%';
  progressBar.textContent = '0%';

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!data.secure_url) {
      throw new Error('Gagal mendapatkan URL gambar dari Cloudinary.');
    }

    const imageUrl = data.secure_url;
    console.log('URL gambar:', imageUrl);

    // Ambil key mobil dari input hidden
    const keyMobil = document.getElementById('editMobilId').value;

    // Update Firebase dengan URL baru
    const mobilRef = ref(database, `mobil/${keyMobil}`);
    await update(mobilRef, { foto: imageUrl });
    // Optional: reset progress bar dan tutup modal
    progressBar.style.width = '100%';
    progressBar.textContent = 'Upload Selesai';

    setTimeout(() => {
      progressContainer.classList.add('d-none');
      progressContainer.style.display = 'none';
      progressBar.style.width = '0%';
      progressBar.textContent = '0%';
      resetFileEdit();
      BUEF.disabled = false;
      bootstrap.Modal.getInstance(document.getElementById('modalEditFoto')).hide();
      showToast('Mobil berhasil ditambahkan!', 'success');
    }, 1500);

  } catch (error) {
    progressContainer.classList.add('d-none');
    console.error('Upload error:', error);
    alert('Gagal upload gambar. Coba lagi.');
    progressContainer.style.display = 'none';
    BUEF.disabled = false;
  }
}

window.uploadFotoMobilEdit = uploadFotoMobilEdit;

window.hapusMobil = (key) => {
  if (confirm('Apakah Anda yakin ingin menghapus mobil ini?')) {
    remove(ref(database, `mobil/${key}`))
      .then(() => {
        showToast('Mobil berhasil dihapus!', 'success');
      })
      .catch(() => showToast('Terjadi kesalahan saat menghapus mobil.', 'danger'));
  }
};

// Tambahkan event listener untuk hapus backdrop saat modal ditutup
document.getElementById('modalEditFoto').addEventListener('hidden.bs.modal', () => {
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

let isSubmitting = false; // Flag global untuk mencegah submit ganda

document.getElementById('formTambahMobil').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (isSubmitting) return; // Stop kalau sedang proses submit
  isSubmitting = true; // Set flag: sedang submit

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

  if (!nama || !merk || !tahun || !warna || !transmisi || !bahanBakar || isNaN(jumlahTempatDuduk) || !garasi || !tipemobil || !statusMobil || isNaN(harga)) {
    showToast('Harap lengkapi semua field terlebih dahulu!', 'warning');
    isSubmitting = false; // Reset flag
    return;
  }

  const generateInisial = (namaMobil) => {
    const words = namaMobil.trim().split(' ');
    let depan = words[0].substring(0, 2).toUpperCase();
    let belakang = words.length > 1 ? words[words.length - 1].substring(0, 2).toUpperCase() : depan;
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
        showToast('Gagal upload foto mobil!', 'danger');
        isSubmitting = false; // Reset flag
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
    showToast('Mobil berhasil ditambahkan!', 'success');
    document.getElementById('formTambahMobil').reset();
    fileInput.value = '';
    resetFileButton.classList.add('d-none');
    bootstrap.Modal.getInstance(document.getElementById('modalTambahMobil')).hide();
  } catch (error) {
    console.error('Error saat menambahkan mobil:', error);
    showToast('Terjadi kesalahan saat menambahkan mobil.', 'danger');
  }

  isSubmitting = false; // Reset flag di akhir proses
});