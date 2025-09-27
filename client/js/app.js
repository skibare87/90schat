// Main Application Entry Point
class AOLChatApp {
    constructor() {
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            console.log('🚀 Initializing AOL Chat Application...');

            // Initialize UI Manager
            window.uiManager.initialize();

            // Check for stored credentials and auto-login
            await this.attemptAutoLogin();

            // Setup global error handlers
            this.setupErrorHandlers();

            // Setup keyboard shortcuts
            this.setupKeyboardShortcuts();

            // Mark as initialized
            this.initialized = true;

            console.log('✅ AOL Chat Application initialized successfully');

        } catch (error) {
            console.error('❌ Failed to initialize application:', error);
            Utils.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    async attemptAutoLogin() {
        const storedToken = Utils.storage.get(CONFIG.STORAGE.TOKEN_KEY);

        if (!storedToken) {
            console.log('No stored credentials found');
            return;
        }

        console.log('Attempting auto-login with stored credentials...');

        try {
            window.uiManager.showLoading('Reconnecting...');

            const result = await authManager.autoLogin();

            if (result.success) {
                console.log('✅ Auto-login successful');
                await window.uiManager.switchToChatScreen();
                Utils.showNotification('Welcome Back!', `Signed in as ${authManager.getUserInfo().username}`);
            } else {
                console.log('❌ Auto-login failed:', result.error);
                // Don't show error for auto-login failure, just stay on login screen
            }

        } catch (error) {
            console.warn('Auto-login error:', error.message);
            // Clear potentially corrupted credentials
            authManager.logout();
        } finally {
            window.uiManager.hideLoading();
        }
    }

    setupErrorHandlers() {
        // Global unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);

            // Don't show UI errors for certain types of rejections
            if (event.reason && typeof event.reason === 'string') {
                if (event.reason.includes('NetworkError') || event.reason.includes('fetch')) {
                    console.warn('Network error ignored:', event.reason);
                    return;
                }
            }

            Utils.showError('An unexpected error occurred. Please try again.');
            event.preventDefault();
        });

        // Global error handler
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);

            // Don't spam users with script errors
            if (event.error && event.error.stack && event.error.stack.includes('Script error')) {
                return;
            }

            Utils.showError('A system error occurred. Please refresh if problems persist.');
        });

        // Handle network connectivity changes
        window.addEventListener('online', () => {
            console.log('Network connection restored');
            Utils.showNotification('Network', 'Connection restored', 'sound');

            // Attempt to reconnect chat if we were connected before
            if (authManager.isAuthenticated && window.chatManager && !window.chatManager.isConnected) {
                window.chatManager.connect().catch(console.error);
            }
        });

        window.addEventListener('offline', () => {
            console.log('Network connection lost');
            Utils.showError('Network connection lost. Some features may not work.');
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Ctrl/Cmd + Enter to send message in focused chat input
            if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                const activeElement = document.activeElement;
                if (activeElement && activeElement.classList.contains('aol-chat-input')) {
                    window.uiManager.handleChatInput(activeElement);
                    event.preventDefault();
                }
            }

            // Escape to close modals/menus
            if (event.key === 'Escape') {
                // Close signup modal
                const signupModal = document.getElementById('signup-modal');
                if (signupModal && signupModal.classList.contains('active')) {
                    window.uiManager.hideSignupModal();
                    event.preventDefault();
                }

                // Close context menu
                window.uiManager.hideContextMenu();
            }

            // Alt + number to switch between chat windows (1-9)
            if (event.altKey && /^[1-9]$/.test(event.key)) {
                const windowIndex = parseInt(event.key) - 1;
                const windows = Array.from(window.uiManager.activeWindows.values());
                if (windows[windowIndex]) {
                    window.uiManager.bringWindowToFront(windows[windowIndex]);
                    const chatInput = windows[windowIndex].querySelector('.aol-chat-input');
                    if (chatInput) chatInput.focus();
                }
                event.preventDefault();
            }

            // F5 to refresh room list
            if (event.key === 'F5' && authManager.isAuthenticated) {
                if (window.chatManager) {
                    window.chatManager.loadRooms();
                }
                event.preventDefault();
            }
        });
    }

    // Public methods for external use
    getCurrentUser() {
        return authManager.getUserInfo();
    }

    isAuthenticated() {
        return authManager.isAuthenticated;
    }

    async refreshData() {
        if (!authManager.isAuthenticated) return;

        try {
            await window.chatManager.loadRooms();
            Utils.showNotification('Refreshed', 'Room list updated');
        } catch (error) {
            Utils.showError('Failed to refresh data');
        }
    }

    // Cleanup method for page unload
    cleanup() {
        console.log('🧹 Cleaning up AOL Chat Application...');

        if (window.chatManager) {
            window.chatManager.disconnect();
        }

        // Save any important state
        const settings = {
            lastActive: new Date().toISOString(),
            windowPositions: this.getWindowPositions()
        };

        Utils.storage.set(CONFIG.STORAGE.SETTINGS_KEY, settings);
    }

    getWindowPositions() {
        const positions = {};

        window.uiManager.activeWindows.forEach((windowElement, roomId) => {
            if (windowElement && !windowElement.classList.contains('minimized')) {
                positions[roomId] = {
                    left: windowElement.style.left,
                    top: windowElement.style.top,
                    width: windowElement.style.width,
                    height: windowElement.style.height
                };
            }
        });

        return positions;
    }

    // Development/debug helpers
    debug = {
        getState: () => ({
            initialized: this.initialized,
            authenticated: authManager.isAuthenticated,
            user: authManager.getUserInfo(),
            connected: window.chatManager?.isConnected,
            currentRoom: window.chatManager?.currentRoom,
            activeWindows: Array.from(window.uiManager?.activeWindows.keys() || [])
        }),

        clearStorage: () => {
            Object.values(CONFIG.STORAGE).forEach(key => {
                Utils.storage.remove(key);
            });
            console.log('Local storage cleared');
        },

        simulateError: (message) => {
            Utils.showError(message || 'Test error message');
        },

        simulateNotification: (title, message) => {
            Utils.showNotification(title || 'Test', message || 'Test notification');
        }
    };
}

// Create and initialize the application
const app = new AOLChatApp();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app.initialize().catch(console.error);
    });
} else {
    app.initialize().catch(console.error);
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    app.cleanup();
});

// Make app globally available
window.aolChatApp = app;

// Welcome message
console.log(`
   ___   ____  __      ________          __
  / _ | / __ \\/ /     / ____/ /_  ____ _/ /_
 / __ |/ /_/ / /     / /   / __ \\/ __ \`/ __/
/ /_/ / ____/ /___  / /___/ / / / /_/ / /_
\\____/_/   /_____/  \\____/_/ /_/\\__,_/\\__/

Welcome to AOL Chat Rooms - Relive the 90s!
Version 1.0.0 - Built with ❤️  and nostalgia
`);

// Development mode helpers
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🛠️  Development mode enabled');
    console.log('Available debug commands:');
    console.log('  aolChatApp.debug.getState() - Get current app state');
    console.log('  aolChatApp.debug.clearStorage() - Clear local storage');
    console.log('  aolChatApp.refreshData() - Refresh room data');

    // Make utilities available in dev mode
    window.devUtils = {
        auth: authManager,
        chat: () => window.chatManager,
        ui: () => window.uiManager,
        utils: Utils,
        config: CONFIG
    };
}