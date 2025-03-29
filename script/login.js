import { database } from "../admin/script/config.js";
import { ref, get , update } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const togglePassword = document.getElementById("togglePassword");
    const submitButton = document.querySelector("button[type='submit']");
    const successAnimation = document.getElementById("success-animation");
    const toastVerifikasi = document.getElementById("toast-verifikasi");
    const toastContainer = document.querySelector(".toast-container");
    const toast = document.getElementById("toast");
    const toastText = document.getElementById("toast-text");
    const toastInput = document.getElementById("toast-input");
    const toastLabel = document.querySelector("label[for='toast-input']");
    const showPasswordButton = document.getElementById("showPassword");
    const toastButton = document.getElementById("toast-button");
    const userName = document.getElementById("user-name");
    const userRole = document.getElementById("user-role");

    // hashed password function 
    async function hashPasswordWithSalt(password) {
        // Buat salt acak (16 byte) dan ubah ke hex
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, "0")).join("");

        // Gabungkan salt dengan password
        const encoder = new TextEncoder();
        const data = encoder.encode(saltHex + password);

        // Hash menggunakan SHA-256
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

        return { salt: saltHex, hash: hashHex }; // Simpan salt & hash
    }

    async function hashPassword(password, salt) {
        const encoder = new TextEncoder();
        const data = encoder.encode(salt + password);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, "0"))
            .join("");
    }

    function testConnection() {
        const testRef = ref(database, "/");

        submitButton.disabled = true;
        submitButton.textContent = "Menguji Koneksi...";

        const timeout = setTimeout(() => {
            submitButton.disabled = true;
            submitButton.textContent = "Gagal Terhubung :(";
            console.error("❌ Koneksi Firebase timeout!");
        }, 5000);

        get(testRef)
            .then(() => {
                clearTimeout(timeout);
                submitButton.disabled = false;
                submitButton.textContent = "Sign In";
            })
            .catch((error) => {
                clearTimeout(timeout);
                submitButton.disabled = true;
                submitButton.textContent = "Gagal terhubung";
                submitButton.style.backgroundColor = "red";
                console.error("❌ Gagal terhubung ke Firebase:", error);
            });
    }

    testConnection();
    

    togglePassword.addEventListener("change", () => {
        passwordInput.type = togglePassword.checked ? "text" : "password";
    });

    showPasswordButton.addEventListener("click", () => {
    if (toastInput.type === "password") {
        toastInput.type = "text";
        showPasswordButton.innerHTML = `<i class="fas fa-eye-slash"></i> Hide Password`;
    } else {
        toastInput.type = "password";
        showPasswordButton.innerHTML = `<i class="fas fa-eye"></i> Show Password`; // Pastikan ikon reset
    }
    });
    
    // Fungsi untuk menampilkan toast dengan kontrol tampilan form
    function showToastVerifikasi(mode, message = "") {
        toastVerifikasi.classList.add("show");
        toastText.textContent = message;
        // Pastikan display berubah ke flex sebelum animasi berjalan
        toastVerifikasi.style.display = 'flex';

        if (mode === "verifikasi") {
            // Mode soal verifikasi
            toastButton.disabled = false;
            toastInput.style.display = "block";
            toastButton.style.display = "block";
            toastLabel.style.display = "block";
            toastInput.type = "text";
            toastInput.placeholder = "Jawaban Anda";
            toastButton.textContent = "Verifikasi";
            showPasswordButton.style.display = "none"; // Sembunyikan tombol Show Password
        } else if (mode === "reset") {
            // Mode reset password
            toastInput.style.display = "block";
            toastButton.style.display = "block";
            toastLabel.style.display = "block";
            toastInput.type = "password";
            toastInput.placeholder = "Password Baru";
            toastButton.textContent = "Reset Password";
            showPasswordButton.style.display = "block"; // Sembunyikan tombol Show Password
        } else {
            // Mode info/error (form tidak perlu muncul)
            toastInput.style.display = "none";
            toastButton.style.display = "none";
            toastLabel.style.display = "none";
            showPasswordButton.style.display = "none"; // Sembunyikan tombol Show Password
        }
    }

    // Fungsi untuk menutup toast dan reset form
    function closeToast() {
        toastVerifikasi.classList.remove("show");
        // Pastikan display berubah ke flex sebelum animasi berjalan
        toastVerifikasi.style.display = 'none';
        observer.disconnect(); // Hentikan pemantauan email
        setTimeout(() => {
            toastInput.value = ""; // Hapus input agar tidak menampilkan password sebelumnya
        }, 500);
        }
        
    // Pastikan bisa dipanggil dari luar file JS
    window.closeToast = closeToast;

    // Fungsi untuk memeriksa email di database secara otomatis
    function checkEmailAndShowToast() {
        const email = emailInput.value.trim();
        if (!email) {
            showToastVerifikasi("info", "⚠️ Harap masukkan email terlebih dahulu!");
            return;
        }

        // Cek apakah email ada di database
        const userRef = ref(database, "users");
        get(userRef).then((snapshot) => {
            if (snapshot.exists()) {
                let userData = null;

                snapshot.forEach((childSnapshot) => {
                    const user = childSnapshot.val();
                    if (user.email === email) {
                        userData = user;
                    }
                });

                if (userData) {
                    // Jika email ditemukan, tampilkan soal verifikasi
                    showToastVerifikasi("verifikasi", userData.soal_verifikasi);
                } else {
                    showToastVerifikasi("info", "❌ Email tidak ditemukan!");
                }
            } else {
                showToastVerifikasi("info", "⚠️ Tidak ada data pengguna!");
            }
        }).catch((error) => {
            console.error("🔥 Error saat mengambil data pengguna:", error);
            showToastVerifikasi("info", "❌ Terjadi kesalahan, coba lagi!");
        });
    }

    // Event Listener untuk Tombol "Lupa Password?"
    document.getElementById("forgotPassword").addEventListener("click", (event) => {
        event.preventDefault();
        checkEmailAndShowToast();

        // Aktifkan pemantauan perubahan input email
        observer.observe(emailInput, { attributes: true, childList: true, subtree: true, characterData: true });
    });

    // Buat Observer untuk mendeteksi perubahan pada emailInput
    const observer = new MutationObserver(() => {
        checkEmailAndShowToast();
    });

    // Event Listener untuk Tombol dalam Toast
        toastButton.addEventListener("click", () => {
        toastButton.disabled = true;
        if (toastButton.textContent === "Verifikasi") {
            const jawabanUser = toastInput.value.trim();
            const email = emailInput.value.trim();
            const userRef = ref(database, "users");

            get(userRef).then((snapshot) => {
                if (snapshot.exists()) {
                    let userData = null;
                    toastButton.disabled = false;

                    snapshot.forEach((childSnapshot) => {
                        const user = childSnapshot.val();
                        if (user.email === email) {
                            userData = user;
                        }
                    });

                    if (userData && jawabanUser === userData.jawaban_verifikasi) {
                        toastButton.disabled = false;
                        // **Jawaban benar, lanjut ke reset password**
                        toastInput.classList.remove("is-invalid"); // Hapus efek merah jika sebelumnya ada
                        toastInput.value = "";
                        showToastVerifikasi("reset", "Masukkan password baru Anda");
                    } else {
                        toastButton.disabled = false;
                        // **Jawaban salah, tampilkan pesan error & beri efek merah pada input**
                        toastInput.classList.add("is-invalid");
                        toastLabel.classList.add("is-invalid-label");
                        showToastVerifikasi("verifikasi", "❌ Jawaban salah!");

                        setTimeout(() => {
                            showToastVerifikasi("verifikasi", userData.soal_verifikasi);
                        }, 1000);
                    }
                }
            }).catch((error) => {
                console.error("🔥 Error:", error);
                showToastVerifikasi("info", "❌ Terjadi kesalahan, coba lagi!");
            });

        } else {
            // Proses reset password
            const newPassword = toastInput.value;
            if (newPassword.length < 6) {
                toastButton.disabled = false;
                // **Jawaban salah, tampilkan pesan error & beri efek merah pada input**
                toastInput.classList.add("is-warning");
                toastLabel.classList.add("is-warning-label");
                showToastVerifikasi("reset", "⚠️ Password minimal 6 karakter!");

                setTimeout(() => {
                    showToastVerifikasi("reset", "Masukkan password baru Anda");
                }, 1000);
                return;
            }

            const email = emailInput.value.trim();
            const userRef = ref(database, "users");

            get(userRef).then((snapshot) => {
                if (snapshot.exists()) {
                    let userKey = null;

                    snapshot.forEach((childSnapshot) => {
                        const user = childSnapshot.val();
                        if (user.email === email) {
                            userKey = childSnapshot.key;
                        }
                    });

                    if (userKey) {
                        hashPasswordWithSalt(newPassword).then(({ salt, hash }) => {
                            // Update password yang sudah di-hash di Firebase
                            update(ref(database, `users/${userKey}`), { 
                                password: hash, 
                                salt: salt 
                            })
                            .then(() => {
                                showToastVerifikasi("info", "✅ Password berhasil diubah!");
                                setTimeout(closeToast, 3000); // Tutup toast setelah 3 detik
                            })
                            .catch((error) => {
                                console.error("🔥 Error update password:", error);
                                showToastVerifikasi("info", "❌ Gagal mengubah password!");
                            });
                        });
                    }
                }
            });
        }
    });
        
    // **Event Listener untuk menghapus efek merah ketika user mulai mengetik ulang jawaban**
    toastInput.addEventListener("input", () => {
        if (toastInput.classList.contains("is-invalid")) {
            toastInput.classList.remove("is-invalid");
            toastLabel.classList.remove("is-invalid-label");
        }
        else if (toastInput.classList.contains("is-warning")) {
            toastInput.classList.remove("is-warning");
            toastLabel.classList.remove("is-warning-label");
        }
    });

    [emailInput, passwordInput].forEach(input => {
        input.addEventListener("input", () => {
            input.classList.remove("is-invalid");
        });
    });

    function showLoginToast(role) {
        const toast = document.getElementById("toast");
        const toastMessage = document.getElementById("toast-message");
        const toastIcon = document.getElementById("toast-icon");

        // Menentukan pesan dan ikon berdasarkan role
        if (role.toLowerCase() === "administrator") {
            toastMessage.textContent = "Opening Administrator Panel...";
            toastIcon.className = "toast-icon fa-solid fa-user-shield";
        } else if (role.toLowerCase() === "drivers") {
            toastMessage.textContent = "Opening Driver Panel...";
            toastIcon.className = "toast-icon fa-solid fa-car";
        } else {
            toastMessage.textContent = "Logging in...";
            toastIcon.className = "toast-icon fa-solid fa-circle-check";
        }

        // Tampilkan toast
        toast.classList.add("show");

        // Sembunyikan toast setelah 3 detik
        setTimeout(() => {
            toast.classList.remove("show");
        }, 3000);
    }

    function showError(input, message) {
    input.classList.add("is-invalid");

    let label = document.querySelector(`label[for='${input.id}']`);
        if (label) {
            label.classList.add("is-invalid-label");
        }

        // Cek apakah sudah ada pesan error
        let errorMessage = input.parentNode.querySelector(".error-message");
                    
        if (!errorMessage) {
            errorMessage = document.createElement("small");
            errorMessage.classList.add("error-message");
            input.parentNode.appendChild(errorMessage);
        }

        // Perbarui teks error
        errorMessage.textContent = message;

        // **Fokus ke input yang pertama kali error**
        if (!document.querySelector(".is-invalid:focus")) {
            input.focus();
        }
    }

    function clearError(input) {
        input.classList.remove("is-invalid");

        let label = document.querySelector(`label[for='${input.id}']`);
        if (label) {
            label.classList.remove("is-invalid-label");
        }

        let errorMessage = input.parentNode.querySelector(".error-message");
        if (errorMessage) {
            errorMessage.remove();
        }
    }

    form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    submitButton.disabled = true;

    if (!email || !password) {
        console.log("⚠️ Harap isi semua field!");
        return;
    }

    try {
        const usersRef = ref(database, "users");
        const snapshot = await get(usersRef);

        if (snapshot.exists()) {
            const users = snapshot.val();
            let userFound = false;
            let correctEmail = false;

            for (let key in users) {
                const user = users[key];

                if (user && user.email.trim().toLowerCase() === email.trim().toLowerCase()) {
                    correctEmail = true; // Email ditemukan

                    const storedHash = user.password; // Password di database sudah berupa hash
                    const storedSalt = user.salt; // Ambil salt dari database

                    if (!storedSalt) {
                        console.error("❌ Salt tidak ditemukan untuk user:", email);
                        break;
                    }

                    // Hash ulang password yang diinput dengan salt yang sama
                    const hashedInputPassword = await hashPassword(password, storedSalt);

                    if (hashedInputPassword === storedHash) {
                        console.log(`✅ Login Berhasil!`);
                        console.log(`🔹 Username: ${user.username}`);
                        console.log(`🔹 Role: ${user.role}`);
                        console.log(`🔹 Email: ${user.email}`);
                        console.log(`🔹 soal_verifikasi: ${user.soal_verifikasi}`);

                        sessionStorage.setItem("username", user.username);
                        sessionStorage.setItem("role", user.role);
                        sessionStorage.setItem("email", user.email);
                        sessionStorage.setItem("soal_verifikasi", user.soal_verifikasi);

                        userName.textContent = user.username;
                        userRole.textContent = user.role;

                        userFound = true; // Menandakan login sukses

                        // Tampilkan animasi login sukses
                        successAnimation.style.display = "flex";
                        setTimeout(() => {
                            successAnimation.classList.add("show");
                        }, 100);

                        // Tampilkan toast setelah 0.5 detik
                        setTimeout(() => {
                            showLoginToast(user.role);
                        }, 500);

                        // Redirect berdasarkan role setelah 2 detik
                        setTimeout(() => {
                            if (user.role.toLowerCase() === "administrator") {
                                window.location.href = "../drivego/admin";
                            } else if (user.role.toLowerCase() === "drivers") {
                                window.location.href = "../drivego/drivers";
                            }
                        }, 2000);

                        break; // Keluar dari loop karena login berhasil
                    }
                }
            }

            // **Validasi jika login gagal**
            if (!userFound) {
                submitButton.disabled = false;
                if (correctEmail) {
                    showError(passwordInput, "❌ Password salah!"); // Email benar, tapi password salah
                } else {
                    showError(emailInput, "❌ Email tidak ditemukan!"); // Email tidak ditemukan di database
                    showError(passwordInput, "❌ Password salah!");
                }
            }

            // Bersihkan error saat input berubah
            [emailInput, passwordInput].forEach(input => {
                input.addEventListener("input", () => clearError(input));
            });
        } else {
            console.log("⚠️ Tidak ada data pengguna di database!");
        }
    } catch (error) {
        console.error("❌ Error saat login:", error);
    }
});
});
