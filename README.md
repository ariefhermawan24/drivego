# 🚗 Sistem Penyewaan Mobil – Multi Role (User, Admin, Driver)

Proyek ini adalah sistem penyewaan mobil berbasis web/aplikasi dengan alur kerja yang efisien dan fleksibel. Sistem mendukung tiga peran utama: **User (Penyewa)**, **Admin**, dan **Driver (Supir)**. Masing-masing peran memiliki alur dan tugas yang terintegrasi dengan sistem otomatisasi dan proses manual di lapangan.

---

## ✨ Fitur Utama

- Pemesanan mobil dengan dua jenis sewa: **Dengan Supir** & **Lepas Kunci**
- Validasi dan manajemen order oleh Admin
- Penugasan supir secara otomatis
- E-ticket sebagai bukti pemesanan resmi
- Manajemen sisa pembayaran, uang jaminan, dan denda keterlambatan
- Workflow yang sesuai dengan kondisi nyata di lapangan

---

## 🧭 Alur Pengguna

### 🔹 USER FLOW
1. Masuk ke website.
2. Memilih mobil yang ingin disewa.
3. Memilih **jenis sewa**:  
   - ✅ **Dengan Supir**  
   - 🔓 **Lepas Kunci**
4. Mengisi form sesuai jenis sewa.
5. Mengirim bukti pembayaran DP.
6. Menunggu validasi admin.
7. Jika **ditolak** → ulang proses dari awal.  
   Jika **diterima** → user mendapat **e-ticket**.

#### Jika Jenis Sewa: Dengan Supir
- User dijemput oleh supir.
- Menunjukkan e-ticket.
- Membayar sisa tarif + tarif supir.
- Supir mengantar ke lokasi tujuan dan kembali ke titik awal.
- Selesai.

#### Jika Jenis Sewa: Lepas Kunci
- User mengambil mobil di garasi.
- Verifikasi data + e-ticket.
- Menerima kunci & menggunakan mobil.
- Setelah masa sewa selesai:
  - Jika **tepat waktu** → uang kompensasi dikembalikan.
  - Jika **terlambat** → uang kompensasi **tidak dikembalikan**.

---

## 🛠️ ALUR ADMIN

1. Menerima request validasi dari user.
2. Menolak atau menerima:
   - Jika ditolak → sistem memberi tahu user.
   - Jika diterima → sistem memberi tahu user + ubah status mobil jadi *Disewa*.
3. Jika sewa **dengan supir**:
   - Memilih supir tersedia.
   - Sistem mengubah status supir menjadi *Bekerja*.
   - Memberikan tugas ke supir.
4. Jika sewa **lepas kunci**:
   - Menerima berkas dan validasi manual.
   - Menerima sisa pembayaran & uang kompensasi.
   - Memberikan kunci ke user.
5. Setelah mobil dikembalikan:
   - Mengecek waktu pengembalian.
   - Jika **tepat waktu** → mengembalikan uang kompensasi.
   - Jika **terlambat** → uang kompensasi tidak dikembalikan.

---

## 🧑‍✈️ ALUR DRIVER (SUPIR)

1. Menerima tugas dari admin.
2. Menuju ke garasi & mengambil kunci.
3. Menjemput user di lokasi penjemputan.
4. Mengecek e-ticket user.
5. Menerima sisa tarif + tarif supir.
6. Mengantar user ke lokasi tujuan.
7. Setelah selesai, mengantar user kembali ke titik awal.
8. Mengembalikan mobil ke garasi & menyerahkan kunci.

---

## 📦 Teknologi yang Digunakan

- `HTML/CSS/JavaScript` untuk frontend
- `JavaScript` untuk backend dengan beberapa cdn pendukung
- `Firebase` sebagai basis data
- `Bootstrap` untuk UI

---

## 📄 Lisensi

Proyek ini dilindungi oleh lisensi MIT. Silakan gunakan dan modifikasi sesuai kebutuhan, tapi mohon beri kredit bila menggunakan sebagian besar kode dan struktur dari proyek ini.


📎 Dokumentasi Visual
Klik tombol di bawah untuk melihat flowchart peran masing-masing:

<div align="center">

  <a href="https://drive.google.com/file/d/1m7LrTJtYWcuosQB-79RohVLjha6VVvDk/view?usp=sharing" target="_blank">
    <img src="https://img.shields.io/badge/Flowchart%20User-Download-blue?style=for-the-badge&logo=google-drive" alt="Flowchart User">
  </a>

  <a href="https://drive.google.com/file/d/1NHEtSkQRYL8eDZxyg1EN3_qdrj7pGihU/view?usp=sharing" target="_blank">
    <img src="https://img.shields.io/badge/Flowchart%20Admin-Download-green?style=for-the-badge&logo=google-drive" alt="Flowchart Admin">
  </a>

  <a href="https://drive.google.com/file/d/1qGdrB9nbilRVpt42iPPrfFgLBJShpqdt/view?usp=sharing" target="_blank">
    <img src="https://img.shields.io/badge/Flowchart%20Driver-Download-orange?style=for-the-badge&logo=google-drive" alt="Flowchart Driver">
  </a>

</div>


---

## ✉️ Kontak

Jika ada pertanyaan atau kerja sama:
<div align="center">

  <a href="mailto:ariefhermawan072@gmail.com" target="_blank">
    <img src="https://img.shields.io/badge/Email-ariefhermawan072@gmail.com-red?style=for-the-badge&logo=gmail" alt="Email">
  </a>

  <a href="https://www.instagram.com/constagames/" target="_blank">
    <img src="https://img.shields.io/badge/Instagram-@constagames-purple?style=for-the-badge&logo=instagram" alt="Instagram">
  </a>

</div>

---

> “Sewa mobil mudah, aman, dan transparan – Semua proses tercatat dengan rapi.” 🚘
