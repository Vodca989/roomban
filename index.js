import express from "express";
import session from "express-session";
import fetch from "node-fetch";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({ secret: "admin-secret", resave: false, saveUninitialized: true }));

// ===== Firebase Config =====
const firebaseConfig = {
  apiKey: "AIzaSyBE6Pb5acz6x9XIIvyIq2OaUqFPBm75SdQ",
  authDomain: "roomban-e438c.firebaseapp.com",
  projectId: "roomban-e438c",
  storageBucket: "roomban-e438c.appspot.com",
  messagingSenderId: "882078311336",
  appId: "1:882078311336:web:21f3544dc75b85930ff39d",
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// =================== HALAMAN MENFESS ===================
app.get("/", async (req, res) => {
  try {
    const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    let messagesHTML = "";
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const date = data.createdAt?.toDate().toLocaleString("id-ID") || "";
      messagesHTML += `
        <div class="message">
          <p class="text">${data.text}</p>
          <span class="time">${date}</span>
        </div>
      `;
    });

    res.send(`
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>💌 RoomBanned Anon</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Inter", "Segoe UI", sans-serif;
      background: linear-gradient(135deg,#e0e7ff,#f9fafb);
      color: #333;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }
    h1 {
      margin: 20px 0;
      text-align: center;
      font-size: 2em;
      font-weight: 700;
      color: #4f46e5;
    }
    .container {
      background: #fff;
      padding: 20px;
      border-radius: 18px;
      width: 100%;
      max-width: 600px;
      box-shadow: 0 8px 28px rgba(99,102,241,0.15);
      display: flex;
      flex-direction: column;
      gap: 16px;
      animation: fadeIn 0.5s ease;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    textarea {
      width: 100%;
      padding: 14px;
      border-radius: 12px;
      border: 1px solid #ddd;
      resize: none;
      font-size: 15px;
      min-height: 90px;
      outline: none;
      transition: border 0.3s, box-shadow 0.3s;
    }
    textarea:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99,102,241,0.2);
    }
    button {
      padding: 14px;
      border: none;
      border-radius: 12px;
      background: #4f46e5;
      color: white;
      font-size: 15px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.3s, transform 0.2s;
    }
    button:hover { background: #4338ca; transform: translateY(-2px); }
    .messages {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 400px;
      overflow-y: auto;
      margin-top: 8px;
      padding-right: 6px;
    }
    .message {
      background: #f9fafb;
      padding: 14px 16px;
      border-radius: 12px;
      border: 1px solid #eee;
      animation: fadeInUp 0.4s ease;
    }
    .message .text { margin-bottom: 6px; font-size: 15px; line-height: 1.5; color: #111; }
    .message .time { font-size: 12px; color: #666; }
    .loading-overlay {
      display: none;
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(6px);
      align-items: center;
      justify-content: center;
      z-index: 999;
      flex-direction: column;
      font-size: 15px;
      color: #333;
    }
    .spinner {
      border: 3px solid rgba(0,0,0,0.1);
      border-top: 3px solid #4f46e5;
      border-radius: 50%;
      width: 38px;
      height: 38px;
      animation: spin 1s linear infinite;
      margin-bottom: 10px;
    }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(6px);} to { opacity: 1; transform: translateY(0);} }
    @media (max-width: 600px) {
      body { padding: 12px; }
      h1 { font-size: 1.6em; }
      .container { padding: 16px; border-radius: 14px; }
      textarea { font-size: 14px; }
      button { font-size: 14px; padding: 12px; }
    }
  </style>
</head>
<body>
  <h1>💌 RoomBanned Anon</h1>
  <div class="container">
    <form method="POST" action="/send" onsubmit="showLoading()">
      <textarea name="text" placeholder="Tulis pesanmu di sini..." required></textarea>
      <button type="submit">Kirim Pesan</button>
    </form>
    <div class="messages">
      ${messagesHTML}
    </div>
  </div>

  <div class="loading-overlay" id="loading">
    <div class="spinner"></div>
    <p>Sedang mengirim...</p>
  </div>

  <script>
    function showLoading(){
      document.getElementById("loading").style.display = "flex";
    }
  </script>
</body>
</html>
    `);
  } catch (err) {
    console.error(err);
    res.send("❌ Gagal memuat pesan");
  }
});

