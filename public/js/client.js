let socket;
let currentUsername = '';

const loginScreen = document.getElementById('loginScreen');
const chatScreen = document.getElementById('chatScreen');
const usernameInput = document.getElementById('usernameInput');
const joinBtn = document.getElementById('joinBtn');
const logoutBtn = document.getElementById('logoutBtn');
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const fileInput = document.getElementById('fileInput');
const imageInput = document.getElementById('imageInput');
const usersList = document.getElementById('usersList');
const userCount = document.getElementById('userCount');
const currentUsernameDisplay = document.getElementById('currentUsername');
const clearMemoryBtn = document.getElementById('clearMemoryBtn');
const sidebar = document.getElementById('sidebar');
const toggleUsersBtn = document.getElementById('toggleUsersBtn');

window.addEventListener('load', loadSavedUsername);

joinBtn.addEventListener('click', joinChat);
usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') joinChat();
});

clearMemoryBtn.addEventListener('click', clearMemory);

logoutBtn.addEventListener('click', logout);
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

fileInput.addEventListener('change', handleFileSelect);
imageInput.addEventListener('change', handleImageSelect);

// 手机端：切换用户面板
if (toggleUsersBtn) {
    toggleUsersBtn.addEventListener('click', () => {
        const sidebarEl = document.querySelector('.sidebar');
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            sidebarEl.classList.toggle('expanded');
            toggleUsersBtn.textContent = sidebarEl.classList.contains('expanded') ? '👥' : '👤';
        } else {
            sidebarEl.classList.toggle('hidden');
            toggleUsersBtn.textContent = sidebarEl.classList.contains('hidden') ? '👤' : '👥';
        }
    });
}

function loadSavedUsername() {
    const savedUsername = localStorage.getItem('lan-chat-username');
    if (savedUsername) {
        usernameInput.value = savedUsername;
        usernameInput.placeholder = '上次使用: ' + savedUsername;
    }
}

function clearMemory() {
    if (confirm('确定要清除保存的昵称吗？')) {
        localStorage.removeItem('lan-chat-username');
        usernameInput.value = '';
        usernameInput.placeholder = '输入昵称';
        alert('昵称记忆已清除！');
    }
}

function joinChat() {
    const username = usernameInput.value.trim();
    if (username === '') {
        alert('请输入昵称');
        return;
    }

    currentUsername = username;
    currentUsernameDisplay.textContent = username;

    localStorage.setItem('lan-chat-username', username);

    socket = io();

    socket.emit('user:join', username);

    socket.on('users:update', updateUsersList);
    socket.on('message:receive', displayMessage);
    socket.on('message:system', displaySystemMessage);
    socket.on('file:receive', displayFile);
    socket.on('history:load', loadHistoryMessages);

    loginScreen.style.display = 'none';
    chatScreen.style.display = 'flex';
}

function logout() {
    if (socket) {
        socket.disconnect();
    }
    loginScreen.style.display = 'flex';
    chatScreen.style.display = 'none';
    usernameInput.value = '';
    messagesContainer.innerHTML = '<div class="welcome-message">欢迎来到局域网聊天室！开始聊天吧 💬</div>';
}

function sendMessage() {
    const message = messageInput.value.trim();
    if (message === '') return;

    socket.emit('message:send', { message });
    messageInput.value = '';
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    fileInput.value = '';

    const sendBtn = document.getElementById('sendBtn');
    sendBtn.textContent = '发送中...';
    sendBtn.disabled = true;

    const reader = new FileReader();
    reader.onload = (event) => {
        socket.emit('file:upload', {
            fileName: file.name,
            fileSize: file.size,
            fileData: event.target.result
        });
        sendBtn.textContent = '发送';
        sendBtn.disabled = false;
    };
    reader.onerror = () => {
        alert('文件读取失败');
        sendBtn.textContent = '发送';
        sendBtn.disabled = false;
    };
    reader.readAsDataURL(file);
}

function handleImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    imageInput.value = '';

    const reader = new FileReader();
    reader.onload = (event) => {
        socket.emit('file:upload', {
            fileName: file.name,
            fileSize: file.size,
            fileData: event.target.result
        });
    };
    reader.readAsDataURL(file);
}

function displayMessage(data) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user';

    const time = new Date(data.timestamp).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
    });

    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-username">${escapeHtml(data.username)}</span>
            <span class="message-time">${time}</span>
        </div>
        <div class="message-content">${escapeHtml(data.message)}</div>
    `;

    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

function displaySystemMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message system';
    messageDiv.textContent = message;
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

function isImageFile(fileName) {
    const ext = fileName.toLowerCase().split('.').pop();
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext);
}

function displayFile(data) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message file';

    const time = new Date(data.timestamp).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
    });

    const fileSize = formatFileSize(data.fileSize);
    const fileUrl = data.fileUrl || data.fileData;

    if (isImageFile(data.fileName)) {
        messageDiv.innerHTML = `
            <div class="message-header">
                <span class="message-username">${escapeHtml(data.username)}</span>
                <span class="message-time">${time}</span>
            </div>
            <div class="image-content">
                <img class="chat-image" src="${fileUrl}" alt="${escapeHtml(data.fileName)}" onclick="showImageModal(this.src)">
                <span class="image-name">${escapeHtml(data.fileName)} (${fileSize})</span>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="message-header">
                <span class="message-username">${escapeHtml(data.username)}</span>
                <span class="message-time">${time}</span>
            </div>
            <div class="message-content" onclick="downloadFile('${fileUrl}', '${escapeHtml(data.fileName)}')">
                <div class="file-icon">📄</div>
                <div class="file-info">
                    <div class="file-name">${escapeHtml(data.fileName)}</div>
                    <div class="file-size">${fileSize}</div>
                </div>
                <div>⬇️</div>
            </div>
        `;
    }

    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

function downloadFile(url, fileName) {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
}

function showImageModal(src) {
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `
        <span class="modal-close">&times;</span>
        <div class="modal-content">
            <img class="modal-image" src="${src}">
        </div>
    `;
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('modal-close')) {
            modal.remove();
        }
    });
    document.body.appendChild(modal);
}

function updateUsersList(users) {
    userCount.textContent = users.length;
    usersList.innerHTML = '';

    users.forEach(user => {
        const userDiv = document.createElement('div');
        userDiv.className = 'user-item';

        const initial = user.username.charAt(0).toUpperCase();

        userDiv.innerHTML = `
            <div class="user-avatar">${initial}</div>
            <div class="user-name">${escapeHtml(user.username)}</div>
        `;

        usersList.appendChild(userDiv);
    });
}

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function loadHistoryMessages(history) {
    messagesContainer.innerHTML = '';

    if (history.length === 0) {
        messagesContainer.innerHTML = '<div class="welcome-message">欢迎来到局域网聊天室！开始聊天吧 💬</div>';
        return;
    }

    const historyHeader = document.createElement('div');
    historyHeader.className = 'message system';
    historyHeader.textContent = `📜 加载了 ${history.length} 条历史消息`;
    messagesContainer.appendChild(historyHeader);

    history.forEach(item => {
        if (item.type === 'text') {
            displayMessage(item);
        } else if (item.type === 'file') {
            displayFile(item);
        } else if (item.type === 'system') {
            displaySystemMessage(item.message);
        }
    });

    scrollToBottom();
}
