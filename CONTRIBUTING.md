# Contributing to 90s Chat

Thanks for your interest in contributing to this nostalgic AOL chat room recreation! This project aims to preserve and recreate the authentic 1990s AOL chat experience.

## 🎯 Project Vision

Our goal is to create a pixel-perfect recreation of the AOL chat room experience from the late 1990s, including:
- Authentic Windows 95/AOL visual styling
- Original room names and categories
- Proper user designations (HOST, GUIDE)
- Classic AOL interface elements

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- Docker (optional but recommended)
- Git

### Quick Start
```bash
git clone https://github.com/skibare87/90schat.git
cd 90schat
./setup.sh
docker-compose up --build
```

### Manual Setup
```bash
# Server
cd server
npm install
npm run dev

# Client (in new terminal)
cd client
npm install
npm run dev
```

## 📁 Project Structure

```
90schat/
├── server/                 # Backend API & Socket.io
│   ├── database/          # Database setup & models
│   ├── routes/            # Express routes
│   ├── sockets/           # Socket.io handlers
│   └── middleware/        # Authentication middleware
├── client/                # Frontend application
│   ├── js/               # JavaScript modules
│   ├── styles/           # CSS stylesheets
│   └── assets/           # Images & static files
├── docker-compose.yml    # Docker orchestration
└── setup.sh            # Automated setup script
```

## 🎨 Design Guidelines

### Visual Authenticity
- **Colors**: Use the official AOL color palette (teal #008080, blue #0066cc, etc.)
- **Fonts**: MS Sans Serif for interface, system fonts for content
- **Styling**: Windows 95 inset/outset borders, proper button styling
- **Layout**: Match original AOL screenshots and interfaces

### User Experience
- **Room Names**: Use authentic AOL room names from the 1990s
- **Categories**: Maintain original AOL category structure
- **Messages**: Simple "USERNAME: message" format, no timestamps in chat
- **Users**: HOST/GUIDE prefixes for special users

## 📝 Coding Standards

### JavaScript
- Use ES6+ features
- Follow existing naming conventions
- Add comments for complex logic
- Handle errors gracefully

### CSS
- Use CSS custom properties for colors
- Follow BEM methodology where applicable
- Maintain Windows 95 aesthetic
- Keep styles modular and organized

### Database
- Use parameterized queries
- Maintain referential integrity
- Document schema changes

## 🧪 Testing

Currently, testing is manual. Future contributions for automated testing are welcome:

### Manual Testing Checklist
- [ ] User registration/login works
- [ ] Room browsing and joining
- [ ] Real-time messaging
- [ ] Admin moderation features
- [ ] Visual authenticity on different screen sizes

## 📋 Pull Request Process

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### PR Guidelines
- Include screenshots for UI changes
- Test your changes thoroughly
- Update documentation as needed
- Follow the existing code style
- Write clear commit messages

## 🐛 Bug Reports

When reporting bugs, please include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Browser/OS information
- Screenshots if UI-related

## 💡 Feature Requests

For new features, consider:
- Does it maintain 1990s authenticity?
- Is it something AOL actually had?
- Will it enhance the nostalgic experience?

## 📚 Resources

### AOL History & References
- [AOL Chat Room Archive](https://web.archive.org) - Historical screenshots
- [Windows 95 UI Guidelines](https://www.microsoft.com) - Interface standards
- [1990s Internet Culture](https://archive.org) - Cultural context

### Technical Documentation
- [Socket.io Documentation](https://socket.io/docs/)
- [Express.js Guide](https://expressjs.com/)
- [SQLite Documentation](https://sqlite.org/docs.html)

## 🙏 Recognition

Contributors will be recognized in the README. Major contributors may be added to the AUTHORS file.

## 📞 Getting Help

- Open an issue for bugs or questions
- Check existing issues before creating new ones
- Join discussions in pull requests

## 🎖️ Types of Contributions

We welcome:
- **Bug fixes** - Keep the experience smooth
- **Visual improvements** - Enhance authenticity
- **Performance optimizations** - Faster loading
- **Documentation** - Help others contribute
- **Historical accuracy** - Correct AOL details
- **Accessibility** - Make it usable for everyone

Remember: The goal is to recreate the magic of 1990s AOL chat rooms as authentically as possible! 🎯✨