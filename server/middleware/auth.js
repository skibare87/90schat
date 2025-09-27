const jwt = require('jsonwebtoken');
const { getDb } = require('../database/db');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'default-secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    const db = getDb();
    db.get(
      'SELECT * FROM users WHERE id = ?',
      [user.userId],
      (dbErr, dbUser) => {
        if (dbErr) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (!dbUser) {
          return res.status(403).json({ error: 'User not found' });
        }

        if (dbUser.is_banned) {
          return res.status(403).json({ error: 'User is banned' });
        }

        req.user = {
          userId: dbUser.id,
          username: dbUser.username,
          isAdmin: dbUser.is_admin,
          isBanned: dbUser.is_banned
        };

        next();
      }
    );
  });
};

const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin
};