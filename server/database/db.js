const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || './data/chat.db';
const dbDir = path.dirname(dbPath);

let db;

const initialize = async () => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
      } else {
        console.log('📦 Connected to SQLite database');
        createTables().then(resolve).catch(reject);
      }
    });
  });
};

const createTables = async () => {
  return new Promise((resolve, reject) => {
    const users = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT,
        is_admin BOOLEAN DEFAULT 0,
        is_banned BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_active DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const categories = `
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        sort_order INTEGER DEFAULT 0
      )
    `;

    const rooms = `
      CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        category_id INTEGER,
        max_users INTEGER DEFAULT 20,
        is_private BOOLEAN DEFAULT 0,
        is_aol_official BOOLEAN DEFAULT 0,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories (id),
        FOREIGN KEY (created_by) REFERENCES users (id)
      )
    `;

    const messages = `
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        username TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_deleted BOOLEAN DEFAULT 0,
        deleted_by INTEGER,
        FOREIGN KEY (room_id) REFERENCES rooms (id),
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (deleted_by) REFERENCES users (id)
      )
    `;

    const user_rooms = `
      CREATE TABLE IF NOT EXISTS user_rooms (
        user_id INTEGER NOT NULL,
        room_id INTEGER NOT NULL,
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, room_id),
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (room_id) REFERENCES rooms (id)
      )
    `;

    db.serialize(() => {
      db.run(users);
      db.run(categories);
      db.run(rooms);
      db.run(messages);
      db.run(user_rooms);

      // Insert AOL categories
      db.run(`
        INSERT OR IGNORE INTO categories (name, slug, description, sort_order)
        VALUES
          ('A Place To Start', 'a-place-to-start', 'Welcome and newcomer rooms', 1),
          ('Arts & Entertainment', 'arts-entertainment', 'Creative discussions and media', 2),
          ('Autos', 'autos', 'Cars, trucks, and automotive talk', 3),
          ('Black Voices', 'black-voices', 'African American community discussions', 4),
          ('Celebrities', 'celebrities', 'Celebrity news and gossip', 5),
          ('Food', 'food', 'Cooking, recipes, and dining', 6),
          ('Friends', 'friends', 'Meet new people and make friends', 7),
          ('Games', 'games', 'Video games and online gaming', 8),
          ('Gay & Lesbian', 'gay-lesbian', 'LGBTQ+ community discussions', 9),
          ('Health', 'health', 'Health, fitness, and wellness', 10),
          ('International', 'international', 'Global discussions and cultures', 11),
          ('Interests', 'interests', 'Hobbies and special interests', 12),
          ('Kids Only', 'kids-only', 'Safe space for younger users', 13),
          ('Life', 'life', 'General life discussions', 14),
          ('Local', 'local', 'Regional and city-specific chats', 15),
          ('Love & Romance', 'love-romance', 'Dating and relationships', 16),
          ('Music', 'music', 'All genres of music discussion', 17),
          ('News', 'news', 'Current events and politics', 18),
          ('Opinions', 'opinions', 'Debates and discussions', 19),
          ('Religion & Beliefs', 'religion-beliefs', 'Spiritual and religious topics', 20),
          ('Romance', 'romance', 'Love and dating conversations', 21),
          ('Sports', 'sports', 'All sports discussions', 22),
          ('Talk', 'talk', 'General conversation rooms', 23),
          ('Teens', 'teens', 'Teenager discussions and topics', 24),
          ('Women', 'women', 'Women-focused discussions', 25)
      `);

      // Insert authentic AOL rooms
      db.run(`
        INSERT OR IGNORE INTO rooms (name, description, category_id, max_users, is_aol_official)
        VALUES
          ('The Crash Pad', 'A casual hangout for everyone', 1, 34, 1),
          ('Coffee Klatch', 'Morning coffee and conversation', 1, 25, 1),
          ('The Cafe', 'Cozy discussions over virtual coffee', 1, 30, 1),
          ('Groove Lounge', 'Music lovers unite here', 1, 22, 1),
          ('Welcome Mat', 'New to AOL? Start here!', 1, 50, 1),
          ('The Porch', 'Friendly neighborhood chat', 1, 28, 1),
          ('Central Park', 'Meet people from all walks of life', 1, 45, 1),
          ('Friendly Fire', 'Lively debates and discussions', 1, 35, 1),

          ('Movie Talk', 'Latest films and classic cinema', 2, 40, 1),
          ('TV Guide', 'Television shows and series', 2, 30, 1),
          ('Book Club', 'Literature and reading discussions', 2, 25, 1),
          ('Art Gallery', 'Creative arts and design', 2, 20, 1),

          ('Car Talk', 'Automobiles and racing', 3, 25, 1),
          ('Truck Stop', 'Big rigs and trucking life', 3, 20, 1),
          ('Speed Zone', 'Racing and performance cars', 3, 30, 1),

          ('Urban Beats', 'Hip-hop and R&B culture', 4, 35, 1),
          ('Soul Kitchen', 'Music, food, and culture', 4, 28, 1),
          ('Community Center', 'General African American discussions', 4, 40, 1),

          ('Star Watch', 'Celebrity news and gossip', 5, 50, 1),
          ('Hollywood Buzz', 'Entertainment industry talk', 5, 45, 1),

          ('Recipe Exchange', 'Cooking tips and recipes', 6, 25, 1),
          ('Wine & Dine', 'Fine dining and beverages', 6, 20, 1),

          ('Friendship Circle', 'Make new friends here', 7, 40, 1),
          ('Buddy System', 'Find your chat buddy', 7, 35, 1),

          ('Game Central', 'All video games welcome', 8, 50, 1),
          ('Arcade', 'Classic and retro gaming', 8, 30, 1),
          ('PC Gaming', 'Computer game discussions', 8, 35, 1),

          ('Pride Room', 'LGBTQ+ safe space', 9, 30, 1),
          ('Rainbow Cafe', 'Casual LGBTQ+ conversations', 9, 25, 1),

          ('Wellness Center', 'Health and fitness talk', 10, 25, 1),
          ('Fitness Forum', 'Exercise and nutrition', 10, 30, 1),

          ('Global Village', 'International conversations', 11, 40, 1),
          ('World Cafe', 'Cultures from around the world', 11, 35, 1),

          ('Hobby Shop', 'Share your interests', 12, 25, 1),
          ('Collectors Corner', 'For collectors of all kinds', 12, 20, 1),

          ('Teen Central', 'High school discussions', 24, 50, 1),
          ('Homework Help', 'Study groups and academic help', 24, 30, 1)
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('📝 Database tables created with authentic AOL categories and rooms');
          resolve();
        }
      });
    });
  });
};

const getDb = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initialize() first.');
  }
  return db;
};

const close = () => {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('Database connection closed');
      }
    });
  }
};

module.exports = {
  initialize,
  getDb,
  close
};