const socket = io();

const loginScreen = document.getElementById('login-screen');
const adminScreen = document.getElementById('admin-screen');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const adminPasswordInput = document.getElementById('admin-password');
const loginError = document.getElementById('login-error');

const userCountElem = document.getElementById('user-count');
const broadcastForm = document.getElementById('broadcast-form');
const broadcastMessageInput = document.getElementById('broadcast-message');
const chatlogContainer = document.getElementById('chatlog-container');

const banForm = document.getElementById('ban-form');
const banUsernameInput = document.getElementById('ban-username');
const banListElem = document.getElementById('ban-list');

const resetServerBtn = document.getElementById('reset-server-btn');

let loggedIn = false;

// 管理者ログイン処理
loginBtn.addEventListener('click', () => {
  const password = adminPasswordInput.value.trim();
  if (!password) {
    loginError.textContent = 'パスワードを入力してください。';
    loginError.style.display = 'block';
    return;
  }
  socket.emit('admin_login', { password });
});

socket.on('admin_login_result', data => {
  if (data.success) {
    loggedIn = true;
    loginScreen.classList.add('hidden');
    adminScreen.classList.remove('hidden');
    loginError.style.display = 'none';
    adminPasswordInput.value = '';
    loadInitialData();
  } else {
    loginError.textContent = 'パスワードが間違っています。';
    loginError.style.display = 'block';
  }
});

// ログアウト
logoutBtn.addEventListener('click', () => {
  loggedIn = false;
  loginScreen.classList.remove('hidden');
  adminScreen.classList.add('hidden');
});

// 接続ユーザー数の更新
socket.on('user_count', count => {
  userCountElem.textContent = count;
});

// チャットログ更新
socket.on('chatlog_update', chatlog => {
  renderChatlog(chatlog);
});

function renderChatlog(chatlog) {
  chatlogContainer.innerHTML = '';
  chatlog.forEach(msg => {
    const div = document.createElement('div');
    div.textContent = `[${msg.time}] ${msg.user}: ${msg.text}`;
    chatlogContainer.appendChild(div);
  });
}

// 全体チャット送信
broadcastForm.addEventListener('submit', e => {
  e.preventDefault();
  if (!loggedIn) return;
  const message = broadcastMessageInput.value.trim();
  if (!message) return;
  socket.emit('admin_broadcast', { message });
  broadcastMessageInput.value = '';
});

// BANユーザー登録
banForm.addEventListener('submit', e => {
  e.preventDefault();
  if (!loggedIn) return;
  const username = banUsernameInput.value.trim();
  if (!username) return;
  socket.emit('admin_ban_user', { username });
  banUsernameInput.value = '';
});

// BANリスト更新
socket.on('ban_list_update', banList => {
  banListElem.innerHTML = '';
  banList.forEach(user => {
    const li = document.createElement('li');
    li.textContent = user;
    banListElem.appendChild(li);
  });
});

// サーバーリセット
resetServerBtn.addEventListener('click', () => {
  if (!loggedIn) return;
  if (confirm('サーバーをリセットします。全チャット履歴と状態が初期化されます。よろしいですか？')) {
    socket.emit('admin_reset_server');
  }
});

// 初期データ読み込み
function loadInitialData() {
  socket.emit('admin_request_initial_data');
}

socket.on('admin_initial_data', data => {
  userCountElem.textContent = data.userCount;
  renderChatlog(data.chatlog);
  updateBanList(data.banList);
});

function updateBanList(banList) {
  banListElem.innerHTML = '';
  banList.forEach(user => {
    const li = document.createElement('li');
    li.textContent = user;
    banListElem.appendChild(li);
  });
}
