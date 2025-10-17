import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DATABASE_PATH || './data/calendar.db';
const dbDir = path.dirname(dbPath);

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database flag
let isInitialized = false;

// Create tables
export function initializeDatabase() {
  if (isInitialized) return;
  isInitialized = true;
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Email accounts table (supports multiple email accounts per user)
  db.exec(`
    CREATE TABLE IF NOT EXISTS email_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      provider TEXT NOT NULL,
      email TEXT NOT NULL,
      access_token TEXT,
      refresh_token TEXT,
      imap_host TEXT,
      imap_port INTEGER,
      smtp_host TEXT,
      smtp_port INTEGER,
      is_primary BOOLEAN DEFAULT 0,
      last_sync DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(user_id, email)
    )
  `);

  // Events/Calendar table
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      location TEXT,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      all_day BOOLEAN DEFAULT 0,
      recurrence_rule TEXT,
      color TEXT DEFAULT '#3b82f6',
      reminder_minutes INTEGER,
      calendar_type TEXT DEFAULT 'personal',
      attendees TEXT,
      meeting_url TEXT,
      is_ai_generated BOOLEAN DEFAULT 0,
      ai_confidence REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Emails table
  db.exec(`
    CREATE TABLE IF NOT EXISTS emails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      account_id INTEGER NOT NULL,
      message_id TEXT UNIQUE NOT NULL,
      thread_id TEXT,
      subject TEXT,
      from_email TEXT NOT NULL,
      from_name TEXT,
      to_email TEXT NOT NULL,
      cc TEXT,
      bcc TEXT,
      body_text TEXT,
      body_html TEXT,
      date DATETIME NOT NULL,
      is_read BOOLEAN DEFAULT 0,
      is_starred BOOLEAN DEFAULT 0,
      is_archived BOOLEAN DEFAULT 0,
      folder TEXT DEFAULT 'inbox',
      labels TEXT,
      has_attachments BOOLEAN DEFAULT 0,
      ai_category TEXT,
      ai_priority INTEGER DEFAULT 0,
      ai_summary TEXT,
      ai_suggested_actions TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (account_id) REFERENCES email_accounts (id) ON DELETE CASCADE
    )
  `);

  // Email attachments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS email_attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      content_type TEXT,
      size INTEGER,
      storage_path TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (email_id) REFERENCES emails (id) ON DELETE CASCADE
    )
  `);

  // Email drafts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS email_drafts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      account_id INTEGER NOT NULL,
      to_email TEXT,
      cc TEXT,
      bcc TEXT,
      subject TEXT,
      body_html TEXT,
      is_ai_assisted BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (account_id) REFERENCES email_accounts (id) ON DELETE CASCADE
    )
  `);

  // AI suggestions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_suggestions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      reference_id INTEGER,
      suggestion TEXT NOT NULL,
      confidence REAL,
      is_applied BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Activity log for audit trail
  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      resource_type TEXT,
      resource_id INTEGER,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Create indexes for performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_emails_user_id ON emails(user_id);
    CREATE INDEX IF NOT EXISTS idx_emails_account_id ON emails(account_id);
    CREATE INDEX IF NOT EXISTS idx_emails_date ON emails(date);
    CREATE INDEX IF NOT EXISTS idx_emails_folder ON emails(folder);
    CREATE INDEX IF NOT EXISTS idx_emails_message_id ON emails(message_id);
    CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
    CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
    CREATE INDEX IF NOT EXISTS idx_email_accounts_user_id ON email_accounts(user_id);
    CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
  `);

  console.log('✓ Database initialized successfully');
}

// Initialize database before creating prepared statements
initializeDatabase();

// Prepared statements for better performance
export const preparedStatements = {
  // Users
  createUser: db.prepare(`
    INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)
  `),
  getUserByEmail: db.prepare(`
    SELECT * FROM users WHERE email = ?
  `),
  getUserById: db.prepare(`
    SELECT * FROM users WHERE id = ?
  `),

  // Email accounts
  createEmailAccount: db.prepare(`
    INSERT INTO email_accounts (user_id, provider, email, access_token, refresh_token, is_primary)
    VALUES (?, ?, ?, ?, ?, ?)
  `),
  getEmailAccountsByUserId: db.prepare(`
    SELECT * FROM email_accounts WHERE user_id = ?
  `),
  updateEmailAccountTokens: db.prepare(`
    UPDATE email_accounts SET access_token = ?, refresh_token = ?, last_sync = CURRENT_TIMESTAMP
    WHERE id = ?
  `),

  // Events
  createEvent: db.prepare(`
    INSERT INTO events (user_id, title, description, location, start_time, end_time, all_day, color, calendar_type, attendees, meeting_url, is_ai_generated)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  getEventsByUserId: db.prepare(`
    SELECT * FROM events WHERE user_id = ? AND start_time >= ? AND end_time <= ?
    ORDER BY start_time ASC
  `),
  updateEvent: db.prepare(`
    UPDATE events SET title = ?, description = ?, location = ?, start_time = ?, end_time = ?, all_day = ?, color = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `),
  deleteEvent: db.prepare(`
    DELETE FROM events WHERE id = ? AND user_id = ?
  `),

  // Emails
  createEmail: db.prepare(`
    INSERT INTO emails (user_id, account_id, message_id, thread_id, subject, from_email, from_name, to_email, cc, body_text, body_html, date, folder, has_attachments)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  getEmailsByUserId: db.prepare(`
    SELECT * FROM emails WHERE user_id = ? AND folder = ? ORDER BY date DESC LIMIT ? OFFSET ?
  `),
  getEmailById: db.prepare(`
    SELECT * FROM emails WHERE id = ? AND user_id = ?
  `),
  updateEmailReadStatus: db.prepare(`
    UPDATE emails SET is_read = ? WHERE id = ? AND user_id = ?
  `),
  updateEmailFolder: db.prepare(`
    UPDATE emails SET folder = ? WHERE id = ? AND user_id = ?
  `),
  searchEmails: db.prepare(`
    SELECT * FROM emails WHERE user_id = ? AND (subject LIKE ? OR body_text LIKE ?) ORDER BY date DESC LIMIT 50
  `),

  // AI suggestions
  createAiSuggestion: db.prepare(`
    INSERT INTO ai_suggestions (user_id, type, reference_id, suggestion, confidence)
    VALUES (?, ?, ?, ?, ?)
  `),
  getAiSuggestionsByUserId: db.prepare(`
    SELECT * FROM ai_suggestions WHERE user_id = ? AND is_applied = 0 ORDER BY confidence DESC LIMIT 10
  `),

  // Activity log
  logActivity: db.prepare(`
    INSERT INTO activity_log (user_id, action, resource_type, resource_id, details, ip_address)
    VALUES (?, ?, ?, ?, ?, ?)
  `),
};

export default db;
