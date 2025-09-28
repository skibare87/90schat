// UI Manager
class UIManager {
    constructor() {
        this.activeWindows = new Map();
        this.windowZIndex = 1000;
        this.activeWindow = null;
        this.taskbarItems = new Map();
        this.contextMenu = null;
    }

    initialize() {
        this.setupEventListeners();
        this.createTaskbar();
    }

    setupEventListeners() {
        // Login form
        const signOnBtn = document.getElementById('sign-on-btn');
        const signupBtn = document.getElementById('signup-btn');
        const logoutBtn = document.getElementById('logout-btn');

        if (signOnBtn) {
            signOnBtn.addEventListener('click', this.handleLogin.bind(this));
        }

        if (signupBtn) {
            signupBtn.addEventListener('click', this.showSignupModal.bind(this));
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.handleLogout.bind(this));
        }

        // Signup modal
        const signupForm = document.getElementById('signup-form');
        const closeSignup = document.getElementById('close-signup');
        const cancelSignup = document.getElementById('cancel-signup');

        if (signupForm) {
            signupForm.addEventListener('submit', this.handleSignup.bind(this));
        }

        if (closeSignup) {
            closeSignup.addEventListener('click', this.hideSignupModal.bind(this));
        }

        if (cancelSignup) {
            cancelSignup.addEventListener('click', this.hideSignupModal.bind(this));
        }

        // Room list
        const refreshRooms = document.getElementById('refresh-rooms');
        if (refreshRooms) {
            refreshRooms.addEventListener('click', () => {
                if (window.chatManager) {
                    window.chatManager.loadRooms();
                }
            });
        }

        // Enter key submissions
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const activeElement = document.activeElement;

