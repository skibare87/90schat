// Utility Functions
class Utils {
    static formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');

        // If it's today, just show time
        if (date.toDateString() === now.toDateString()) {
            return `${hours}:${minutes}`;
        }

        // If it's this year, show month/day and time
        if (date.getFullYear() === now.getFullYear()) {
            return `${date.getMonth() + 1}/${date.getDate()} ${hours}:${minutes}`;
        }

        // Otherwise, show full date
        return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} ${hours}:${minutes}`;
    }

    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    static sanitizeMessage(message) {
        // Remove or replace potentially harmful content
        return message
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .trim();
    }

    static playSound(soundName) {
        if (!CONFIG.FEATURES.SOUND_ENABLED) return;

        try {
            const audio = new Audio(CONFIG.SOUNDS[soundName.toUpperCase()]);
            audio.volume = 0.5;
            audio.play().catch(() => {
                // Ignore audio errors (user might not have interacted with page yet)
            });
        } catch (error) {
            console.warn('Could not play sound:', soundName);
        }
    }

    static showNotification(title, message, type = 'info') {
        if (!CONFIG.FEATURES.NOTIFICATIONS_ENABLED) return;

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-title">${this.escapeHtml(title)}</div>
            <div class="notification-message">${this.escapeHtml(message)}</div>
        `;

        document.body.appendChild(notification);

        // Auto-remove after timeout
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, CONFIG.UI.NOTIFICATION_DURATION);

        // Allow manual removal
        notification.addEventListener('click', () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });

        return notification;
    }

    static showError(message, duration = 5000) {
        const errorContainer = document.getElementById('error-messages');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;

        errorContainer.appendChild(errorDiv);

        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, duration);

        // Allow click to dismiss
        errorDiv.addEventListener('click', () => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        });
    }

    static generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    static storage = {
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.warn('Failed to get from localStorage:', key);
                return defaultValue;
            }
        },

        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.warn('Failed to set localStorage:', key);
                return false;
            }
        },

        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.warn('Failed to remove from localStorage:', key);
                return false;
            }
        }
    };

    static dom = {
        create(tag, attributes = {}, children = []) {
            const element = document.createElement(tag);

            Object.keys(attributes).forEach(key => {
                if (key === 'className') {
                    element.className = attributes[key];
                } else if (key === 'innerHTML') {
                    element.innerHTML = attributes[key];
                } else if (key === 'textContent') {
                    element.textContent = attributes[key];
                } else {
                    element.setAttribute(key, attributes[key]);
                }
            });

            children.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else if (child instanceof Node) {
                    element.appendChild(child);
                }
            });

            return element;
        },

        addClass(element, className) {
            if (element && className) {
                element.classList.add(className);
            }
        },

        removeClass(element, className) {
            if (element && className) {
                element.classList.remove(className);
            }
        },

        toggleClass(element, className) {
            if (element && className) {
                element.classList.toggle(className);
            }
        }
    };

    static getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString('en-US', {
            hour12: true,
            hour: 'numeric',
            minute: '2-digit'
        });
    }

    static updateClock() {
        const timeElement = document.getElementById('current-time');
        if (timeElement) {
            timeElement.textContent = this.getCurrentTime();
        }
    }

    static validateUsername(username) {
        if (!username || typeof username !== 'string') {
            return { valid: false, error: 'Username is required' };
        }

        if (username.length < 3) {
            return { valid: false, error: 'Username must be at least 3 characters' };
        }

        if (username.length > 20) {
            return { valid: false, error: 'Username must be less than 20 characters' };
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
        }

        return { valid: true };
    }

    static validatePassword(password) {
        if (!password || typeof password !== 'string') {
            return { valid: false, error: 'Password is required' };
        }

        if (password.length < 6) {
            return { valid: false, error: 'Password must be at least 6 characters' };
        }

        return { valid: true };
    }
}

// Make available globally
window.Utils = Utils;

// Start clock
setInterval(() => Utils.updateClock(), 1000);
Utils.updateClock();