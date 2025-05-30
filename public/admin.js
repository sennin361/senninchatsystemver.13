const socket = io();
const password = prompt("管理者パスワードを入力してください：");

if (password !== "sennin114514") {
  alert("パスワードが間違っています。");
  window.location.href = "/";
}

const logContainer = document.getElementById("log");
const userCountDisplay = document.getElementById("userCount");
const keywordList = document.getElementById("keywordList");

// 管理者としてログイン通知
socket.emit("admin-login");

// チャットログ表示
socket.on("log-update", (logs) => {
  logContainer.innerHTML = "";
  logs.forEach((entry) => {
    const div = document.createElement("div");
    div.textContent = `[${entry.timestamp}] ${entry.name}: ${entry.message}`;
    logContainer.appendChild(div);
  });
  logContainer.scrollTop = logContainer.scrollHeight;
});

// 接続ユーザー数の更新
socket.on("update-user-count", (count) => {
  userCountDisplay.textContent = `接続中ユーザー数: ${count}`;
});

// 全体送信ボタン
document.getElementById("broadcastForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const msg = document.getElementById("broadcastMessage").value.trim();
  if (msg) {
    socket.emit("admin-broadcast", msg);
    document.getElementById("broadcastMessage").value = "";
  }
});

// BAN機能
document.getElementById("banForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("banUser").value.trim();
  if (username) {
    socket.emit("admin-ban", username);
    document.getElementById("banUser").value = "";
    alert(`${username} をBANしました`);
  }
});

// サーバーリセット
document.getElementById("resetButton").addEventListener("click", () => {
  if (confirm("本当にサーバーをリセットしますか？（全チャットが削除されます）")) {
    socket.emit("admin-reset");
    alert("サーバーをリセットしました");
  }
});

// あいことば抽出
document.getElementById("extractKeywords").addEventListener("click", () => {
  socket.emit("admin-extract-keywords");
});

// あいことば受信
socket.on("admin-keywords", (keywords) => {
  keywordList.innerHTML = "";
  keywords.forEach((word) => {
    const li = document.createElement("li");
    li.textContent = word;
    keywordList.appendChild(li);
  });
});
