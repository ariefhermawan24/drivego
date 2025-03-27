import { database } from "../admin/script/config.js";
import { ref, onValue , get } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

document.addEventListener("DOMContentLoaded", function () {
    let email = sessionStorage.getItem("email") || null; // Ambil email dari session storage
    let username = sessionStorage.getItem("username") || "Guest";
    let role = sessionStorage.getItem("role") || "administrator";

    const usersRef = ref(database, "users");

    document.getElementById("navbarUsername").innerText = username;
    document.getElementById("dropdownUsername").innerText = username;
    document.getElementById("dropdownRole").innerText = role;

    // Fungsi untuk mengambil data pengguna berdasarkan username
    function fetchUserData() {
        get(usersRef).then((snapshot) => {
            if (snapshot.exists()) {
                let usersData = snapshot.val();

                // Cek apakah data dalam format UID (Object) atau Array
                if (Array.isArray(usersData)) {
                    // Jika array, cari berdasarkan username
                    let user = usersData.find(user => user && user.username === username);
                    if (user) {
                        updateModal(user);
                    } else {
                        console.log("User tidak ditemukan dalam array.");
                    }
                } else {
                    // Jika object dengan UID sebagai key, cari berdasarkan username
                    let user = Object.values(usersData).find(user => user.username === username);
                    if (user) {
                        updateModal(user);
                    } else {
                        console.log("User tidak ditemukan dalam object.");
                    }
                }
            } else {
                console.log("Database kosong.");
            }
        }).catch((error) => {
            console.error("Error fetching user data:", error);
        });
    }

    // Fungsi untuk menampilkan data di modal
    function updateModal(userData) {
        document.getElementById("modalUsername").textContent = userData.username || "Guest";
        document.getElementById("modalEmail").textContent = userData.email || "Tidak tersedia";
        document.getElementById("modalRole").textContent = userData.role || "Administrator";
        document.getElementById("modalTelepon").textContent = userData.telepon || "-";
        document.getElementById("modalSoal").textContent = userData.soal_verifikasi || "-";
        document.getElementById("modalJawaban").textContent = userData.jawaban_verifikasi || "-";
    }

    // Panggil fungsi saat modal ditampilkan
    fetchUserData();

    function showEditToast(title, fields, saveCallback) {
        let existingToast = document.querySelector(".custom-toast");
        if (existingToast) existingToast.remove();

        const toast = document.createElement("div");
        toast.classList.add("custom-toast", "toast-form");

        toast.innerHTML = `
            <div class="toast-header">
                <h5>${title}</h5>
                <button class="toast-close" id="closeToastBtn">
                    <i class="fas fa-times"></i> <!-- Ikon X dari FontAwesome -->
                </button>
            </div>
            <form id="toastForm">
                ${fields
                    .map(
                        (field) => `
                    <label>${field.label}</label>
                    <input type="text" id="${field.id}" value="${field.value}" class="toast-input">
                `
                    )
                    .join("")}
                <div class="toast-footer">
                    <button type="button" class="btn btn-reset" id="resetToastBtn">Reset</button>
                    <button type="button" class="btn btn-save" id="saveToastBtn">Simpan</button>
                </div>
            </form>
        `;

        document.body.appendChild(toast);

        if (window.innerWidth <= 768) {
            toast.classList.add("mobile-toast");
        }

        setTimeout(() => {
            toast.classList.add("show");
        }, 100);

        // Tombol Reset (Mengembalikan ke nilai awal)
        document.getElementById("resetToastBtn").addEventListener("click", function () {
            fields.forEach((field) => {
                document.getElementById(field.id).value = field.value;
            });
        });

        // Tombol Simpan
        document.getElementById("saveToastBtn").addEventListener("click", function () {
            let formData = {};
            fields.forEach((field) => {
                formData[field.id] = document.getElementById(field.id).value;
            });

            saveCallback(formData);

            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 300);
        });

        // Tombol Tutup (X)
        document.getElementById("closeToastBtn").addEventListener("click", function () {
            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 300);
        });
    }

    document.querySelector(".modal-footer").addEventListener("click", function (event) {
        let button = event.target.closest("button");
        if (!button) return;

        switch (button.id) {
            case "editUserBtn":
                showEditToast(
                    "Edit Profil Pengguna",
                    [
                        { id: "editUsername", label: "Username", value: document.getElementById("modalUsername").textContent },
                        { id: "editEmail", label: "Email", value: document.getElementById("modalEmail").textContent },
                        { id: "editTelepon", label: "Telepon", value: document.getElementById("modalTelepon").textContent }
                    ],
                    (formData) => {
                        console.log("User Updated:", formData);
                    }
                );
                break;

            case "editPasswordBtn":
                showEditToast(
                    "Edit Password",
                    [
                        { id: "editPassword", label: "Password Lama", value: "" },
                        { id: "editNewPassword", label: "Password Baru", value: "" }
                    ],
                    (formData) => {
                        console.log("Password Updated:", formData);
                    }
                );
                break;

            case "editQuestionBtn":
                showEditToast(
                    "Edit Soal Verifikasi",
                    [
                        { id: "editSoal", label: "Soal Verifikasi", value: document.getElementById("modalSoal").textContent },
                        { id: "editJawaban", label: "Jawaban", value: document.getElementById("modalJawaban").textContent }
                    ],
                    (formData) => {
                        console.log("Soal Verifikasi Updated:", formData);
                    }
                );
                break;
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
