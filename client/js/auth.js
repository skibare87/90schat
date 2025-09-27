// Authentication Manager
class AuthManager {
    constructor() {
        this.token = null;
        this.user = null;
        this.isAuthenticated = false;
    }

    async login(username, password) {
        try {
            const response = await fetch(`${CONFIG.SERVER_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            this.token = data.token;
            this.user = data.user;
            this.isAuthenticated = true;

            // Store credentials
            Utils.storage.set(CONFIG.STORAGE.TOKEN_KEY, this.token);
            Utils.storage.set(CONFIG.STORAGE.USERNAME_KEY, username);

            return {
                success: true,
                user: this.user,
                message: data.message
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async signup(username, password, email = null) {
        try {
            // Validate input
            const usernameValidation = Utils.validateUsername(username);
            if (!usernameValidation.valid) {
                throw new Error(usernameValidation.error);
            }

            const passwordValidation = Utils.validatePassword(password);
            if (!passwordValidation.valid) {
                throw new Error(passwordValidation.error);
            }

            const response = await fetch(`${CONFIG.SERVER_URL}/api/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password, email })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Signup failed');
            }

            this.token = data.token;
            this.user = data.user;
            this.isAuthenticated = true;

            // Store credentials
            Utils.storage.set(CONFIG.STORAGE.TOKEN_KEY, this.token);
            Utils.storage.set(CONFIG.STORAGE.USERNAME_KEY, username);

            return {
                success: true,
                user: this.user,
                message: data.message
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async validateToken() {
        const storedToken = Utils.storage.get(CONFIG.STORAGE.TOKEN_KEY);

        if (!storedToken) {
            return { success: false, error: 'No token found' };
        }

        try {
            const response = await fetch(`${CONFIG.SERVER_URL}/api/auth/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: storedToken })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Token validation failed');
            }

            this.token = storedToken;
            this.user = data.user;
            this.isAuthenticated = true;

            return {
                success: true,
                user: this.user
            };

        } catch (error) {
            // Clear invalid token
            this.logout();
            return {
                success: false,
                error: error.message
            };
        }
    }

    logout() {
        this.token = null;
        this.user = null;
        this.isAuthenticated = false;

        // Clear stored credentials
        Utils.storage.remove(CONFIG.STORAGE.TOKEN_KEY);
        Utils.storage.remove(CONFIG.STORAGE.USERNAME_KEY);

        // Clear other user-specific data
        Utils.storage.remove(CONFIG.STORAGE.ROOM_HISTORY_KEY);
    }

    getAuthHeaders() {
        if (!this.token) {
            return {};
        }

        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }

    async makeAuthenticatedRequest(url, options = {}) {
        const headers = {
            ...this.getAuthHeaders(),
            ...options.headers
        };

        const response = await fetch(url, {
            ...options,
            headers
        });

        // Handle authentication errors
        if (response.status === 401 || response.status === 403) {
            const data = await response.json();
            if (data.error && (data.error.includes('token') || data.error.includes('banned'))) {
                this.logout();
                window.location.reload();
            }
        }

        return response;
    }

    isAdmin() {
        return this.user && this.user.isAdmin;
    }

    getUserInfo() {
        return this.user;
    }

    getToken() {
        return this.token;
    }

    // Auto-login with stored credentials
    async autoLogin() {
        const storedUsername = Utils.storage.get(CONFIG.STORAGE.USERNAME_KEY);

        if (!storedUsername) {
            return { success: false, error: 'No stored credentials' };
        }

        return await this.validateToken();
    }
}

// Create global instance
window.authManager = new AuthManager();