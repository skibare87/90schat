// AOL-specific functionality manager
class AOLManager {
    constructor() {
        this.categories = [];
        this.currentCategory = 'a-place-to-start';
        this.currentTab = 'people-connection';
        this.rooms = [];
        this.searchQuery = '';
    }

    async initialize() {
        await this.loadCategories();
        this.populateCategories();
        this.setupEventListeners();
        await this.loadRooms();
    }

    setupEventListeners() {
        // Category selection
        const categoryList = document.getElementById('category-list');
        if (categoryList) {
            categoryList.addEventListener('click', (e) => {
                const categoryItem = e.target.closest('.category-item');
                if (categoryItem) {
                    this.selectCategory(categoryItem.dataset.slug);
                }
            });
        }

        // Category dropdown
        const categoryDropdown = document.getElementById('category-dropdown');
        if (categoryDropdown) {
            categoryDropdown.addEventListener('change', (e) => {
                this.selectCategory(e.target.value);
            });
        }

        // Tab switching
        const tabHeaders = document.querySelectorAll('.tab-header');
        tabHeaders.forEach(header => {
            header.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Search functionality
        const searchBtn = document.getElementById('search-btn');
        const searchInput = document.getElementById('room-search');

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.performSearch();
            });
        }

        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
        }

        // Action buttons
        const goChatBtn = document.getElementById('go-chat-btn');
        const whosChatting = document.getElementById('whos-chatting-btn');
        const moreBtn = document.getElementById('more-btn');

        if (goChatBtn) {
            goChatBtn.addEventListener('click', () => this.handleGoChat());
        }

        if (whosChatting) {
            whosChatting.addEventListener('click', () => this.handleWhosChatting());
        }

        if (moreBtn) {
            moreBtn.addEventListener('click', () => this.handleMore());
        }

        // Room selection and double-click
        const roomList = document.getElementById('room-list');
        if (roomList) {
            // Single click for selection
            roomList.addEventListener('click', (e) => {
                const roomItem = e.target.closest('.authentic-room-item');
                if (roomItem && !roomItem.classList.contains('disabled')) {
                    this.selectRoom(roomItem);
                }
            });

            // Double-click to join
            roomList.addEventListener('dblclick', (e) => {
                const roomItem = e.target.closest('.authentic-room-item');
                if (roomItem && !roomItem.classList.contains('disabled')) {
                    const roomId = parseInt(roomItem.dataset.roomId);
                    const roomName = roomItem.querySelector('.room-item-name').textContent;
                    this.joinRoom(roomId, roomName);
                }
            });
        }
    }

    async loadCategories() {
        try {
            const response = await authManager.makeAuthenticatedRequest(
                `${CONFIG.SERVER_URL}/api/rooms/categories`
            );

            if (response.ok) {
                this.categories = await response.json();
            } else {
                console.error('Failed to load categories');
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    populateCategories() {
        const categoryList = document.getElementById('category-list');
        const categoryDropdown = document.getElementById('category-dropdown');

        if (!categoryList || !categoryDropdown) return;

        // Clear existing content
        categoryList.innerHTML = '';
        categoryDropdown.innerHTML = '';

        // Populate both list and dropdown
        this.categories.forEach(category => {
            // Create list item
            const listItem = Utils.dom.create('div', {
                className: `category-item ${category.slug === this.currentCategory ? 'selected' : ''}`,
                'data-slug': category.slug,
                textContent: category.name
            });
            categoryList.appendChild(listItem);

            // Create dropdown option
            const option = Utils.dom.create('option', {
                value: category.slug,
                textContent: category.name
            });
            if (category.slug === this.currentCategory) {
                option.selected = true;
            }
            categoryDropdown.appendChild(option);
        });
    }

    selectCategory(categorySlug) {
        if (this.currentCategory === categorySlug) return;

        this.currentCategory = categorySlug;

        // Update visual selection
        document.querySelectorAll('.category-item').forEach(item => {
            item.classList.toggle('selected', item.dataset.slug === categorySlug);
        });

        // Update dropdown
        const dropdown = document.getElementById('category-dropdown');
        if (dropdown) {
            dropdown.value = categorySlug;
        }

        // Update room category name
        const categoryName = this.categories.find(c => c.slug === categorySlug)?.name;
        const roomCategoryName = document.querySelector('.room-category-name');
        if (roomCategoryName && categoryName) {
            roomCategoryName.textContent = `Rooms in "${categoryName}"`;
        }

        // Load rooms for this category
        this.loadRooms();
    }

    switchTab(tabName) {
        if (this.currentTab === tabName) return;

        this.currentTab = tabName;

        // Update tab headers
        document.querySelectorAll('.tab-header').forEach(header => {
            header.classList.toggle('active', header.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.toggle('active', pane.id === `${tabName}-tab`);
        });

        // Load appropriate rooms
        this.loadRooms();
    }

    async loadRooms() {
        try {
            let url = `${CONFIG.SERVER_URL}/api/rooms`;
            const params = new URLSearchParams();

            // Add category filter for people-connection tab
            if (this.currentTab === 'people-connection') {
                params.append('category', this.currentCategory);
            }

            // Add search filter if present
            if (this.searchQuery) {
                params.append('search', this.searchQuery);
            }

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await authManager.makeAuthenticatedRequest(url);

            if (response.ok) {
                this.rooms = await response.json();
                this.displayRooms();
            } else {
                console.error('Failed to load rooms');
            }
        } catch (error) {
            console.error('Error loading rooms:', error);
        }
    }

    displayRooms() {
        const roomList = document.getElementById('room-list');
        if (!roomList) return;

        roomList.innerHTML = '';

        if (this.currentTab === 'aol-members') {
            // Show AOL official rooms (placeholder for now)
            const placeholder = Utils.dom.create('div', {
                className: 'aol-rooms-placeholder',
                innerHTML: `
                    <p style="text-align: center; padding: 20px; font-style: italic;">
                        AOL Member-created rooms will be available in a future update.
                        <br><br>
                        For now, enjoy our curated selection of rooms in the
                        "Created by People Connection" tab!
                    </p>
                `
            });
            roomList.appendChild(placeholder);
            return;
        }

        // Display rooms for people-connection tab
        this.rooms.forEach((room, index) => {
            const roomItem = Utils.dom.create('div', {
                className: `authentic-room-item ${room.isFull && !authManager.isAdmin() ? 'disabled' : ''}`,
                'data-room-id': room.id
            });

            const userCountClass = room.isFull ? 'full' : '';

            roomItem.innerHTML = `
                <div class="room-item-number">${index + 1}</div>
                <div class="room-item-content">
                    <div class="room-item-name">${Utils.escapeHtml(room.name)}</div>
                    <div class="room-item-description">${Utils.escapeHtml(room.description || '')}</div>
                </div>
                <div class="room-item-users ${userCountClass}">${room.current_users}</div>
            `;

            roomList.appendChild(roomItem);
        });

        // Show message if no rooms found
        if (this.rooms.length === 0) {
            const noRooms = Utils.dom.create('div', {
                className: 'no-rooms-message',
                innerHTML: `
                    <p style="text-align: center; padding: 20px; font-style: italic;">
                        No rooms found in this category.
                        ${this.searchQuery ? 'Try a different search term.' : 'Try selecting a different category.'}
                    </p>
                `
            });
            roomList.appendChild(noRooms);
        }
    }

    performSearch() {
        const searchInput = document.getElementById('room-search');
        if (!searchInput) return;

        this.searchQuery = searchInput.value.trim();
        this.loadRooms();

        // Update display to show we're searching
        if (this.searchQuery) {
            const roomCategoryName = document.querySelector('.room-category-name');
            if (roomCategoryName) {
                roomCategoryName.textContent = `Search Results for "${this.searchQuery}"`;
            }
        } else {
            // Reset to category name
            const categoryName = this.categories.find(c => c.slug === this.currentCategory)?.name;
            const roomCategoryName = document.querySelector('.room-category-name');
            if (roomCategoryName && categoryName) {
                roomCategoryName.textContent = `Rooms in "${categoryName}"`;
            }
        }
    }

    clearSearch() {
        const searchInput = document.getElementById('room-search');
        if (searchInput) {
            searchInput.value = '';
        }
        this.searchQuery = '';
        this.loadRooms();
    }

    async joinRoom(roomId, roomName) {
        try {
            await window.chatManager.joinRoom(roomId);
            Utils.showNotification('Joined Room', `Entered ${roomName}`, 'sound');
        } catch (error) {
            Utils.showError(error.message);
        }
    }

    handleGoChat() {
        const selectedRoom = document.querySelector('.authentic-room-item.selected');
        if (!selectedRoom) {
            Utils.showError('Please select a room first by clicking on it.');
            return;
        }

        const roomId = parseInt(selectedRoom.dataset.roomId);
        const roomName = selectedRoom.querySelector('.room-item-name').textContent;
        this.joinRoom(roomId, roomName);
    }

    handleWhosChatting() {
        // Show user counts for all rooms
        Utils.showNotification('Room Activity', 'User counts are displayed next to each room name.', 'info');
    }

    handleMore() {
        // Show additional options (placeholder)
        Utils.showNotification('More Options', 'Additional room options coming soon!', 'info');
    }

    // Method to update room list when rooms change
    updateRoomList(rooms) {
        this.rooms = rooms;
        this.displayRooms();
    }

    // Method to get current room selection
    getCurrentSelection() {
        return {
            category: this.currentCategory,
            tab: this.currentTab,
            search: this.searchQuery
        };
    }

    // Method to refresh current view
    selectRoom(roomItem) {
        // Remove selection from all rooms
        document.querySelectorAll('.authentic-room-item').forEach(item => {
            item.classList.remove('selected');
        });

        // Select the clicked room
        roomItem.classList.add('selected');
    }

    async refresh() {
        await this.loadCategories();
        this.populateCategories();
        await this.loadRooms();
    }
}

// Create global instance
window.aolManager = new AOLManager();