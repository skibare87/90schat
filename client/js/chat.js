// Chat Manager
class ChatManager {
    constructor() {
        this.socket = null;
        this.currentRoom = null;
        this.rooms = new Map();
        this.activeWindows = new Map();
        this.messageHistory = new Map();
        this.userLists = new Map();
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    async connect() {
        if (!authManager.isAuthenticated) {
            throw new Error('Must be authenticated to connect');
        }

        try {
            this.socket = io(CONFIG.SERVER_URL, {
                ...CONFIG.SOCKET_OPTIONS,
                auth: {
                    token: authManager.getToken()
                }
            });

            this.setupSocketListeners();

            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Connection timeout'));
                }, CONFIG.SOCKET_OPTIONS.timeout);

                this.socket.on('connect', () => {
                    clearTimeout(timeout);
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    this.updateConnectionStatus('online');
                    resolve();
                });

                this.socket.on('connect_error', (error) => {
                    clearTimeout(timeout);
                    reject(error);
                });
            });

        } catch (error) {
            throw new Error(`Failed to connect: ${error.message}`);
        }
    }

    setupSocketListeners() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.updateConnectionStatus('online');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.isConnected = false;
            this.updateConnectionStatus('offline');

            if (CONFIG.FEATURES.AUTO_RECONNECT) {
                this.attemptReconnect();
            }
        });

        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            this.updateConnectionStatus('offline');
            Utils.showError(`Connection error: ${error.message}`);
        });

        this.socket.on('error', (data) => {
            Utils.showError(data.message || 'An error occurred');
        });

        // Room events
        this.socket.on('joined_room', (data) => {
            this.currentRoom = data.roomId;
            this.onJoinedRoom(data);
        });

        this.socket.on('user_joined', (data) => {
            this.onUserJoined(data);
        });

        this.socket.on('user_left', (data) => {
            this.onUserLeft(data);
        });

        this.socket.on('room_users', (users) => {
            this.onRoomUsersUpdate(users);
        });

        // Message events
        this.socket.on('new_message', (data) => {
            this.onNewMessage(data);
        });

        this.socket.on('message_deleted', (data) => {
            this.onMessageDeleted(data);
        });

        // Admin events
        this.socket.on('user_banned', (data) => {
            this.onUserBanned(data);
        });

        this.socket.on('banned', (data) => {
            Utils.showError(data.message);
            setTimeout(() => {
                authManager.logout();
                window.location.reload();
            }, 3000);
        });
    }

    async loadRooms() {
        try {
            const response = await authManager.makeAuthenticatedRequest(
                `${CONFIG.SERVER_URL}/api/rooms`
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to load rooms');
            }

            const rooms = await response.json();
            this.rooms.clear();

            rooms.forEach(room => {
                this.rooms.set(room.id, room);
            });

            this.updateRoomList();
            return rooms;

        } catch (error) {
            Utils.showError(`Failed to load rooms: ${error.message}`);
            throw error;
        }
    }

    async joinRoom(roomId) {
        if (!this.socket || !this.isConnected) {
            throw new Error('Not connected to server');
        }

        const room = this.rooms.get(roomId);
        if (!room) {
            throw new Error('Room not found');
        }

        if (!room.canJoin) {
            throw new Error('Room is full');
        }

        try {
            // Join room via API first
            const response = await authManager.makeAuthenticatedRequest(
                `${CONFIG.SERVER_URL}/api/rooms/${roomId}/join`,
                { method: 'POST' }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to join room');
            }

            // Then join via socket
            this.socket.emit('join_room', { roomId });

        } catch (error) {
            Utils.showError(`Failed to join room: ${error.message}`);
            throw error;
        }
    }

    leaveCurrentRoom() {
        if (this.socket && this.currentRoom) {
            this.socket.emit('leave_room');
            this.currentRoom = null;
        }
    }

    sendMessage(message) {
        if (!this.socket || !this.isConnected) {
            Utils.showError('Not connected to server');
            return false;
        }

        if (!this.currentRoom) {
            Utils.showError('You must join a room first');
            return false;
        }

        const sanitizedMessage = Utils.sanitizeMessage(message);
        if (!sanitizedMessage) {
            Utils.showError('Message cannot be empty');
            return false;
        }

        if (sanitizedMessage.length > CONFIG.UI.MAX_MESSAGE_LENGTH) {
            Utils.showError(`Message too long (max ${CONFIG.UI.MAX_MESSAGE_LENGTH} characters)`);
            return false;
        }

        this.socket.emit('send_message', { message: sanitizedMessage });
        return true;
    }

    deleteMessage(messageId) {
        if (!authManager.isAdmin()) {
            Utils.showError('Admin privileges required');
            return;
        }

        if (this.socket && this.isConnected) {
            this.socket.emit('delete_message', { messageId });
        }
    }

    banUser(userId) {
        if (!authManager.isAdmin()) {
            Utils.showError('Admin privileges required');
            return;
        }

        if (this.socket && this.isConnected) {
            this.socket.emit('ban_user', { userId });
        }
    }

    // Event handlers
    onJoinedRoom(data) {
        console.log(`Joined room: ${data.roomName}`);

        // Create or show chat window
        this.createChatWindow(data.roomId, data.roomName);

        // Load message history
        this.loadMessageHistory(data.roomId);

        Utils.playSound('JOIN');
        Utils.showNotification('Joined Room', `Welcome to ${data.roomName}!`, 'sound');
    }

    onUserJoined(data) {
        console.log(`User joined: ${data.username}`);

        // Add system message
        this.addSystemMessage(this.currentRoom, `${data.username} has entered the room`);

        // Update user list will happen via room_users event
        Utils.playSound('JOIN');
    }

    onUserLeft(data) {
        console.log(`User left: ${data.username}`);

        // Add system message
        this.addSystemMessage(this.currentRoom, `${data.username} has left the room`);

        // Update user list will happen via room_users event
        Utils.playSound('LEAVE');
    }

    onRoomUsersUpdate(users) {
        if (this.currentRoom) {
            this.userLists.set(this.currentRoom, users);
            this.updateUserList(this.currentRoom, users);
        }
    }

    onNewMessage(data) {
        console.log('New message:', data);

        // Add message to history
        if (!this.messageHistory.has(data.roomId)) {
            this.messageHistory.set(data.roomId, []);
        }

        const messages = this.messageHistory.get(data.roomId);
        messages.push(data);

        // Keep only recent messages
        if (messages.length > CONFIG.UI.MAX_MESSAGES_DISPLAY) {
            messages.splice(0, messages.length - CONFIG.UI.MAX_MESSAGES_DISPLAY);
        }

        // Update UI
        this.addMessageToWindow(data.roomId, data);

        // Play sound if not from current user
        if (data.username !== authManager.getUserInfo().username) {
            Utils.playSound('MESSAGE');
        }

        // Show notification if window not active
        if (!this.isWindowActive(data.roomId) && data.username !== authManager.getUserInfo().username) {
            Utils.showNotification(
                `${data.username} in ${this.rooms.get(data.roomId)?.name}`,
                data.content,
                'private'
            );
        }
    }

    onMessageDeleted(data) {
        this.markMessageDeleted(data.messageId);

        if (data.deletedBy !== authManager.getUserInfo().username) {
            Utils.showNotification(
                'Message Deleted',
                `A message was deleted by ${data.deletedBy}`,
                'info'
            );
        }
    }

    onUserBanned(data) {
        Utils.showNotification(
            'User Banned',
            `${data.userId} was banned by ${data.bannedBy}`,
            'info'
        );
    }

    async loadMessageHistory(roomId) {
        try {
            const response = await authManager.makeAuthenticatedRequest(
                `${CONFIG.SERVER_URL}/api/rooms/${roomId}/messages?limit=50`
            );

            if (!response.ok) return;

            const messages = await response.json();
            this.messageHistory.set(roomId, messages);

            // Update chat window
            this.refreshChatWindow(roomId);

        } catch (error) {
            console.error('Failed to load message history:', error);
        }
    }

    // UI Management methods will be implemented in ui.js
    createChatWindow(roomId, roomName) {
        // This will be implemented in ui.js
        if (window.uiManager) {
            window.uiManager.createChatWindow(roomId, roomName);
        }
    }

    addMessageToWindow(roomId, message) {
        if (window.uiManager) {
            window.uiManager.addMessageToWindow(roomId, message);
        }
    }

    addSystemMessage(roomId, message) {
        if (window.uiManager) {
            window.uiManager.addSystemMessage(roomId, message);
        }
    }

    updateUserList(roomId, users) {
        if (window.uiManager) {
            window.uiManager.updateUserList(roomId, users);
        }
    }

    updateRoomList() {
        if (window.uiManager) {
            window.uiManager.updateRoomList(Array.from(this.rooms.values()));
        }
    }

    refreshChatWindow(roomId) {
        if (window.uiManager) {
            window.uiManager.refreshChatWindow(roomId);
        }
    }

    isWindowActive(roomId) {
        return window.uiManager ? window.uiManager.isWindowActive(roomId) : false;
    }

    markMessageDeleted(messageId) {
        if (window.uiManager) {
            window.uiManager.markMessageDeleted(messageId);
        }
    }

    updateConnectionStatus(status) {
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            statusElement.textContent = status === 'online' ? 'Online' : 'Offline';
            statusElement.className = `connection-status ${status}`;
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            Utils.showError('Failed to reconnect. Please refresh the page.');
            return;
        }

        this.reconnectAttempts++;
        this.updateConnectionStatus('connecting');

        setTimeout(() => {
            if (!this.isConnected) {
                console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
                this.connect().catch(() => {
                    this.attemptReconnect();
                });
            }
        }, 2000 * this.reconnectAttempts);
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.isConnected = false;
        this.currentRoom = null;
        this.updateConnectionStatus('offline');
    }
}

// Create global instance
window.chatManager = new ChatManager();