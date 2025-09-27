const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { getDb } = require('../database/db');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { error: 'Too many login attempts, please try again later' }
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 signups per hour per IP
  message: { error: 'Too many signup attempts, please try again later' }
});

router.post('/signup', signupLimiter, async (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  if (process.env.ENABLE_SIGNUP !== 'true') {
    return res.status(403).json({ error: 'User registration is currently disabled' });
  }

  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({ error: 'Username must be between 3 and 20 characters' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const db = getDb();

  try {
    db.get('SELECT COUNT(*) as count FROM users', [], (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const isFirstUser = row.count === 0;
      const hashedPassword = bcrypt.hashSync(password, 10);

      db.run(
        'INSERT INTO users (username, password, email, is_admin) VALUES (?, ?, ?, ?)',
        [username, hashedPassword, email || null, isFirstUser ? 1 : 0],
        function(err) {
          if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
              return res.status(409).json({ error: 'Username already exists' });
            }
            return res.status(500).json({ error: 'Failed to create user' });
          }

          const token = jwt.sign(
            {
              userId: this.lastID,
              username,
              isAdmin: isFirstUser
            },
            process.env.JWT_SECRET || 'default-secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
          );

          res.status(201).json({
            message: isFirstUser ? 'Account created successfully! You are now the admin.' : 'Account created successfully!',
            token,
            user: {
              id: this.lastID,
              username,
              email: email || null,
              isAdmin: isFirstUser,
              isBanned: false
            }
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const db = getDb();

  try {
    db.get(
      'SELECT * FROM users WHERE username = ?',
      [username],
      (err, user) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (!user || !bcrypt.compareSync(password, user.password)) {
          return res.status(401).json({ error: 'Invalid username or password' });
        }

        if (user.is_banned) {
          return res.status(403).json({ error: 'Your account has been banned' });
        }

        db.run(
          'UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = ?',
          [user.id]
        );

        const token = jwt.sign(
          {
            userId: user.id,
            username: user.username,
            isAdmin: user.is_admin
          },
          process.env.JWT_SECRET || 'default-secret',
          { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        res.json({
          message: 'Login successful',
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            isAdmin: user.is_admin,
            isBanned: user.is_banned
          }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/validate', (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');

    const db = getDb();
    db.get(
      'SELECT * FROM users WHERE id = ?',
      [decoded.userId],
      (err, user) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
          return res.status(401).json({ error: 'User not found' });
        }

        if (user.is_banned) {
          return res.status(403).json({ error: 'Account is banned' });
        }

        res.json({
          valid: true,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            isAdmin: user.is_admin,
            isBanned: user.is_banned
          }
        });
      }
    );
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;