app.post("/send", async (req, res) => {
  try {
    const { text } = req.body;
    const ipResp = await fetch("https://ipinfo.io/json");
    const ipData = await ipResp.json();

    await addDoc(collection(db, "messages"), {
      text,
      ip: ipData.ip || "unknown",
      createdAt: serverTimestamp(),
    });

    res.redirect("/");
  } catch (err) {
    console.error("❌ Error adding message:", err);
    res.send("Gagal mengirim pesan");
  }
});

// =================== LOGIN ADMIN ===================
app.get("/admin/login", (req, res) => {
  res.send(`
    <html>
      <head>
        <style>
          body {
            font-family: 'Segoe UI', sans-serif;
            background: linear-gradient(135deg,#6366f1,#9333ea);
            display:flex; justify-content:center; align-items:center;
            height:100vh; margin:0;
          }
          .login-box {
            background: rgba(255,255,255,0.1);
            padding: 30px;
            border-radius: 15px;
            color:#fff;
            box-shadow:0 8px 20px rgba(0,0,0,0.3);
            width:300px; text-align:center;
            backdrop-filter: blur(10px);
          }
          input {
            width:100%; padding:12px; margin:10px 0;
            border:none; border-radius:8px;
          }
          button {
            width:100%; padding:12px;
            border:none; border-radius:8px;
            background:#4CAF50; color:#fff;
            cursor:pointer; font-size:16px;
          }
          button:hover { background:#43a047; }
        </style>
      </head>
      <body>
        <div class="login-box">
          <h2>🔑 Login Admin</h2>
          <form method="POST" action="/admin/login">
            <input type="text" name="user" placeholder="Username" required />
            <input type="password" name="pass" placeholder="Password" required />
            <button type="submit">Login</button>
          </form>
        </div>
      </body>
    </html>
  `);
});

app.post("/admin/login", (req, res) => {
  const { user, pass } = req.body;
  if (user === "admin" && pass === "fhizanjai123") {
    req.session.loggedIn = true;
    res.redirect("/admin");
  } else {
    res.send("<p>❌ Login gagal. <a href='/admin/login'>Coba lagi</a></p>");
  }
});

function cekLogin(req, res, next) {
  if (req.session.loggedIn) next();
  else res.redirect("/admin/login");
}

// =================== PANEL ADMIN ===================
app.get("/admin", cekLogin, async (req, res) => {
  const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  let rows = "";
  snapshot.forEach((docSnap) => {
    const d = docSnap.data();
    rows += `
      <tr>
        <td>${d.text}</td>
        <td>${d.ip}</td>
        <td>${d.createdAt?.toDate().toLocaleString("id-ID")}</td>
        <td><a href="/admin/delete/${docSnap.id}" onclick="return confirm('Yakin hapus pesan ini?')">🗑️</a></td>
      </tr>`;
  });

  res.send(`
    <html>
      <head>
        <style>
          body { font-family:'Segoe UI'; background:#f4f4f9; padding:30px; }
          h1 { text-align:center; color:#4f46e5; }
          table {
            border-collapse:collapse; width:100%; background:#fff;
            border-radius:10px; overflow:hidden;
            box-shadow:0 4px 12px rgba(0,0,0,0.1);
          }
          th, td { padding:12px; text-align:left; border-bottom:1px solid #eee; }
          th { background:#4f46e5; color:#fff; }
          tr:hover { background:#f9fafb; }
        </style>
      </head>
      <body>
        <h1>📋 Panel Admin</h1>
        <table>
          <tr><th>Pesan</th><th>IP</th><th>Waktu</th><th>Aksi</th></tr>
          ${rows}
        </table>
      </body>
    </html>
  `);
});

app.get("/admin/delete/:id", cekLogin, async (req, res) => {
  await deleteDoc(doc(db, "messages", req.params.id));
  res.redirect("/admin");
});

export default app;
