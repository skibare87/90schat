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

## 🌐 Hosting a Public Server

### 🖥️ Server Setup (For Server Hosts)

If you want to host a server that others can connect to over the internet:

#### 1. **Server Requirements**
- VPS or dedicated server (DigitalOcean, AWS, etc.)
- Ubuntu 20.04+ or similar Linux distribution
- Docker and Docker Compose installed
- Domain name (optional but recommended)

#### 2. **Quick Server Deployment**
```bash
# On your server
git clone https://github.com/skibare87/90schat.git
cd 90schat

# Copy and configure environment
cp .env.example .env
nano .env
```

#### 3. **Configure Environment Variables**
Edit your `.env` file with your server's details:

```env
# Server Configuration
PORT=3000
CLIENT_URL=https://yourchatserver.com:3001    # Your domain/IP
SERVER_URL=https://yourchatserver.com:3000    # Your domain/IP

# Database
DB_PATH=./data/chat.db

# Security (IMPORTANT: Change these!)
JWT_SECRET=your-very-long-random-secret-string-change-this
ENABLE_SIGNUP=true

# Chat Configuration
MAX_ROOM_SIZE=30
```

#### 4. **Deploy the Server**
```bash
# Start the server
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f
```

#### 5. **Configure Firewall**
```bash
# Open required ports
sudo ufw allow 22      # SSH
sudo ufw allow 3000    # Server API
sudo ufw allow 3001    # Client
sudo ufw enable
```

#### 6. **Setup Domain/DNS (Recommended)**
Point your domain's A records to your server IP:
```
chat.yourdomain.com    A    YOUR_SERVER_IP
```

#### 7. **SSL Setup (Production)**
```bash
# Install Certbot for Let's Encrypt
sudo apt update
sudo apt install certbot

# Get SSL certificates
sudo certbot certonly --standalone -d chat.yourdomain.com
```

### 👥 Client Connection (For Users)

Users connecting to your hosted server need to know your server details:

#### **Method 1: Direct IP Access**
If you don't have a domain, users can access via IP:
- **Server**: `http://YOUR_SERVER_IP:3000`
- **Chat Interface**: `http://YOUR_SERVER_IP:3001`

#### **Method 2: Domain Access (Recommended)**
If you set up a domain:
- **Chat Interface**: `https://chat.yourdomain.com:3001`

#### **User Instructions for Your Server**
Share these instructions with your users:

```markdown
## 🚀 Join Our 90s Chat Server!

**Server**: chat.yourdomain.com
**Access**: https://chat.yourdomain.com:3001

### How to Connect:
1. Open your web browser
2. Go to: https://chat.yourdomain.com:3001
3. Create account (or login if you have one)
4. Browse rooms and start chatting!

### First Time Setup:
- Click "New Member" to create an account
- Choose a unique username (3-20 characters)
- Password must be at least 6 characters
- The first person to register becomes admin!
```

### 🔧 Advanced Client Configuration

#### **Running Your Own Client Against Remote Server**
If users want to run their own client locally but connect to your remote server:

1. **Clone the repository:**
```bash
git clone https://github.com/skibare87/90schat.git
cd 90schat
```

2. **Configure for remote server:**
```bash
# Edit client configuration
nano client/js/config.js
```

3. **Update SERVER_URL in config.js:**
```javascript
const CONFIG = {
    SERVER_URL: 'https://your-chat-server.com:3000', // Change this line
    // ... rest of config
};
```

4. **Run local client:**
```bash
cd client
npm install
npm run dev
# Client runs on http://localhost:3001 but connects to remote server
```

#### **Environment-Based Client Configuration**
For easier deployment, you can also modify the client to read from environment variables:

**Create client/.env:**
```env
REACT_APP_SERVER_URL=https://your-chat-server.com:3000
```

**Update client/js/config.js:**
```javascript
const CONFIG = {
    SERVER_URL: process.env.REACT_APP_SERVER_URL || window.location.protocol + '//' + window.location.hostname + ':3000',
    // ... rest of config
};
```

## 🐳 Production Deployment Options

### Option 1: Simple Docker Deployment
```bash
# Basic production setup
cp .env.example .env
# Edit .env with your domain/IP

docker-compose up -d
```

### Option 2: Reverse Proxy Setup (Advanced)

For SSL and domain handling, use nginx as a reverse proxy:

#### **Create nginx config:**
```nginx
# /etc/nginx/sites-available/90schat
server {
    listen 80;
    server_name chat.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name chat.yourdomain.com;

    ssl_certificate /path/to/your/cert.pem;
    ssl_certificate_key /path/to/your/private.key;

    # Client (Frontend)
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API Server
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket Support
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### **Enable and restart nginx:**
```bash
sudo ln -s /etc/nginx/sites-available/90schat /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Option 3: Cloud Platform Deployment

#### **Deploy on DigitalOcean App Platform:**
1. Fork this repository
2. Create new App on DigitalOcean
3. Connect your GitHub repo
4. Configure environment variables
5. Deploy automatically

#### **Deploy on Railway:**
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

#### **Deploy on Heroku:**
```bash
heroku create your-90s-chat
heroku config:set JWT_SECRET=your-secret-key
git push heroku main
```

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

**Connection Failed (Local)**
- Check if server is running on port 3000
- Verify `CLIENT_URL` and `SERVER_URL` in environment variables

**Connection Failed (Hosted Server)**
- Check if firewall allows ports 3000 and 3001
- Verify domain DNS is pointing to correct server IP
- Test direct IP access: `http://YOUR_IP:3001`
- Check server logs: `docker-compose logs -f`

**CORS Errors**
- Ensure `CLIENT_URL` in server `.env` matches your client URL
- For IP access: `CLIENT_URL=http://YOUR_SERVER_IP:3001`
- For domain: `CLIENT_URL=https://chat.yourdomain.com:3001`

**SSL/HTTPS Issues**
- Verify SSL certificates are installed correctly
- Check nginx proxy configuration
- Test HTTP version first: `http://yourdomain.com:3001`

**Can't Join Room**
- Room might be full (admins can override)
- Check if user is banned
- Verify authentication token
- Server may need restart: `docker-compose restart`

**Database Errors**
- Ensure `data/` directory exists and is writable
- Check SQLite file permissions: `chmod 755 data/`
- Verify `DB_PATH` environment variable
- Database corruption: backup and recreate

**WebSocket Connection Issues**
- Check proxy configuration for `/socket.io/` path
- Verify WebSocket headers in nginx config
- Test with: `curl -I http://yourserver:3000/socket.io/`

**Performance Issues**
- Monitor server resources: `htop`, `docker stats`
- Check database size: `ls -lh data/`
- Consider upgrading server if >100 concurrent users

### Getting Help
- Open an issue on GitHub: https://github.com/skibare87/90schat/issues
- Include server logs: `docker-compose logs server`
- Include browser console errors (F12)
- Specify your deployment method (Docker, cloud platform, etc.)

### Debug Commands
```bash
# Check server status
docker-compose ps

# View real-time logs
docker-compose logs -f

# Test API endpoints
curl http://your-server:3000/api/health

# Check port accessibility
telnet your-server-ip 3000
telnet your-server-ip 3001

# Test WebSocket connection
curl -I http://your-server:3000/socket.io/
```

## 🙏 Acknowledgments

- Inspired by classic AOL Chat Rooms (1995-2010)
- Windows 95 UI design principles
- The amazing community of 90s internet nostalgia

---

**Relive the magic of the 90s internet! Welcome back to AOL Chat Rooms!** 🌐✨