const socket = io();
let username = "";

while (!username) {
  username = prompt("ユーザー名を入力してください：");
}

const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const chatBox = document.getElementById("chatBox");
const imageInput = document.getElementById("imageInput");
const videoInput = document.getElementById("videoInput");
const roomName = "main";

// 入室通知
socket.emit("join", { name: username, room: roomName });

// 送信処理
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const message = messageInput.value.trim();
  if (message) {
    socket.emit("chat message", { name: username, message, room: roomName });
    messageInput.value = "";
  }
});

// 画像送信
imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    socket.emit("image", {
      name: username,
      image: reader.result,
      room: roomName,
    });
  };
  reader.readAsDataURL(file);
});

// 動画送信
videoInput.addEventListener("change", () => {
  const file = videoInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    socket.emit("video", {
      name: username,
      video: reader.result,
      room: roomName,
    });
  };
  reader.readAsDataURL(file);
});

// メッセージ受信
socket.on("chat message", (data) => {
  const bubble = document.createElement("div");
  bubble.classList.add("bubble");

  if (data.name === username) {
    bubble.classList.add("me");
  } else if (data.name === "[管理者]") {
    bubble.classList.add("admin");
  } else {
    bubble.classList.add("other");
  }

  bubble.innerHTML = `<strong>${data.name}:</strong> ${data.message}`;
  chatBox.appendChild(bubble);
  chatBox.scrollTop = chatBox.scrollHeight;
});

// 画像受信
socket.on("image", (data) => {
  const bubble = document.createElement("div");
  bubble.classList.add("bubble");

  if (data.name === username) {
    bubble.classList.add("me");
  } else if (data.name === "[管理者]") {
    bubble.classList.add("admin");
  } else {
    bubble.classList.add("other");
  }

  const img = document.createElement("img");
  img.src = data.image;
  img.style.maxWidth = "200px";
  bubble.innerHTML = `<strong>${data.name}:</strong><br>`;
  bubble.appendChild(img);
  chatBox.appendChild(bubble);
  chatBox.scrollTop = chatBox.scrollHeight;
});

// 動画受信
socket.on("video", (data) => {
  const bubble = document.createElement("div");
  bubble.classList.add("bubble");

  if (data.name === username) {
    bubble.classList.add("me");
  } else if (data.name === "[管理者]") {
    bubble.classList.add("admin");
  } else {
    bubble.classList.add("other");
  }

  const video = document.createElement("video");
  video.src = data.video;
  video.controls = true;
  video.style.maxWidth = "200px";
  bubble.innerHTML = `<strong>${data.name}:</strong><br>`;
  bubble.appendChild(video);
  chatBox.appendChild(bubble);
  chatBox.scrollTop = chatBox.scrollHeight;
});

// 入退室ログ表示
socket.on("system", (msg) => {
  const div = document.createElement("div");
  div.classList.add("system");
  div.textContent = msg;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
});
