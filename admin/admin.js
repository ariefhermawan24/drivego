import { database } from "../admin/script/config.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

document.addEventListener("DOMContentLoaded", function () {
    let email = sessionStorage.getItem("email") || null; // Ambil email dari session storage
    let username = sessionStorage.getItem("username") || "Guest";
    let role = sessionStorage.getItem("role") || "administrator";

    document.getElementById("navbarUsername").innerText = username;
    document.getElementById("dropdownUsername").innerText = username;
    document.getElementById("dropdownRole").innerText = role;

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

        if (!username || !role || !email) {
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

        const usersRef = ref(database, "users");

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
