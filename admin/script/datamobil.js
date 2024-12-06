import {
  initializeApp
} from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js';
import {
  getDatabase,
  ref,
  onValue,
  push, // Tambahkan ini
  update, // Untuk fitur edit
  remove // Untuk fitur hapus
} from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js';


const firebaseConfig = {
    apiKey: "AIzaSyCzTvQrtyFVd8gfxMDPenmhiOCD32QLIHk",
    authDomain: "drivego-f833b.firebaseapp.com",
    databaseURL: "https://drivego-f833b-default-rtdb.firebaseio.com",
    projectId: "drivego-f833b",
    storageBucket: "drivego-f833b.firebasestorage.app",
    messagingSenderId: "296648552361",
    appId: "1:296648552361:web:985acfc9a369b3f3841eb8",
    measurementId: "G-6YE8Z8FDL4"
};
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const showToast = (message, type = 'success') => {
  const toastElement = document.getElementById('toastNotification');
  const toastBody = toastElement.querySelector('.toast-body');

  // Ubah warna toast berdasarkan tipe (success, danger, dll.)
  toastElement.classList.remove('text-bg-success', 'text-bg-danger', 'text-bg-warning');
  toastElement.classList.add(`text-bg-${type}`);

  // Ubah pesan toast
  toastBody.textContent = message;

  // Tampilkan toast
  const toast = new bootstrap.Toast(toastElement);
  toast.show();
};


// Referensi data mobil
const mobilRef = ref(database, 'mobil');

// Mengambil data secara real-time
const mobilTableBody = document.getElementById('mobilTableBody');
onValue(mobilRef, (snapshot) => {
  mobilTableBody.innerHTML = '';
  let index = 1;

  snapshot.forEach((childSnapshot) => {
    const mobil = childSnapshot.val();
    const key = childSnapshot.key;

    if (mobil) {
      const row = `
        <tr>
          <td>${index++}</td>
          <td>${mobil.nama_mobil}</td>
          <td>${mobil.merk_mobil}</td>
          <td><span class="badge bg-${mobil.status === 'tersedia' ? 'success' : 'danger'}">${mobil.status}</span></td>
          <td>Rp ${mobil.harga_sewa.toLocaleString()}</td>
          <td>
            <button class="btn btn-warning btn-sm" data-key="${key}" onclick="editMobil('${key}')"><i class="fas fa-edit"></i> Edit</button>
            <button class="btn btn-danger btn-sm" data-key="${key}" onclick="hapusMobil('${key}')"><i class="fas fa-trash"></i> Hapus</button>
          </td>
        </tr>
      `;
      mobilTableBody.innerHTML += row;
    }
  });
});

// Tambah Mobil
document.getElementById('formTambahMobil').addEventListener('submit', (e) => {
  e.preventDefault();

  const nama = document.getElementById('namaMobil').value;
  const merk = document.getElementById('merkMobil').value;
  const status = document.getElementById('statusMobil').value;
  const harga = parseInt(document.getElementById('hargaSewa').value);

  push(mobilRef, { nama_mobil: nama, merk_mobil: merk, status, harga_sewa: harga })
    .then(() => {
      showToast('Mobil berhasil ditambahkan!', 'success');
    })
    .catch((error) => {
      console.error('Error adding data:', error);
      showToast('Terjadi kesalahan saat menambahkan mobil.', 'danger');
    });

  document.getElementById('formTambahMobil').reset();
  bootstrap.Modal.getInstance(document.getElementById('modalTambahMobil')).hide();
});


// Edit Mobil
window.editMobil = (key) => {
  const modal = new bootstrap.Modal(document.getElementById('modalEditMobil'));
  const editMobilRef = ref(database, `mobil/${key}`);

  onValue(editMobilRef, (snapshot) => {
    const mobil = snapshot.val();
    if (mobil) {
      document.getElementById('editMobilId').value = key;
      document.getElementById('editNamaMobil').value = mobil.nama_mobil;
      document.getElementById('editMerkMobil').value = mobil.merk_mobil;
      document.getElementById('editStatusMobil').value = mobil.status;
      document.getElementById('editHargaSewa').value = mobil.harga_sewa;
      modal.show();
    }
  });
};

document.getElementById('formEditMobil').addEventListener('submit', (e) => {
  e.preventDefault();

  const key = document.getElementById('editMobilId').value;
  const nama = document.getElementById('editNamaMobil').value;
  const merk = document.getElementById('editMerkMobil').value;
  const status = document.getElementById('editStatusMobil').value;
  const harga = parseInt(document.getElementById('editHargaSewa').value);

  // Update data di Firebase
  update(ref(database, `mobil/${key}`), {
    nama_mobil: nama,
    merk_mobil: merk,
    status,
    harga_sewa: harga,
  })
    .then(() => {
       showToast('Mobil berhasil diperbarui!', 'success');
      // Tutup modal setelah berhasil
      const editModal = bootstrap.Modal.getInstance(
        document.getElementById('modalEditMobil')
      );
      if (editModal) editModal.hide();
    })
    .catch((error) => {
      console.error('Error updating data:', error);
      alert('Terjadi kesalahan saat mengedit data.');
    });
});



document.addEventListener('hidden.bs.modal', () => {
  const modalBackdrop = document.querySelector('.modal-backdrop');
  if (modalBackdrop) modalBackdrop.remove();
});


// Hapus Mobil
window.hapusMobil = (key) => {
  if (confirm('Apakah Anda yakin ingin menghapus mobil ini?')) {
    remove(ref(database, `mobil/${key}`))
      .then(() => {
        showToast('Mobil berhasil dihapus!', 'success');
      })
      .catch((error) => {
        console.error('Error deleting data:', error);
        showToast('Terjadi kesalahan saat menghapus mobil.', 'danger');
      });
  }
};
