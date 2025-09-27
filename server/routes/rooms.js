const express = require('express');
const { getDb } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all categories
router.get('/categories', authenticateToken, (req, res) => {
  const db = getDb();

  const query = `
    SELECT * FROM categories
    ORDER BY sort_order, name
  `;

  db.all(query, [], (err, categories) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(categories);
  });
});

// Get rooms by category
router.get('/category/:categorySlug', authenticateToken, (req, res) => {
  const { categorySlug } = req.params;
  const db = getDb();

  const query = `
    SELECT
      r.*,
      c.name as category_name,
      c.slug as category_slug,
      COUNT(ur.user_id) as current_users,
      u.username as created_by_username
    FROM rooms r
    LEFT JOIN categories c ON r.category_id = c.id
    LEFT JOIN user_rooms ur ON r.id = ur.room_id
    LEFT JOIN users u ON r.created_by = u.id
    WHERE c.slug = ?
    GROUP BY r.id
    ORDER BY r.name
  `;

  db.all(query, [categorySlug], (err, rooms) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    const maxRoomSize = parseInt(process.env.MAX_ROOM_SIZE) || 20;

    const roomsWithAvailability = rooms.map(room => ({
      ...room,
      canJoin: room.current_users < (room.max_users || maxRoomSize) || req.user.isAdmin,
      isFull: room.current_users >= (room.max_users || maxRoomSize)
    }));

    res.json(roomsWithAvailability);
  });
});

router.get('/', authenticateToken, (req, res) => {
  const db = getDb();
  const { category, search } = req.query;

  let query = `
    SELECT
      r.*,
      c.name as category_name,
      c.slug as category_slug,
      COUNT(ur.user_id) as current_users,
      u.username as created_by_username
    FROM rooms r
    LEFT JOIN categories c ON r.category_id = c.id
    LEFT JOIN user_rooms ur ON r.id = ur.room_id
    LEFT JOIN users u ON r.created_by = u.id
  `;

  const params = [];

  if (category) {
    query += ' WHERE c.slug = ?';
    params.push(category);
  }

  if (search) {
    const searchCondition = category ? ' AND' : ' WHERE';
    query += `${searchCondition} (r.name LIKE ? OR r.description LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' GROUP BY r.id ORDER BY r.name';

  db.all(query, params, (err, rooms) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    const maxRoomSize = parseInt(process.env.MAX_ROOM_SIZE) || 20;

    const roomsWithAvailability = rooms.map(room => ({
      ...room,
      canJoin: room.current_users < (room.max_users || maxRoomSize) || req.user.isAdmin,
      isFull: room.current_users >= (room.max_users || maxRoomSize)
    }));

    res.json(roomsWithAvailability);
  });
});

router.get('/:roomId', authenticateToken, (req, res) => {
  const { roomId } = req.params;
  const db = getDb();

  const query = `
    SELECT
      r.*,
      COUNT(ur.user_id) as current_users,
      u.username as created_by_username
    FROM rooms r
    LEFT JOIN user_rooms ur ON r.id = ur.room_id
    LEFT JOIN users u ON r.created_by = u.id
    WHERE r.id = ?
    GROUP BY r.id
  `;

  db.get(query, [roomId], (err, room) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const maxRoomSize = parseInt(process.env.MAX_ROOM_SIZE) || 20;

    res.json({
      ...room,
      canJoin: room.current_users < (room.max_users || maxRoomSize) || req.user.isAdmin,
      isFull: room.current_users >= (room.max_users || maxRoomSize)
    });
  });
});

router.post('/:roomId/join', authenticateToken, (req, res) => {
  const { roomId } = req.params;
  const userId = req.user.userId;
  const db = getDb();

  db.get('SELECT * FROM rooms WHERE id = ?', [roomId], (err, room) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    db.get(
      'SELECT COUNT(*) as count FROM user_rooms WHERE room_id = ?',
      [roomId],
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        const maxRoomSize = parseInt(process.env.MAX_ROOM_SIZE) || 20;
        const roomMaxSize = room.max_users || maxRoomSize;

        if (result.count >= roomMaxSize && !req.user.isAdmin) {
          return res.status(403).json({ error: 'Room is full' });
        }

        db.run(
          'INSERT OR REPLACE INTO user_rooms (user_id, room_id, joined_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
          [userId, roomId],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Failed to join room' });
            }

            res.json({ message: 'Successfully joined room' });
          }
        );
      }
    );
  });
});

router.post('/:roomId/leave', authenticateToken, (req, res) => {
  const { roomId } = req.params;
  const userId = req.user.userId;
  const db = getDb();

  db.run(
    'DELETE FROM user_rooms WHERE user_id = ? AND room_id = ?',
    [userId, roomId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ message: 'Successfully left room' });
    }
  );
});

router.get('/:roomId/messages', authenticateToken, (req, res) => {
  const { roomId } = req.params;
  const { limit = 50, offset = 0 } = req.query;
  const db = getDb();

  const query = `
    SELECT
      m.*,
      u.username,
      deleted_by_user.username as deleted_by_username
    FROM messages m
    JOIN users u ON m.user_id = u.id
    LEFT JOIN users deleted_by_user ON m.deleted_by = deleted_by_user.id
    WHERE m.room_id = ? AND m.is_deleted = 0
    ORDER BY m.timestamp DESC
    LIMIT ? OFFSET ?
  `;

  db.all(query, [roomId, parseInt(limit), parseInt(offset)], (err, messages) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(messages.reverse());
  });
});

router.get('/:roomId/users', authenticateToken, (req, res) => {
  const { roomId } = req.params;
  const db = getDb();

  const query = `
    SELECT
      u.id,
      u.username,
      u.is_admin,
      ur.joined_at
    FROM users u
    JOIN user_rooms ur ON u.id = ur.user_id
    WHERE ur.room_id = ?
    ORDER BY u.username
  `;

  db.all(query, [roomId], (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(users);
  });
});

module.exports = router;