// Application Configuration
const CONFIG = {
    SERVER_URL: window.location.protocol + '//' + window.location.hostname + ':3000',
    SOCKET_OPTIONS: {
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        timeout: 20000,
        forceNew: false
    },
    UI: {
        MAX_MESSAGE_LENGTH: 500,
        MAX_MESSAGES_DISPLAY: 100,
        NOTIFICATION_DURATION: 5000,
        AUTO_SCROLL_THRESHOLD: 100,
        TYPING_INDICATOR_TIMEOUT: 3000
    },
    SOUNDS: {
        MESSAGE: 'assets/sounds/message.wav',
        JOIN: 'assets/sounds/join.wav',
        LEAVE: 'assets/sounds/leave.wav',
        ERROR: 'assets/sounds/error.wav',
        NOTIFICATION: 'assets/sounds/notification.wav'
    },
    STORAGE: {
        TOKEN_KEY: 'aol_chat_token',
        USERNAME_KEY: 'aol_chat_username',
        SETTINGS_KEY: 'aol_chat_settings',
        ROOM_HISTORY_KEY: 'aol_chat_room_history'
    },
    FEATURES: {
        SOUND_ENABLED: true,
        NOTIFICATIONS_ENABLED: true,
        AUTO_RECONNECT: true,
        REMEMBER_ROOMS: true,
        TYPING_INDICATORS: true
    }
};

// Environment-specific overrides
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    CONFIG.SERVER_URL = 'http://localhost:3000';
}

// Export for use in other modules
window.CONFIG = CONFIG;