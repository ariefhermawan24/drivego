import { database } from "../script/config.js";
import { ref, onValue , push , update, remove } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

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


const mobilRef = ref(database, 'mobil');
const mobilTableBody = document.getElementById('mobilTableBody');
const itemsPerPage = 5;
let currentPage = 1;
let dataMobil = [];

const renderTable = () => {
  mobilTableBody.innerHTML = '';
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginatedItems = dataMobil.slice(start, end);
  
  paginatedItems.forEach((mobil, index) => {
    const row = `
      <tr>
        <td>${start + index + 1}</td>
        <td>${mobil.nama_mobil}</td>
        <td>${mobil.merk_mobil}</td>
        <td><span class="badge bg-${mobil.status === 'tersedia' ? 'success' : 'danger'}">${mobil.status}</span></td>
        <td>Rp ${mobil.harga_sewa.toLocaleString()}</td>
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

  const totalPages = Math.ceil(dataMobil.length / itemsPerPage);

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
  const totalPages = Math.ceil(dataMobil.length / itemsPerPage);
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

  // Pastikan currentPage tidak melebihi totalPages
  if (currentPage > totalPages) {
    currentPage = totalPages > 0 ? totalPages : 1;
  }

  renderTable();
  renderPagination();
});

function searchTable() {
    let input = document.getElementById("searchMobil").value.toLowerCase();
    let table = document.getElementById("mobilTableBody");
    let rows = table.getElementsByTagName("tr");

    for (let row of rows) {
        let text = row.textContent.toLowerCase();
        row.style.display = text.includes(input) ? "" : "none";
    }
}

window.searchTable = searchTable;

window.nextPage = () => {
  if (currentPage * itemsPerPage < dataMobil.length) {
    currentPage++;
    renderTable();
  }
};

window.prevPage = () => {
  if (currentPage > 1) {
    currentPage--;
    renderTable();
  }
};

window.changePage = changePage;

document.getElementById('formTambahMobil').addEventListener('submit', (e) => {
  e.preventDefault();
  const nama = document.getElementById('namaMobil').value;
  const merk = document.getElementById('merkMobil').value;
  const status = document.getElementById('statusMobil').value;
  const harga = parseInt(document.getElementById('hargaSewa').value);
  
  push(mobilRef, { nama_mobil: nama, merk_mobil: merk, status, harga_sewa: harga })
    .then(() => showToast('Mobil berhasil ditambahkan!', 'success'))
    .catch(() => showToast('Terjadi kesalahan saat menambahkan mobil.', 'danger'));

  document.getElementById('formTambahMobil').reset();
  bootstrap.Modal.getInstance(document.getElementById('modalTambahMobil')).hide();
});

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
  
  update(ref(database, `mobil/${key}`), { nama_mobil: nama, merk_mobil: merk, status, harga_sewa: harga })
    .then(() => {
      showToast('Mobil berhasil diperbarui!', 'success');
      bootstrap.Modal.getInstance(document.getElementById('modalEditMobil')).hide();
    })
    .catch(() => showToast('Terjadi kesalahan saat mengedit data.', 'danger'));
});

window.hapusMobil = (key) => {
  if (confirm('Apakah Anda yakin ingin menghapus mobil ini?')) {
    remove(ref(database, `mobil/${key}`))
      .then(() => showToast('Mobil berhasil dihapus!', 'success'))
      .catch(() => showToast('Terjadi kesalahan saat menghapus mobil.', 'danger'));
  }
};

document.addEventListener("hidden.bs.modal", function () {
  setTimeout(() => {
    document.querySelectorAll(".modal-backdrop").forEach((backdrop) => backdrop.remove());
  }, 300); // Beri sedikit delay untuk memastikan Bootstrap sudah selesai menutup modal
});