# 💾 AOL Chat Room - Nostalgic 90s Experience

A fully functional recreation of the classic AOL chat room experience from the late 90s, complete with authentic Windows 95 styling, real-time chat, and comprehensive user management features.

![AOL Chat Room](https://img.shields.io/badge/Nostalgia-Level%2090s-brightgreen)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

### 🎨 Authentic Experience
- **Windows 95 UI**: Pixel-perfect recreation with classic buttons, windows, and scrollbars
- **AOL Branding**: Nostalgic logos, colors, and styling from the golden era
- **Period Sounds**: Classic notification sounds (when implemented)
- **Retro Fonts**: MS Sans Serif and period-appropriate typography

### 💬 Chat Functionality
- **Multi-Room Support**: Browse and join different themed chat rooms
- **Real-time Messaging**: Instant chat using WebSocket technology
- **User Presence**: See who's online in each room
- **Message History**: Persistent chat history with scroll-back
- **Typing Indicators**: See when other users are typing

### 👥 User Management
- **Registration System**: Create accounts with username/password
- **Authentication**: Secure JWT-based login system
- **Admin System**: First registered user becomes admin automatically
- **User Profiles**: Basic profile management

### 🛡️ Admin Features
- **Message Moderation**: Delete inappropriate messages
- **User Banning**: Ban problematic users from the system
- **Room Override**: Admins can join full rooms
- **Real-time Actions**: All moderation happens instantly

### ⚙️ Technical Features
- **Room Size Limits**: Configurable maximum users per room
- **Rate Limiting**: Protection against spam and abuse
- **Docker Support**: Full containerized deployment
- **Environment Config**: Flexible configuration via environment variables
- **Health Checks**: Built-in monitoring endpoints
- **Auto-Reconnection**: Automatic reconnection on network issues

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)
```bash
# Clone the repository
git clone <your-repo-url>
cd aol_chat_room

# Run the setup script
./setup.sh

# Start with Docker
docker-compose up --build
```

### Option 2: Manual Setup
```bash
# Copy environment configuration
cp .env.example .env

# Edit configuration (optional)
nano .env

# Start with Docker
docker-compose up --build

# OR start manually
cd server && npm install && npm run dev &
cd client && npm install && npm run dev &
```

### Access the Application
- **Chat Interface**: http://localhost:3001
- **API Health Check**: http://localhost:3000/api/health

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `CLIENT_URL` | http://localhost:3001 | Client URL for CORS |
| `DB_PATH` | ./data/chat.db | SQLite database path |
| `JWT_SECRET` | *generated* | JWT signing secret |
| `JWT_EXPIRES_IN` | 24h | Token expiration time |
| `MAX_ROOM_SIZE` | 20 | Maximum users per room |
| `ENABLE_SIGNUP` | true | Allow new user registration |
| `SERVER_URL` | http://localhost:3000 | Server URL for client |

### Room Configuration
Default rooms are created automatically:
- **General Chat** (20 users max)
- **Tech Talk** (15 users max)
- **Music Lounge** (25 users max)
- **Gaming Corner** (30 users max)
- **Random** (10 users max)

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Docker (optional)

### Server Development
```bash
cd server
npm install
npm run dev  # Starts with nodemon for auto-reload
```

### Client Development
```bash
cd client
npm install
npm run dev  # Starts HTTP server on port 3001
```

### Project Structure
```
aol_chat_room/
├── server/                 # Backend API & Socket.io
│   ├── database/          # Database setup & models
│   ├── routes/            # Express routes
│   ├── sockets/           # Socket.io handlers
│   ├── middleware/        # Authentication middleware
│   └── Dockerfile
├── client/                # Frontend application
│   ├── js/               # JavaScript modules
│   ├── styles/           # CSS stylesheets
│   ├── assets/           # Images & static files
│   └── Dockerfile
├── docker-compose.yml    # Docker orchestration
├── .env.example         # Environment template
└── setup.sh            # Automated setup script
```

## 🎮 Usage

### For Users
1. **Sign Up**: Create a new account (first user becomes admin)
2. **Browse Rooms**: See available chat rooms and user counts
3. **Join Rooms**: Click on a room to join (if not full)
4. **Chat**: Type messages and see real-time conversations
5. **Navigate**: Use draggable windows like classic Windows 95

### For Admins
- **Delete Messages**: Right-click messages to delete
- **Ban Users**: Right-click usernames to ban
- **Join Full Rooms**: Override room size limits
- **Monitor Activity**: See all user actions in real-time

### Keyboard Shortcuts
- `Enter`: Send message in chat input
- `Ctrl/Cmd + Enter`: Send message (alternative)
- `Alt + 1-9`: Switch between chat windows
- `F5`: Refresh room list
- `Escape`: Close modals/menus

## 🐳 Docker Deployment

### Production Deployment
```bash
# Use production environment
cp .env.example .env
# Edit .env with production values

# Deploy
docker-compose up -d

# View logs
docker-compose logs -f
```

### Custom Domain Setup
1. Update `CLIENT_URL` and `SERVER_URL` in `.env`
2. Configure reverse proxy (nginx, traefik, etc.)
3. Set up SSL certificates
4. Restart containers

## 🧪 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - User login
- `POST /api/auth/validate` - Validate JWT token

### Rooms
- `GET /api/rooms` - List all chat rooms
- `GET /api/rooms/:id` - Get room details
- `POST /api/rooms/:id/join` - Join a room
- `POST /api/rooms/:id/leave` - Leave a room
- `GET /api/rooms/:id/messages` - Get room message history
- `GET /api/rooms/:id/users` - Get room user list

### System
- `GET /api/health` - Health check endpoint

## 🔒 Security Features

- **Input Sanitization**: All user inputs are sanitized
- **Rate Limiting**: Protection against spam and brute force
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt for secure password storage
- **CORS Protection**: Configured for specific origins
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: HTML escaping and CSP headers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Roadmap

- [ ] Voice chat rooms
- [ ] Private messaging
- [ ] File sharing
- [ ] Custom emojis
- [ ] Room themes
- [ ] Mobile responsive design
- [ ] User avatars
- [ ] Sound effects
- [ ] Chat bots

## 🐛 Troubleshooting

### Common Issues

**Connection Failed**
- Check if server is running on port 3000
- Verify `CLIENT_URL` and `SERVER_URL` in environment variables

**Can't Join Room**
- Room might be full (admins can override)
- Check if user is banned
- Verify authentication token

**Database Errors**
- Ensure `data/` directory exists and is writable
- Check SQLite file permissions
- Verify `DB_PATH` environment variable

### Getting Help
- Open an issue on GitHub
- Check the server logs: `docker-compose logs server`
- Enable debug mode in environment variables

## 🙏 Acknowledgments

- Inspired by classic AOL Chat Rooms (1995-2010)
- Windows 95 UI design principles
- The amazing community of 90s internet nostalgia

---

**Relive the magic of the 90s internet! Welcome back to AOL Chat Rooms!** 🌐✨