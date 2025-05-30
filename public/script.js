let socket;
let username = '';
let room = '';
let isAdmin = false;

function loginUser() {
  username = document.getElementById('username').value.trim();
  room = document.getElementById('room').value.trim();

  if (!username || !room) {
    alert('名前とあいことばを入力してください');
    return;
  }

  document.getElementById('login').style.display = 'none';
  document.getElementById('chat').style.display = 'block';

  socket = io();

  socket.emit('join', { name: username, room });

  socket.on('message', data => {
    addMessage(data);
  });

  socket.on('image', data => {
    addImage(data);
  });

  socket.on('video', data => {
    addVideo(data);
  });
}

function sendMessage() {
  const input = document.getElementById('message');
  const text = input.value.trim();
  if (text) {
    socket.emit('message', { name: username, message: text, room });
    input.value = '';
  }
}

function sendImage(event) {
  const file = event.target.files[0];
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = () => {
      socket.emit('image', { name: username, image: reader.result, room });
    };
    reader.readAsDataURL(file);
  }
}

function sendVideo(event) {
  const file = event.target.files[0];
  if (file && file.type.startsWith('video/')) {
    const reader = new FileReader();
    reader.onload = () => {
      socket.emit('video', { name: username, video: reader.result, room });
    };
    reader.readAsDataURL(file);
  }
}

function addMessage(data) {
  const container = document.getElementById('messages');
  const msg = document.createElement('div');
  msg.classList.add('bubble');

  if (data.isAdmin) {
    msg.classList.add('admin');
  } else if (data.name === username) {
    msg.classList.add('self');
  } else {
    msg.classList.add('other');
  }

  const timestamp = new Date(data.time || Date.now()).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  msg.innerHTML = `<strong>${data.name}:</strong><br>${data.message}<span class="timestamp">${timestamp}</span>`;
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}

function addImage(data) {
  const container = document.getElementById('messages');
  const msg = document.createElement('div');
  msg.classList.add('bubble');

  if (data.name === username) {
    msg.classList.add('self');
  } else {
    msg.classList.add('other');
  }

  msg.innerHTML = `<strong>${data.name}:</strong><br><img src="${data.image}" style="max-width: 200px;"><span class="timestamp">${new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</span>`;
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}

function addVideo(data) {
  const container = document.getElementById('messages');
  const msg = document.createElement('div');
  msg.classList.add('bubble');

  if (data.name === username) {
    msg.classList.add('self');
  } else {
    msg.classList.add('other');
  }

  msg.innerHTML = `<strong>${data.name}:</strong><br><video controls src="${data.video}" style="max-width: 200px;"></video><span class="timestamp">${new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</span>`;
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}