                if (activeElement.id === 'username' || activeElement.id === 'password') {
                    this.handleLogin();
                } else if (activeElement.classList.contains('aol-chat-input')) {
                    this.handleChatInput(activeElement);
                }
            }
        });

        // Global click handler for context menus
        document.addEventListener('click', (e) => {
            if (this.contextMenu && !this.contextMenu.contains(e.target)) {
                this.hideContextMenu();
            }
        });

        // Window management
        document.addEventListener('mousedown', (e) => {
            const window = e.target.closest('.window');
            if (window && !e.target.closest('.window-controls')) {
                this.bringWindowToFront(window);
            }
        });
    }

    async handleLogin() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        if (!username || !password) {
            Utils.showError('Please enter both username and password');
            return;
        }

        this.showLoading('Signing on...');

        try {
            const result = await authManager.login(username, password);

            if (result.success) {
                await this.switchToChatScreen();
                Utils.showNotification('Welcome!', result.message || `Welcome back, ${username}!`);
            } else {
                Utils.showError(result.error || 'Login failed');
            }
        } catch (error) {
            Utils.showError(error.message || 'Login failed');
        } finally {
            this.hideLoading();
        }
    }

    showSignupModal() {
        const modal = document.getElementById('signup-modal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    hideSignupModal() {
        const modal = document.getElementById('signup-modal');
        if (modal) {
            modal.classList.remove('active');
            document.getElementById('signup-form').reset();
        }
    }

    async handleSignup(event) {
        event.preventDefault();

        const username = document.getElementById('new-username').value.trim();
        const password = document.getElementById('new-password').value;
        const email = document.getElementById('email').value.trim();

        this.showLoading('Creating account...');

        try {
            const result = await authManager.signup(username, password, email || null);

            if (result.success) {
                this.hideSignupModal();
                await this.switchToChatScreen();
                Utils.showNotification('Account Created!', result.message);
            } else {
                Utils.showError(result.error || 'Signup failed');
            }
        } catch (error) {
            Utils.showError(error.message || 'Signup failed');
        } finally {
            this.hideLoading();
        }
    }

    handleLogout() {
        if (window.chatManager) {
            window.chatManager.disconnect();
        }

        authManager.logout();
        this.switchToLoginScreen();
        Utils.showNotification('Goodbye!', 'You have been signed off');
    }

    async switchToChatScreen() {
        // Hide login screen
        const loginScreen = document.getElementById('login-screen');
        const chatScreen = document.getElementById('chat-screen');

        if (loginScreen) loginScreen.classList.remove('active');
        if (chatScreen) chatScreen.classList.add('active');

        // Update user info
        const usernameElement = document.getElementById('current-username');
        if (usernameElement) {
            const userInfo = authManager.getUserInfo();
            usernameElement.textContent = userInfo.username;

            // Add admin badge if user is admin
            if (userInfo.isAdmin) {
                usernameElement.innerHTML = `${userInfo.username} <span style="color: red; font-weight: bold;">(Admin)</span>`;
            }
        }

        // Connect to chat and initialize AOL manager
        try {
            await window.chatManager.connect();
            await window.chatManager.loadRooms();
            await window.aolManager.initialize();
        } catch (error) {
            Utils.showError(`Failed to connect to chat: ${error.message}`);
        }
    }

    switchToLoginScreen() {
        const loginScreen = document.getElementById('login-screen');
        const chatScreen = document.getElementById('chat-screen');

        if (chatScreen) chatScreen.classList.remove('active');
        if (loginScreen) loginScreen.classList.add('active');

        // Clear form
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';

        // Close all chat windows
        this.activeWindows.clear();
        this.removeAllTaskbarItems();
    }

    updateRoomList(rooms) {
        // This is now handled by the AOL manager
        if (window.aolManager) {
            window.aolManager.updateRoomList(rooms);
        }
    }

    async joinRoom(roomId, roomName) {
        try {
            await window.chatManager.joinRoom(roomId);
        } catch (error) {
            Utils.showError(error.message);
        }
    }

    createChatWindow(roomId, roomName) {
        // Don't create duplicate windows
        if (this.activeWindows.has(roomId)) {
            this.bringWindowToFront(this.activeWindows.get(roomId));
            return;
        }

        const chatWindow = Utils.dom.create('div', {
            className: 'window chat-window',
            id: `chat-window-${roomId}`,
            'data-room-id': roomId
        });

        chatWindow.style.zIndex = ++this.windowZIndex;
        chatWindow.style.position = 'absolute';
        chatWindow.style.top = '50px';
        chatWindow.style.left = '50px';
        chatWindow.style.width = '640px';
        chatWindow.style.height = '480px';
        chatWindow.style.display = 'block';
        chatWindow.style.visibility = 'visible';

        chatWindow.innerHTML = `
            <div class="window-header chat-header">
                <div class="window-title">
                    <img src="assets/aol-icon.png" alt="AOL" class="window-icon">
                    America Online - [${Utils.escapeHtml(roomName)}]
                </div>
                <div class="window-controls">
                    <button class="control-btn minimize">_</button>
                    <button class="control-btn maximize">□</button>
                    <button class="control-btn close">×</button>
                </div>
            </div>
            <div class="chat-content">
                <!-- AOL Menu Bar -->
                <div class="aol-menu-bar">
                    <div class="aol-menu-item">File</div>
                    <div class="aol-menu-item">Edit</div>
                    <div class="aol-menu-item">Window</div>
                    <div class="aol-menu-item">Sign Off</div>
                    <div class="aol-menu-item">Help</div>
                </div>

                <!-- AOL Toolbar -->
                <div class="aol-toolbar">
                    <div class="aol-toolbar-section">
                        <button class="aol-toolbar-button">Read</button>
                        <button class="aol-toolbar-button">Write</button>
                        <button class="aol-toolbar-button">Mail Center</button>
                        <button class="aol-toolbar-button">Print</button>
                        <button class="aol-toolbar-button">My Files</button>
                    </div>
                    <div class="aol-toolbar-section">
                        <button class="aol-toolbar-button">My AOL</button>
                        <button class="aol-toolbar-button">Favorites</button>
                        <button class="aol-toolbar-button">Internet</button>
                        <button class="aol-toolbar-button">Channels</button>
                    </div>
                    <div class="aol-toolbar-section">
                        <button class="aol-toolbar-button">People</button>
                        <button class="aol-toolbar-button">Quotes</button>
                        <button class="aol-toolbar-button">PSX</button>
                    </div>
                    <div class="aol-toolbar-section">
                        <input type="text" class="aol-search-box" placeholder="Type Search words, Keywords or a Web address here">
                        <button class="aol-toolbar-button">Go</button>
                        <button class="aol-toolbar-button">Search</button>
                        <button class="aol-toolbar-button">Keyword</button>
                    </div>
                </div>

                <!-- Chat Area -->
                <div class="chat-main">
                    <div class="chat-messages-section">
                        <div class="chat-messages" id="messages-${roomId}"></div>
                    </div>
                    <div class="aol-users-section">
                        <div class="aol-users-header">
                            <span id="user-count-${roomId}" class="aol-users-count">0</span> people here
                        </div>
                        <div class="aol-users" id="users-${roomId}"></div>
                    </div>
                </div>

                <!-- Chat Input -->
                <div class="aol-chat-input-section">
                    <div class="aol-chat-input-container">
                        <input type="text" class="aol-chat-input" placeholder="" maxlength="500" data-room-id="${roomId}">
                        <button class="aol-send-button">Send</button>
                    </div>
                </div>

                <!-- Bottom Toolbar -->
                <div class="aol-bottom-toolbar">
                    <button class="aol-bottom-button">Chat</button>
                    <button class="aol-bottom-button">Private Chat</button>
                    <button class="aol-bottom-button">Notify AOL</button>
                    <button class="aol-bottom-button">Chat Preferences</button>
                    <button class="aol-bottom-button">Member Directory</button>
                </div>
            </div>
        `;

        // Add event listeners
        const minimizeBtn = chatWindow.querySelector('.minimize');
        const closeBtn = chatWindow.querySelector('.close');
        const sendBtn = chatWindow.querySelector('.aol-send-button');
        const chatInput = chatWindow.querySelector('.aol-chat-input');

        minimizeBtn.addEventListener('click', () => this.minimizeWindow(chatWindow));
        closeBtn.addEventListener('click', () => this.closeChatWindow(roomId));
        sendBtn.addEventListener('click', () => this.handleChatInput(chatInput));

        // Make window draggable
        this.makeDraggable(chatWindow);

        // Add to DOM and track - specifically target chat screen desktop
        const chatDesktop = document.querySelector('#chat-screen .desktop');
        if (chatDesktop) {
            chatDesktop.appendChild(chatWindow);
        }

        this.activeWindows.set(roomId, chatWindow);

        // Add taskbar item
        this.addTaskbarItem(roomId, roomName, chatWindow);

        // Focus the input
        setTimeout(() => chatInput.focus(), 100);

        return chatWindow;
    }

    handleChatInput(inputElement) {
        const message = inputElement.value.trim();
        if (!message) return;

        const success = window.chatManager.sendMessage(message);
        if (success) {
            inputElement.value = '';
        }
    }

    addMessageToWindow(roomId, message) {
        const messagesContainer = document.getElementById(`messages-${roomId}`);
        if (!messagesContainer) return;

        const messageElement = Utils.dom.create('div', {
            className: `aol-message`,
            'data-message-id': message.id
        });

        const isCurrentUser = message.username === authManager.getUserInfo().username;

        // Determine user type and styling
        let userClass = 'regular';
        if (message.isAdmin) {
            userClass = 'host';  // Admins appear as HOSTs in AOL
        }

        let adminActions = '';
        if (authManager.isAdmin() && !isCurrentUser) {
            adminActions = `
                <span class="message-actions">
                    <button class="message-delete-btn" onclick="window.chatManager.deleteMessage(${message.id})">Delete</button>
                </span>
            `;
        }

        // AOL-style message format: "Username: message content"
        messageElement.innerHTML = `
            <span class="aol-message-username ${userClass}">${Utils.escapeHtml(message.username)}:</span>
            <span class="aol-message-content">\t${Utils.escapeHtml(message.content)}</span>
            ${adminActions}
        `;

        messagesContainer.appendChild(messageElement);

        // Auto-scroll to bottom
        this.scrollToBottom(messagesContainer);

        // Limit messages
        const messages = messagesContainer.querySelectorAll('.aol-message');
        if (messages.length > CONFIG.UI.MAX_MESSAGES_DISPLAY) {
            messages[0].remove();
        }
    }

    addSystemMessage(roomId, message) {
        const messagesContainer = document.getElementById(`messages-${roomId}`);
        if (!messagesContainer) return;

        const messageElement = Utils.dom.create('div', {
            className: 'aol-message system'
        });

        // AOL system messages appear in green and are typically about user actions
        messageElement.innerHTML = `
            <span class="aol-message-content">${Utils.escapeHtml(message)}</span>
        `;

        messagesContainer.appendChild(messageElement);
        this.scrollToBottom(messagesContainer);
    }

    updateUserList(roomId, users) {
        const usersContainer = document.getElementById(`users-${roomId}`);
        const userCountElement = document.getElementById(`user-count-${roomId}`);

        if (!usersContainer) return;

        // Update user count
        if (userCountElement) {
            userCountElement.textContent = users.length;
        }

        usersContainer.innerHTML = '';

        const currentUsername = authManager.getUserInfo().username;

        // Sort users: HOSTs first, then regular users alphabetically
        const sortedUsers = users.sort((a, b) => {
            if (a.is_admin && !b.is_admin) return -1;
            if (!a.is_admin && b.is_admin) return 1;
            return a.username.localeCompare(b.username);
        });

        sortedUsers.forEach(user => {
            const userElement = Utils.dom.create('div', {
                className: `aol-user-item ${user.is_admin ? 'host' : ''} ${user.username === currentUsername ? 'self' : ''}`,
                'data-user-id': user.id
            });

            // Format username with HOST prefix for admins, like in real AOL
            let displayName = user.username;
            if (user.is_admin) {
                displayName = `HOST ${user.username}`;
            }

            userElement.innerHTML = Utils.escapeHtml(displayName);

            // Add right-click context menu for admins
            if (authManager.isAdmin() && user.username !== currentUsername) {
                userElement.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.showUserContextMenu(e, user);
                });
            }

            usersContainer.appendChild(userElement);
        });
    }

    showUserContextMenu(event, user) {
        this.hideContextMenu();

        this.contextMenu = Utils.dom.create('div', {
            className: 'user-context-menu'
        });

        this.contextMenu.innerHTML = `
            <div class="context-menu-item danger" data-action="ban">Ban User</div>
        `;

        this.contextMenu.style.position = 'fixed';
        this.contextMenu.style.left = event.clientX + 'px';
        this.contextMenu.style.top = event.clientY + 'px';

        this.contextMenu.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action === 'ban') {
                if (confirm(`Are you sure you want to ban ${user.username}?`)) {
                    window.chatManager.banUser(user.id);
                }
            }
            this.hideContextMenu();
        });

        document.body.appendChild(this.contextMenu);
    }

    hideContextMenu() {
        if (this.contextMenu) {
            this.contextMenu.remove();
            this.contextMenu = null;
        }
    }

    refreshChatWindow(roomId) {
        const messages = window.chatManager.messageHistory.get(roomId);
        if (!messages) return;

        const messagesContainer = document.getElementById(`messages-${roomId}`);
        if (!messagesContainer) return;

        messagesContainer.innerHTML = '';

        messages.forEach(message => {
            this.addMessageToWindow(roomId, message);
        });
    }

    markMessageDeleted(messageId) {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.classList.add('deleted');
        }
    }

    isWindowActive(roomId) {
        const window = this.activeWindows.get(roomId);
        return window && window === this.activeWindow;
    }

    closeChatWindow(roomId) {
        const window = this.activeWindows.get(roomId);
        if (window) {
            window.remove();
            this.activeWindows.delete(roomId);
            this.removeTaskbarItem(roomId);
        }

        // Leave the room
        if (window.chatManager && window.chatManager.currentRoom === roomId) {
            window.chatManager.leaveCurrentRoom();
        }
    }

    minimizeWindow(window) {
        window.classList.add('minimized');
    }

    bringWindowToFront(window) {
        window.style.zIndex = ++this.windowZIndex;
        this.activeWindow = window;

        // Update taskbar
        this.updateTaskbarItems(window);
    }

    makeDraggable(element) {
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };

        const header = element.querySelector('.window-header');

        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('.window-controls')) return;

            isDragging = true;
            dragOffset.x = e.clientX - element.offsetLeft;
            dragOffset.y = e.clientY - element.offsetTop;
            element.style.cursor = 'move';

            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const x = e.clientX - dragOffset.x;
            const y = e.clientY - dragOffset.y;

            element.style.left = Math.max(0, Math.min(x, window.innerWidth - element.offsetWidth)) + 'px';
            element.style.top = Math.max(0, Math.min(y, window.innerHeight - element.offsetHeight)) + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                element.style.cursor = 'default';
            }
        });
    }

    createTaskbar() {
        const taskbar = Utils.dom.create('div', {
            className: 'taskbar'
        });

        document.body.appendChild(taskbar);
    }

    addTaskbarItem(roomId, roomName, window) {
        const taskbar = document.querySelector('.taskbar');
        if (!taskbar) return;

        const item = Utils.dom.create('div', {
            className: 'taskbar-item',
            'data-room-id': roomId,
            textContent: roomName
        });

        item.addEventListener('click', () => {
            if (window.classList.contains('minimized')) {
                window.classList.remove('minimized');
            }
            this.bringWindowToFront(window);
        });

        taskbar.appendChild(item);
        this.taskbarItems.set(roomId, item);
    }

    removeTaskbarItem(roomId) {
        const item = this.taskbarItems.get(roomId);
        if (item) {
            item.remove();
            this.taskbarItems.delete(roomId);
        }
    }

    removeAllTaskbarItems() {
        this.taskbarItems.forEach(item => item.remove());
        this.taskbarItems.clear();
    }

    updateTaskbarItems(activeWindow) {
        this.taskbarItems.forEach((item, roomId) => {
            const window = this.activeWindows.get(roomId);
            if (window === activeWindow) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    scrollToBottom(element) {
        element.scrollTop = element.scrollHeight;
    }

    showLoading(message = 'Loading...') {
        const loading = document.getElementById('loading');
        if (loading) {
            const messageElement = loading.querySelector('p');
            if (messageElement) {
                messageElement.textContent = message;
            }
            loading.classList.add('active');
        }
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.remove('active');
        }
    }
}

// Create global instance
window.uiManager = new UIManager();