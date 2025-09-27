const jwt = require('jsonwebtoken');
const { getDb } = require('../database/db');

const authenticateSocket = (socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication token required'));
  }

  jwt.verify(token, process.env.JWT_SECRET || 'default-secret', (err, decoded) => {
    if (err) {
      return next(new Error('Invalid authentication token'));
    }

    const db = getDb();
    db.get(
      'SELECT * FROM users WHERE id = ?',
      [decoded.userId],
      (dbErr, user) => {
        if (dbErr || !user) {
          return next(new Error('User not found'));
        }

        if (user.is_banned) {
          return next(new Error('User is banned'));
        }

        socket.userId = user.id;
        socket.username = user.username;
        socket.isAdmin = user.is_admin;
        next();
      }
    );
  });
};

const socketHandler = (io) => {
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`👤 User ${socket.username} connected`);

    socket.on('join_room', async (data) => {
      try {
        const { roomId } = data;
        const db = getDb();

        db.get('SELECT * FROM rooms WHERE id = ?', [roomId], (err, room) => {
          if (err || !room) {
            socket.emit('error', { message: 'Room not found' });
            return;
          }

          db.get(
            'SELECT COUNT(*) as count FROM user_rooms WHERE room_id = ?',
            [roomId],
            (err, result) => {
              if (err) {
                socket.emit('error', { message: 'Database error' });
                return;
              }

              const maxRoomSize = parseInt(process.env.MAX_ROOM_SIZE) || 20;
              const roomMaxSize = room.max_users || maxRoomSize;

              if (result.count >= roomMaxSize && !socket.isAdmin) {
                socket.emit('error', { message: 'Room is full' });
                return;
              }

              socket.join(`room_${roomId}`);
              socket.currentRoom = roomId;

              db.run(
                'INSERT OR REPLACE INTO user_rooms (user_id, room_id, joined_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
                [socket.userId, roomId]
              );

              socket.to(`room_${roomId}`).emit('user_joined', {
                username: socket.username,
                userId: socket.userId,
                isAdmin: socket.isAdmin,
                timestamp: new Date().toISOString()
              });

              socket.emit('joined_room', {
                roomId,
                roomName: room.name,
                message: `Joined ${room.name}`
              });

              db.all(
                `SELECT u.id, u.username, u.is_admin, ur.joined_at
                 FROM users u
                 JOIN user_rooms ur ON u.id = ur.user_id
                 WHERE ur.room_id = ?
                 ORDER BY u.username`,
                [roomId],
                (err, users) => {
                  if (!err) {
                    io.to(`room_${roomId}`).emit('room_users', users);
                  }
                }
              );
            }
          );
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    socket.on('leave_room', () => {
      if (socket.currentRoom) {
        const db = getDb();

        socket.to(`room_${socket.currentRoom}`).emit('user_left', {
          username: socket.username,
          userId: socket.userId,
          timestamp: new Date().toISOString()
        });

        db.run(
          'DELETE FROM user_rooms WHERE user_id = ? AND room_id = ?',
          [socket.userId, socket.currentRoom]
        );

        socket.leave(`room_${socket.currentRoom}`);
        socket.currentRoom = null;
      }
    });

    socket.on('send_message', (data) => {
      try {
        const { message } = data;

        if (!socket.currentRoom) {
          socket.emit('error', { message: 'You must be in a room to send messages' });
          return;
        }

        if (!message || message.trim().length === 0) {
          socket.emit('error', { message: 'Message cannot be empty' });
          return;
        }

        if (message.length > 500) {
          socket.emit('error', { message: 'Message too long (max 500 characters)' });
          return;
        }

        const db = getDb();
        const timestamp = new Date().toISOString();

        db.run(
          'INSERT INTO messages (room_id, user_id, username, content, timestamp) VALUES (?, ?, ?, ?, ?)',
          [socket.currentRoom, socket.userId, socket.username, message.trim(), timestamp],
          function(err) {
            if (err) {
              socket.emit('error', { message: 'Failed to save message' });
              return;
            }

            const messageData = {
              id: this.lastID,
              roomId: socket.currentRoom,
              userId: socket.userId,
              username: socket.username,
              content: message.trim(),
              timestamp,
              isAdmin: socket.isAdmin
            };

            io.to(`room_${socket.currentRoom}`).emit('new_message', messageData);
          }
        );
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('delete_message', (data) => {
      if (!socket.isAdmin) {
        socket.emit('error', { message: 'Admin privileges required' });
        return;
      }

      const { messageId } = data;
      const db = getDb();

      db.get('SELECT * FROM messages WHERE id = ?', [messageId], (err, message) => {
        if (err || !message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        db.run(
          'UPDATE messages SET is_deleted = 1, deleted_by = ? WHERE id = ?',
          [socket.userId, messageId],
          function(err) {
            if (err) {
              socket.emit('error', { message: 'Failed to delete message' });
              return;
            }

            io.to(`room_${message.room_id}`).emit('message_deleted', {
              messageId,
              deletedBy: socket.username
            });
          }
        );
      });
    });

    socket.on('ban_user', (data) => {
      if (!socket.isAdmin) {
        socket.emit('error', { message: 'Admin privileges required' });
        return;
      }

      const { userId } = data;
      const db = getDb();

      db.run(
        'UPDATE users SET is_banned = 1 WHERE id = ?',
        [userId],
        function(err) {
          if (err) {
            socket.emit('error', { message: 'Failed to ban user' });
            return;
          }

          const bannedSocket = Array.from(io.sockets.sockets.values())
            .find(s => s.userId === userId);

          if (bannedSocket) {
            bannedSocket.emit('banned', { message: 'You have been banned by an administrator' });
            bannedSocket.disconnect();
          }

          io.emit('user_banned', { userId, bannedBy: socket.username });
        }
      );
    });

    socket.on('disconnect', () => {
      console.log(`👤 User ${socket.username} disconnected`);

      if (socket.currentRoom) {
        const db = getDb();

        socket.to(`room_${socket.currentRoom}`).emit('user_left', {
          username: socket.username,
          userId: socket.userId,
          timestamp: new Date().toISOString()
        });

        db.run(
          'DELETE FROM user_rooms WHERE user_id = ? AND room_id = ?',
          [socket.userId, socket.currentRoom]
        );

        db.all(
          `SELECT u.id, u.username, u.is_admin, ur.joined_at
           FROM users u
           JOIN user_rooms ur ON u.id = ur.user_id
           WHERE ur.room_id = ?
           ORDER BY u.username`,
          [socket.currentRoom],
          (err, users) => {
            if (!err) {
              io.to(`room_${socket.currentRoom}`).emit('room_users', users);
            }
          }
        );
      }
    });
  });
};

module.exports = socketHandler;