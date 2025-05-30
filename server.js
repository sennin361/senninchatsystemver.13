const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto-js");
const bodyParser = require("body-parser");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;
const CHATLOG_PATH = "chatlog.json";
const ADMIN_PASSWORD = "sennin114514";
const AES_KEY = "sennin-secret";

let users = {};
let bannedUsers = new Set();
let maintenanceMode = false;

// ミドルウェア
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// 初期チャットログ
if (!fs.existsSync(CHATLOG_PATH)) {
  fs.writeFileSync(CHATLOG_PATH, JSON.stringify([]));
}

// 暗号化関数
function encrypt(text) {
  return crypto.AES.encrypt(text, AES_KEY).toString();
}

function decrypt(cipher) {
  try {
    return crypto.AES.decrypt(cipher, AES_KEY).toString(crypto.enc.Utf8);
  } catch (e) {
    return "";
  }
}

// ソケット通信
io.on("connection", (socket) => {
  let username = "";

  socket.on("join", (name) => {
    if (bannedUsers.has(name)) {
      socket.emit("banned");
      socket.disconnect();
      return;
    }
    username = name;
    users[socket.id] = name;

    const joinMsg = {
      user: "system",
      text: `${name} が入室しました`,
      time: Date.now()
    };
    saveMessage(joinMsg);
    io.emit("message", joinMsg);
  });

  socket.on("chat message", (encryptedMsg) => {
    const decrypted = decrypt(encryptedMsg);
    if (!username || !decrypted) return;

    const message = {
      user: username,
      text: decrypted,
      time: Date.now()
    };
    saveMessage(message);
    io.emit("message", message);
  });

  socket.on("leave", () => {
    if (username) {
      const leaveMsg = {
        user: "system",
        text: `${username} が退室しました`,
        time: Date.now()
      };
      saveMessage(leaveMsg);
      io.emit("message", leaveMsg);
    }
    delete users[socket.id];
  });

  socket.on("disconnect", () => {
    if (username) {
      const leaveMsg = {
        user: "system",
        text: `${username} が切断されました`,
        time: Date.now()
      };
      saveMessage(leaveMsg);
      io.emit("message", leaveMsg);
    }
    delete users[socket.id];
  });
});

// チャットログ保存
function saveMessage(msg) {
  const log = JSON.parse(fs.readFileSync(CHATLOG_PATH));
  log.push(msg);
  fs.writeFileSync(CHATLOG_PATH, JSON.stringify(log, null, 2));
}

// 管理API
app.post("/admin/login", (req, res) => {
  const { password } = req.body;
  res.json({ success: password === ADMIN_PASSWORD });
});

app.get("/admin/chatlog", (req, res) => {
  const log = JSON.parse(fs.readFileSync(CHATLOG_PATH));
  res.json(log);
});

app.get("/admin/users", (req, res) => {
  res.json(Object.values(users));
});

app.post("/admin/broadcast", (req, res) => {
  const msg = {
    user: "admin",
    text: req.body.text,
    time: Date.now()
  };
  saveMessage(msg);
  io.emit("message", msg);
  res.json({ success: true });
});

app.post("/admin/ban", (req, res) => {
  const name = req.body.name;
  bannedUsers.add(name);
  res.json({ success: true });
});

app.post("/admin/reset", (req, res) => {
  fs.writeFileSync(CHATLOG_PATH, JSON.stringify([]));
  res.json({ success: true });
});

app.get("/admin/keywords", (req, res) => {
  const log = JSON.parse(fs.readFileSync(CHATLOG_PATH));
  const keywords = {};
  log.forEach((m) => {
    const words = m.text.split(/\s+/);
    words.forEach((w) => {
      if (w.length > 2) {
        keywords[w] = (keywords[w] || 0) + 1;
      }
    });
  });
  const sorted = Object.entries(keywords).sort((a, b) => b[1] - a[1]);
  res.json(sorted.slice(0, 20));
});

server.listen(PORT, () => {
  console.log(`Sennin Chat Server listening on http://localhost:${PORT}`);
});
