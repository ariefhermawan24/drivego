import { database } from "../admin/script/config.js";
import { getDatabase, ref, set, remove, onValue,get, child, update } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

const params = new URLSearchParams(window.location.search);

    const orderId = params.get('orderID');
    const jenisSewa = params.get('jenisSewa');
    const token = params.get('token');

    const transaksiRef = ref(database, 'transaksi/' + orderId);

    get(transaksiRef).then((snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();

            if (data.token === token) {
                console.log('Token valid. Data ditemukan:', data);
                document.querySelector('.kode-booking').textContent = orderId;
                document.querySelector('.nama').textContent = data.namaPenyewa || 'Tidak ada';
                document.querySelector('.nomer-telephone').textContent = data.nomertelephone || 'Tidak ada';
                document.querySelector('.tanggal-sewa').textContent = data.tanggalSewa || 'Tidak ada';
                document.querySelector('.durasi-sewa').textContent = data.hariSewa ? `${data.hariSewa} Hari` : 'Tidak ada';
                document.querySelector('.mobil').textContent = data.namaMobil + " hari" || 'Tidak ada';
                document.querySelector('.harga-perhari').textContent = data.hargaSewa ? `Rp ${data.hargaSewa}` : 'Tidak ada';
                document.querySelector('.total-harga').textContent = data.totalHarga ? `Rp ${data.totalHarga}` : 'Tidak ada';
                document.querySelector('.pembayaran-dp').textContent = data.pembayaranDP ? `Rp ${data.pembayaranDP}` : 'Tidak ada';
                document.querySelector('.pembayaran-ditempat').textContent = data.pembayaranDiTempat ? `Rp ${data.pembayaranDiTempat}` : 'Tidak ada';

               if (jenisSewa === 'denganSupir') {
                    document.querySelector('.driver-option').style.display = 'block';
                    document.querySelector('.self-drive-option').style.display = 'none';
                    document.querySelector('.lokasi-user').textContent = 'Lokasi Penjemputan';
                    document.querySelector('.jam-penjemputan').textContent = data.jamPenjemputan ? `Pukul ${data.jamPenjemputan} WIB` : 'Tidak ada';
                    document.querySelector('.penjemputan').textContent = data.lokasiPenjemputan || 'Tidak ada';

                    // Update teks untuk dengan supir
                    document.querySelector('.text-mode').textContent = 'sopir menjemput';
                    // Ambil lokasiTujuan dari database
                    const tujuanList = data.lokasiTujuan;

                    if (tujuanList && Array.isArray(tujuanList)) {
                        const tujuanContainer = document.querySelector('.list-tujuan');

                        // Pastikan kosongkan dulu biar nggak double kalau dipanggil ulang
                        tujuanContainer.innerHTML = '';

                        // Buat elemen list untuk tujuan
                        const ul = document.createElement('ul');
                        ul.style.paddingLeft = '20px'; // supaya lebih rapi
                        ul.style.margin = '0';

                        // Loop data tujuan dan buat list item
                        tujuanList.forEach((tujuan) => {
                            const li = document.createElement('li');
                            li.textContent = tujuan;
                            ul.appendChild(li);
                        });

                        // Masukkan list ke dalam container
                        tujuanContainer.appendChild(ul);
                    }
                } else if (jenisSewa === 'lepasKunci') {
                    document.querySelector('.driver-option').style.display = 'none';
                    document.querySelector('.self-drive-option').style.display = 'block';
                    document.querySelector('.lokasi-user').textContent = 'Alamat Rumah';
                    document.querySelector('.penjemputan').textContent = data.alamatRumah || 'Tidak ada';
                    document.querySelector('.deposit').textContent = data.kompensasi ? `Rp ${data.kompensasi}` : 'Tidak ada';

                    // Update teks untuk lepas kunci
                   document.querySelector('.text-mode').textContent = 'pengambilan mobil';
                   
                   const garasiRef = ref(database, "garasi");

                    get(garasiRef).then((snapshot) => {
                        if (snapshot.exists()) {
                            let found = false;

                            for (const childSnapshot of snapshot.val() ? Object.entries(snapshot.val()) : []) {
                                const [childKey, childData] = childSnapshot;

                                if (childData.nama_tempat === data.garasi && childData.alamat) {
                                    console.log(`Key: ${childKey}, Nama Tempat: ${childData.nama_tempat}`);

                                    const garageAddress = childData.alamat;
                                    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(garageAddress)}`;

                                    new QRCode(document.getElementById("qrcode"), {
                                        text: mapsUrl,
                                        width: 150,
                                        height: 150,
                                        colorDark: "#000000",
                                        colorLight: "#ffffff",
                                        correctLevel: QRCode.CorrectLevel.H
                                    });

                                    document.getElementById('mapsLink').href = mapsUrl;

                                    found = true;
                                    break; // stop loop setelah ketemu
                                }
                            }

                            if (!found) {
                                console.log("Alamat garasi tidak ditemukan");
                            }

                        } else {
                            console.log("No data available");
                        }
                    }).catch((error) => {
                        console.error(error);
                    });
                } else {
                    document.querySelector('.driver-option').style.display = 'none';
                    document.querySelector('.self-drive-option').style.display = 'none';
                    document.querySelector('.lokasi-user').textContent = ''; // atau default text

                    // Reset atau kosongkan jika diperlukan
                    document.querySelector('.text-mode').textContent = 'pengambilan mobil';
                }

            } else {
                showToastAndRedirect('Token tidak cocok!');
            }
        } else {
            showToastAndRedirect('Order ID tidak ditemukan!');
        }
    }).catch((error) => {
        console.error(error);
        showToastAndRedirect('Terjadi kesalahan!');
    });

    function showToastAndRedirect(message) {
        // Blur overlay
        const blurOverlay = document.createElement('div');
        blurOverlay.className = 'blur-overlay';
        document.body.appendChild(blurOverlay);

        // Toast
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        // Redirect after 3 seconds
        setTimeout(() => {
            window.location.href = '../'; // Ganti dengan halaman tujuan
        }, 3000);
    }