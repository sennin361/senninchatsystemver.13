const socket = io();
const loginScreen = document.getElementById('login-screen');
const chatScreen = document.getElementById('chat-screen');
const chatBox = document.getElementById('chat-box');
const nameInput = document.getElementById('name');
const passInput = document.getElementById('password');
const roomInput = document.getElementById('room');
const messageInput = document.getElementById('message');
const imageInput = document.getElementById('imageInput');
const videoInput = document.getElementById('videoInput');

document.getElementById('join').onclick = () => {
  const name = nameInput.value.trim();
  const password = passInput.value;
  const room = roomInput.value.trim();
  if (!name || !room) return alert('名前とあいことばを入力してください');
  socket.emit('join', { name, password, room });
  loginScreen.classList.add('hidden');
  chatScreen.classList.remove('hidden');
};

document.getElementById('send').onclick = () => {
  const msg = messageInput.value;
  if (msg) {
    socket.emit('chat message', msg);
    messageInput.value = '';
  }
};

socket.on('chat message', msg => {
  addMessage(msg.user, msg.text, msg.read);
  socket.emit('read');
});

socket.on('image', msg => {
  const div = document.createElement('div');
  div.className = 'message ' + bubbleClass(msg.user);
  const img = document.createElement('img');
  img.src = msg.image;
  img.className = 'chat-image';
  div.appendChild(img);
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
  socket.emit('read');
});

socket.on('video', msg => {
  const div = document.createElement('div');
  div.className = 'message ' + bubbleClass(msg.user);
  const vid = document.createElement('video');
  vid.src = msg.video;
  vid.controls = true;
  vid.className = 'chat-video';
  div.appendChild(vid);
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
  socket.emit('read');
});

socket.on('system', msg => {
  const div = document.createElement('div');
  div.className = 'message system';
  div.textContent = msg;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
});

socket.on('chat log', logs => {
  logs.forEach(m => {
    if (m.text) socket.emit('chat message', m.text);
    if (m.image) socket.emit('image', m.image);
    if (m.video) socket.emit('video', m.video);
  });
});

socket.on('banned', () => {
  alert('あなたはBANされています');
  location.reload();
});

function addMessage(user, text, read) {
  const div = document.createElement('div');
  div.className = 'message ' + bubbleClass(user);
  div.textContent = `${user}: ${text}` + (read ? ' ✅' : '');
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function bubbleClass(user) {
  if (user === nameInput.value.trim()) return 'me';
  if (user === '管理者' || passInput.value === 'sennin114514') return 'admin';
  return 'other';
}

document.getElementById('exit').onclick = () => {
  location.reload();
};

imageInput.onchange = () => {
  const file = imageInput.files[0];
  const reader = new FileReader();
  reader.onload = () => {
    socket.emit('image', reader.result);
  };
  reader.readAsDataURL(file);
};

videoInput.onchange = () => {
  const file = videoInput.files[0];
  const reader = new FileReader();
  reader.onload = () => {
    socket.emit('video', reader.result);
  };
  reader.readAsDataURL(file);
};
