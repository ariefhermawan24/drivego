import { database } from "../admin/script/config.js";
import { ref, onValue , get , update } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";
const showToast = (message, type = 'success') => {
    const toastElement = document.getElementById('toastNotification');
    const toastBody = toastElement.querySelector('.toast-body');

    toastElement.classList.remove('text-bg-success', 'text-bg-danger', 'text-bg-warning');
    toastElement.classList.add(`text-bg-${type}`);
    toastBody.textContent = message;

    const toast = new bootstrap.Toast(toastElement);
    toast.show();
};
window.showToast = showToast;
document.addEventListener("DOMContentLoaded", function () {
    let email = sessionStorage.getItem("email") || null; // Ambil email dari session storage
    let username = sessionStorage.getItem("username") || "Guest";
    let role = sessionStorage.getItem("role") || "administrator";
    let soal_verifikasi = sessionStorage.getItem("soal_verifikasi") || null; // Ambil soal dari session storage
    
    const editUserBtn = document.getElementById("editUserBtn");
    const editPasswordBtn = document.getElementById("editPasswordBtn");
    const editQuestionBtn = document.getElementById("editQuestionBtn");
    const modalBody = document.querySelector("#accountModal .modal-body");
    const modalHeader = document.querySelector("#accountModal .modal-header");

    let originalUserData = {}; // Menyimpan data asli dari database

    // Simpan konten asli modal untuk dikembalikan jika dibutuhkan
    const originalModalContent = modalBody.innerHTML;

    const usersRef = ref(database, "users");

    document.getElementById("navbarUsername").innerText = username;
    document.getElementById("dropdownUsername").innerText = username;
    document.getElementById("dropdownRole").innerText = role;

    async function hashPassword(password, salt) {
        const encoder = new TextEncoder();
        const data = encoder.encode(salt + password);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, "0"))
            .join("");
    }

    // Fungsi untuk membuat salt acak
    function generateSalt(length = 32) {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let salt = "";
        for (let i = 0; i < length; i++) {
            salt += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return salt;
    }

    // Fungsi untuk mengambil data pengguna secara real-time
    function fetchUserData() {
        onValue(usersRef, (snapshot) => {
            if (!snapshot.exists()) {
                console.log("❌ Database kosong.");
                return;
            }

            let usersData = snapshot.val();
            let user = null;

            // 🔹 Ambil username & soal_verifikasi terbaru dari sessionStorage
            let sessionUsername = sessionStorage.getItem("username");
            let sessionSoal = sessionStorage.getItem("soal_verifikasi");

            // 🔹 Cari user berdasarkan sessionStorage
            if (Array.isArray(usersData)) {
                user = usersData.find(u => u && (u.username === sessionUsername || u.soal_verifikasi === sessionSoal));
            } else {
                user = Object.values(usersData).find(u => u.username === sessionUsername || u.soal_verifikasi === sessionSoal);
            }

            if (!user) {
                console.log("❌ User tidak ditemukan.");
                return;
            }

            // 🔹 Tunggu modal muncul sebelum memperbarui isinya
            waitForModal(() => updateModal(user));
        }, (error) => {
            console.error("❌ Error fetching user data:", error);
        });
    }

    // 🔹 Fungsi untuk menunggu modal tersedia sebelum update
    function waitForModal(callback) {
        let interval = setInterval(() => {
            let modalUsername = document.getElementById("modalUsername");

            if (modalUsername) {
                clearInterval(interval); // Hentikan pengecekan jika modal sudah ada
                callback(); // Panggil fungsi update modal
            } else {
                console.warn("⏳ Menunggu modal...");
            }
        }, 100); // Cek setiap 100ms
    }

    // 🔹 Fungsi untuk menampilkan data di modal
    function updateModal(userData) {
        document.getElementById("modalUsername").textContent = sessionStorage.getItem("username") || userData.username || "Guest";
        document.getElementById("modalEmail").textContent = sessionStorage.getItem("email") || userData.email || "Tidak tersedia";
        document.getElementById("modalRole").textContent = userData.role || "Administrator";
        document.getElementById("modalTelepon").textContent = sessionStorage.getItem("telepon") || userData.telepon || "-";
        document.getElementById("modalSoal").textContent = sessionStorage.getItem("soal_verifikasi") || userData.soal_verifikasi || "-";
        document.getElementById("modalJawaban").textContent = sessionStorage.getItem("jawaban_verifikasi") || userData.jawaban_verifikasi || "-";

        originalUserData = { ...userData }; // Simpan data asli untuk reset
    }

    // 🔹 Panggil fungsi saat modal ditampilkan
    fetchUserData();

    // 🔹 Event listener untuk mendeteksi perubahan sessionStorage
    window.addEventListener("storage", (event) => {
        if (event.key === "username" || event.key === "soal_verifikasi") {
            console.log("🔄 SessionStorage diperbarui, mengambil ulang data pengguna...");
            fetchUserData();
        }
    });

    function resetModal() {
        modalHeader.innerHTML = `
            <h5 class="modal-title">Detail Akun</h5>
            <span type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></span>
        `;

        // Mengembalikan isi modal ke konten awal yang sudah disimpan
        modalBody.innerHTML = originalModalContent;

        // Pastikan data dari originalUserData tetap muncul
        updateModal(originalUserData);
    }

    function showEditForm(type) {
        let formContent = "";
        let title = "";
        
        if (type === "user") {
        title = "Edit User";
        formContent = `
            <label for='editUsername' class='form-label'>Username</label>
            <input type='text' id='editUsername' class='form-control' value="${originalUserData.username || ''}" required>
            <label for='editEmail' class='form-label mt-2'>Email</label>
            <input type='email' id='editEmail' class='form-control' value="${originalUserData.email || ''}" required>
            <label for='editTelephone' class='form-label mt-2'>Nomer Telephone</label>
            <input type='number' id='editTelephone' class='form-control' value="${originalUserData.telepon || ''}" required>
            <div class="d-flex justify-content-between mt-3">
                <button class="btn btn-secondary w-50 me-2" id="resetUserForm">Reset</button>
                <button class="btn btn-success w-50" id="saveUserBtn">Simpan</button>
            </div>
        `;
    } else if (type === "password") {
        title = "Edit Password";
        formContent = `
            <label for='currentPassword' class='form-label'>Password Lama</label>
            <input type='password' id='currentPassword' class='form-control' required>
            <label for='newPassword' class='form-label mt-2'>Password Baru</label>
            <input type='password' id='newPassword' class='form-control' required>
            <label for='confirmPassword' class='form-label mt-2'>Konfirmasi Password</label>
            <input type='password' id='confirmPassword' class='form-control' required>
            <div class="d-flex justify-content-between mt-3">
                <button class="btn btn-success w-100" id="savePasswordBtn">Simpan</button>
            </div>
        `;
    } else if (type === "question") {
        title = "Edit Pertanyaan Keamanan";
        formContent = `
            <label for='editSecurityQuestion' class='form-label'>Pertanyaan Keamanan</label>
            <input type='text' id='editSecurityQuestion' class='form-control' value="${originalUserData.soal_verifikasi || ''}" required>
            <label for='editSecurityAnswer' class='form-label mt-2'>Jawaban</label>
            <input type='text' id='editSecurityAnswer' class='form-control' value="${originalUserData.jawaban_verifikasi || ''}" required>
            <div class="d-flex justify-content-between mt-3">
                <button class="btn btn-secondary w-50 me-2" id="resetQuestionForm">Reset</button>
                <button class="btn btn-success w-50" id="saveQuestionBtn">Simpan</button>
            </div>
        `;
    } else if (type === "logout") {
            title = "Konfirmasi Logout";
            formContent = `
            <p class="text-center">Anda yakin ingin keluar dari akun ini?</p>
            <div class="d-flex justify-content-between mt-3">
                <button class="btn btn-secondary w-50 me-2" id="cancelLogout">Batal</button>
                <button class="btn btn-danger w-50" id="confirmLogout">Logout</button>
            </div>
        `;
    }

    modalBody.classList.add("hidden"); // Animasi keluar
    setTimeout(() => {
        modalBody.innerHTML = formContent;
        modalHeader.innerHTML = `
            <button type="button" class="btn btn-outline-light me-2" id="backToAccountModal">
                <i class="fas fa-arrow-left"></i>
            </button>
            <h5 class="modal-title">${title}</h5>
            <span type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></span>
        `;

        modalBody.classList.remove("hidden"); // Animasi masuk

        // Event listener tombol kembali
        document.getElementById("backToAccountModal").addEventListener("click", resetModal);

        // Event listener untuk tombol reset
        if (type === "user") {
            document.getElementById("resetUserForm").addEventListener("click", function () {
                document.getElementById("editUsername").value = originalUserData.username || "";
                document.getElementById("editEmail").value = originalUserData.email || "";
                document.getElementById("editTelephone").value = originalUserData.telepon || "";
            });
        } else if (type === "password") {
            document.getElementById("resetPasswordForm").addEventListener("click", function () {
                document.getElementById("currentPassword").value = "";
                document.getElementById("newPassword").value = "";
                document.getElementById("confirmPassword").value = "";
            });
        } else if (type === "question") {
            document.getElementById("resetQuestionForm").addEventListener("click", function () {
                document.getElementById("editSecurityQuestion").value = originalUserData.soal_verifikasi || "";
                document.getElementById("editSecurityAnswer").value = originalUserData.jawaban_verifikasi || "";
            });
        } else if (type === "logout") {
            document.getElementById("confirmLogout").addEventListener("click", logoutUser);
            document.getElementById("cancelLogout").addEventListener("click", resetModal);
        }
    }, 300); // Delay untuk menunggu animasi keluar selesai
    }

    editUserBtn.addEventListener("click", function () {
        showEditForm("user");
    });

    editPasswordBtn.addEventListener("click", function () {
        showEditForm("password");
    });

    editQuestionBtn.addEventListener("click", function () {
        showEditForm("question");
    });

    document.getElementById("logout").addEventListener("click", function () {
        showEditForm("logout");
    });

    function logoutUser() {
        // Tutup modal terlebih dahulu
        let modalInstance = bootstrap.Modal.getInstance(document.getElementById("accountModal"));
        if (modalInstance) {
            modalInstance.hide();
        }

        // Hapus sesi
        sessionStorage.clear();

        // Tampilkan notifikasi logout
        showToast("Anda telah berhasil keluar.", () => {
            window.location.href = "../drivers-login.html";
        });
    }

    document.getElementById("accountModal").addEventListener("hidden.bs.modal", resetModal);

    function showEditConfirmToast(message, btn, callback) {
        let toastId = "edit-confirm-toast";
        let existingToast = document.getElementById(toastId);
        if (existingToast) existingToast.remove(); // Hapus jika ada toast sebelumnya

        let toast = document.createElement("div");
        toast.id = toastId;
        toast.className = "toast-confirm";

        // Isi toast dengan tombol konfirmasi
        toast.innerHTML = `
            <p>${message}</p>
            <div class="confirm-buttons">
                <button id="confirmYes" class="confirm-yes">Ya, Edit</button>
                <button id="confirmNo" class="confirm-no">Batal</button>
            </div>
        `;

        document.body.appendChild(toast);

        // Event listener tombol "Ya, Edit"
        document.getElementById("confirmYes").addEventListener("click", function () {
            toast.remove(); // Tutup toast konfirmasi
            if (typeof callback === "function") {
                callback(); // ✅ Panggil callback hanya jika didefinisikan
            }
        });

        // Event listener tombol "Batal"
        document.getElementById("confirmNo").addEventListener("click", function () {
            toast.remove();
            btn.disabled = false; // 🔹 Aktifkan kembali tombol jika user membatalkan update
        });
    }



    function showUpdateToast(message, type = "success", callback) {
        let toastId = "update-status-toast";
        let existingToast = document.getElementById(toastId);
        if (existingToast) existingToast.remove();

        let toast = document.createElement("div");
        toast.id = toastId;
        toast.className = `toast-update ${type}`;

        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add("fade-out");
            setTimeout(() => {
                toast.remove();
                if (typeof callback === "function") {
                    callback(); // ✅ Panggil callback hanya jika ada
                }
                if (type === "success") resetModal(); // ✅ Reset modal setelah toast sukses hilang
            }, 500);
        }, 1000);
    }

    // 🔹 Fungsi untuk memperbarui data pengguna
    function updateUserData(newData, type) {
        return new Promise((resolve, reject) => {
            if (originalUserData?.uid) {
                updateUserDataByUID(originalUserData.uid, newData)
                    .then(resolve)
                    .catch(reject);
            } else {
                get(ref(database, "users")).then((snapshot) => {
                    if (snapshot.exists()) {
                        let users = snapshot.val();
                        let userKey = null;

                        Object.entries(users).forEach(([key, user]) => {
                            if (type === "user" && user?.soal_verifikasi === originalUserData.soal_verifikasi) {
                                userKey = key;
                            } else if (user?.username === originalUserData.username) {
                                userKey = key;
                            }
                        });

                        if (userKey) {
                            const userRef = ref(database, `users/${userKey}`);
                            update(userRef, newData)
                                .then(() => {
                                    showUpdateToast("✅ Data berhasil diperbarui!");
                                    resolve();
                                })
                                .catch((error) => {
                                    showUpdateToast("❌ Gagal memperbarui data!", "error");
                                    reject(error);
                                });
                        } else {
                            showUpdateToast("❌ User tidak ditemukan!", "error");
                            reject("User tidak ditemukan.");
                        }
                    } else {
                        showUpdateToast("❌ Database kosong!", "error");
                        reject("Database kosong.");
                    }
                }).catch((error) => {
                    showUpdateToast("❌ Error mengambil data!", "error");
                    reject(error);
                });
            }
        });
    }

    // 🔹 Fungsi update berdasarkan UID
    function updateUserDataByUID(uid, newData) {
        return new Promise((resolve, reject) => {
            const userRef = ref(database, `users/${uid}`);
            update(userRef, newData)
            .then(() => {
                showUpdateToast("✅ Data berhasil diperbarui untuk UID!");
                resolve();
            })
            .catch((error) => {
                showUpdateToast("❌ Error memperbarui data!", "error");
                reject(error);
            });
        });
    }

    document.addEventListener("click", async function (event) {
        let btn = event.target; // Tangkap tombol yang diklik

        if (btn.id === "saveUserBtn") {
            let newUsername = document.getElementById("editUsername");
            let newEmail = document.getElementById("editEmail");
            let newTelephone = document.getElementById("editTelephone");

            if (!newUsername.checkValidity() || !newEmail.checkValidity() || !newTelephone.checkValidity()) {
                showUpdateToast("❌ Harap isi semua kolom dengan benar!", "error");
                return;
            }

            btn.disabled = true;

            showEditConfirmToast("Apakah yakin ingin mengedit profil?", btn, function () {
                updateUserData({
                    username: newUsername.value,
                    email: newEmail.value,
                    telepon: newTelephone.value
                }, "user")
                .then(() => {
                    sessionStorage.setItem("username", newUsername.value);
                    sessionStorage.setItem("email", newEmail.value);
                    sessionStorage.setItem("telepon", newTelephone.value);
                    showUpdateToast("✅ Profil diperbarui!", "success", function () {
                        btn.disabled = false;
                        resetModal();
                    });
                })
                .catch(() => {
                    showUpdateToast("❌ Gagal memperbarui profil!", "error");
                    btn.disabled = false;
                });
            });

        } else if (btn.id === "savePasswordBtn") {
            let currentPassword = document.getElementById("currentPassword").value;
            let newPassword = document.getElementById("newPassword").value;
            let confirmPassword = document.getElementById("confirmPassword").value;

            if (!currentPassword || !newPassword || !confirmPassword) {
                showUpdateToast("❌ Semua kolom harus diisi!", "error");
                return;
            }

            if (newPassword !== confirmPassword) {
                showUpdateToast("❌ Password baru dan konfirmasi harus sama!", "error");
                return;
            }

            btn.disabled = true;

            try {
                let uid = sessionStorage.getItem("uid");
                let username = sessionStorage.getItem("username");
                let securityQuestion = sessionStorage.getItem("soal_verifikasi");

                let usersRef = ref(database, "users");
                let snapshot = await get(usersRef);

                if (!snapshot.exists()) {
                    showUpdateToast("❌ Data pengguna tidak ditemukan!", "error");
                    btn.disabled = false;
                    return;
                }

                let userKey = null;
                let userData = null;

                snapshot.forEach((child) => {
                    let data = child.val();
                    if ((uid && child.key === uid) || data.username === username || data.soal_verifikasi === securityQuestion) {
                        userKey = child.key;
                        userData = data;
                    }
                });

                if (!userData) {
                    showUpdateToast("❌ Pengguna tidak ditemukan!", "error");
                    btn.disabled = false;
                    return;
                }

                // Ambil hash password lama & salt
                const storedHash = userData.password;
                const storedSalt = userData.salt;

                if (!storedSalt) {
                    console.error("❌ Salt tidak ditemukan untuk user:", username);
                    btn.disabled = false;
                    return;
                }

                // Hash ulang currentPassword dengan salt dari database
                const hashedCurrentPassword = await hashPassword(currentPassword, storedSalt);

                if (hashedCurrentPassword !== storedHash) {
                    showUpdateToast("❌ Password lama salah!", "error");
                    btn.disabled = false;
                    return;
                }

                showEditConfirmToast("Apakah yakin ingin mengubah password?", btn, async function () {
                    try {
                        const newSalt = generateSalt(); // Buat salt baru
                        const newHashedPassword = await hashPassword(newPassword, newSalt); // Hash password baru dengan salt baru

                        await updateUserData({ password: newHashedPassword, salt: newSalt }, "user");

                        showUpdateToast("✅ Password diperbarui!", "success", function () {
                            btn.disabled = false;
                            resetModal();
                        });
                    } catch (error) {
                        console.error("❌ Gagal memperbarui password:", error);
                        showUpdateToast("❌ Gagal memperbarui password!", "error");
                        btn.disabled = false;
                    }
                });

            } catch (error) {
                console.error("Error updating password:", error);
                showUpdateToast("❌ Terjadi kesalahan!", "error");
                btn.disabled = false;
            }
        } else if (btn.id === "saveQuestionBtn") {
            let newQuestion = document.getElementById("editSecurityQuestion");
            let newAnswer = document.getElementById("editSecurityAnswer");

            if (!newQuestion.checkValidity() || !newAnswer.checkValidity()) {
                showUpdateToast("❌ Harap isi pertanyaan dan jawaban keamanan!", "error");
                return;
            }

            btn.disabled = true;

            showEditConfirmToast("Apakah yakin ingin mengubah Pertanyaan Keamanan?", btn, function () {
                updateUserData({
                    soal_verifikasi: newQuestion.value,
                    jawaban_verifikasi: newAnswer.value
                }, "question")
                .then(() => {
                    sessionStorage.setItem("soal_verifikasi", newQuestion.value);
                    sessionStorage.setItem("jawaban_verifikasi", newAnswer.value);
                    showUpdateToast("✅ pertanyaan keamanan diperbarui!", "success", function () {
                        btn.disabled = false;
                        resetModal();
                    });
                })
                .catch(() => {
                    showUpdateToast("❌ Gagal memperbarui soal verifikasi!", "error");
                    btn.disabled = false;
                });
            });
        }
    });
    
    function showToast(message, callback) {
        let overlay = document.createElement("div");
        Object.assign(overlay.style, {
            position: "fixed", top: "0", left: "0", width: "100%", height: "100%",
            backdropFilter: "blur(10px)", backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: "1000"
        });
        document.body.appendChild(overlay);

        let toast = document.createElement("div");
        toast.innerText = message;
        Object.assign(toast.style, {
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            backgroundColor: "#333", color: "#fff", padding: "12px 20px", borderRadius: "8px",
            fontSize: "16px", zIndex: "1100", display: "flex", justifyContent: "center",
            alignItems: "center", textAlign: "center", maxWidth: "90%"
        });
        document.body.appendChild(toast);

        setTimeout(() => {
            document.body.removeChild(toast);
            document.body.removeChild(overlay);
            if (callback) callback();
        }, 2000);
    }

     function showConfirmToast(message, onConfirm) {
        // Buat overlay transparan
        let overlay = document.createElement("div");
        Object.assign(overlay.style, {
            position: "fixed", top: "0", left: "0", width: "100%", height: "100%",
            backdropFilter: "blur(10px)", backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: "1000",
            display: "flex", justifyContent: "center", alignItems: "center"
        });

        // Buat container toast
        let toast = document.createElement("div");
        toast.innerHTML = `
            <p style="margin-bottom: 10px;">${message}</p>
            <button id="confirm-yes" style="margin-right: 10px; padding: 8px 15px; background-color: green; color: white; border: none; border-radius: 5px; cursor: pointer;">Ya</button>
            <button id="confirm-no" style="padding: 8px 15px; background-color: red; color: white; border: none; border-radius: 5px; cursor: pointer;">Tidak</button>
        `;
        Object.assign(toast.style, {
            backgroundColor: "#333", color: "#fff", padding: "20px", borderRadius: "8px",
            textAlign: "center", fontSize: "16px", boxShadow: "0px 4px 6px rgba(0,0,0,0.3)"
        });

        // Tambahkan toast ke overlay
        overlay.appendChild(toast);
        document.body.appendChild(overlay);

        // Event listener untuk tombol "Ya"
        document.getElementById("confirm-yes").addEventListener("click", function () {
            document.body.removeChild(overlay);
            if (onConfirm) onConfirm();
        });

        // Event listener untuk tombol "Tidak"
        document.getElementById("confirm-no").addEventListener("click", function () {
            document.body.removeChild(overlay);
        });
    }

    function checkSession() {
        let username = sessionStorage.getItem("username");
        let role = sessionStorage.getItem("role");
        let email = sessionStorage.getItem("email");

        if (!username || !role) {
            showToast("Sesi telah berakhir. Silakan login kembali.", () => {
                sessionStorage.clear();
                window.location.href = "../drivers-login.html";
            });
        }
    }
    checkSession();

    window.addEventListener("pageshow", (event) => { if (event.persisted) checkSession(); });

    document.querySelector(".logout").addEventListener("click", (event) => {
        event.preventDefault();
        showConfirmToast("Anda yakin ingin keluar?", () => {
            sessionStorage.clear();
            showToast("Anda telah berhasil keluar.", () => window.location.href = "../drivers-login.html");
        });
    });

    // 🔥 Realtime Update dari Firebase berdasarkan EMAIL
    function watchUserUpdates() {
        let userEmail = sessionStorage.getItem("email");
        if (!userEmail) return;

        onValue(usersRef, (snapshot) => {
            if (snapshot.exists()) {
                const users = snapshot.val();
                let foundUser = null;

                for (const uid in users) {
                    if (users[uid] && users[uid].email === userEmail) {
                        foundUser = users[uid];
                        break;
                    }
                }

                if (foundUser) {
                    const newUsername = foundUser.username || "Guest";
                    const newRole = foundUser.role || "administrator";

                    // ✅ Update tampilan hanya jika berubah
                    if (document.getElementById("navbarUsername").innerText !== newUsername) {
                        document.getElementById("navbarUsername").innerText = newUsername;
                        document.getElementById("dropdownUsername").innerText = newUsername;
                        sessionStorage.setItem("username", newUsername);
                        // Tambahkan log untuk memastikan perubahan
                        console.log("Username diperbarui:", sessionStorage.getItem("username"));
                    }

                    if (document.getElementById("dropdownRole").innerText !== newRole) {
                        document.getElementById("dropdownRole").innerText = newRole;
                        sessionStorage.setItem("role", newRole);
                        // Tambahkan log untuk memastikan perubahan
                        console.log("Role diperbarui:", sessionStorage.getItem("role"));
                    }

                    // ❌ Logout jika role bukan administrator
                    if (newRole !== "administrator") {
                        showToast("Akses tidak sah! Anda akan logout.", () => {
                            sessionStorage.clear();
                            window.location.href = "../drivers-login.html";
                        });
                    }
                }
            }
        });
    }

    watchUserUpdates();
});
