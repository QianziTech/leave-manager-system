import Database from 'better-sqlite3'
import { hashSync } from 'bcryptjs'
import { join } from 'node:path'
import { mkdirSync } from 'node:fs'

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    const dataDir = join(process.cwd(), '.data')
    mkdirSync(dataDir, { recursive: true })

    db = new Database(join(dataDir, 'leave-manager.db'))
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    initSchema(db)
    seedAdmin(db)
  }
  return db
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      real_name TEXT NOT NULL,
      department TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('employee', 'supervisor', 'dept_head', 'admin')),
      supervisor_id INTEGER,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (supervisor_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS leaves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('sick', 'personal', 'annual', 'other')),
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      duration REAL NOT NULL CHECK (duration >= 0.5),
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS approvals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      leave_id INTEGER NOT NULL,
      approver_id INTEGER NOT NULL,
      level INTEGER NOT NULL CHECK (level IN (1, 2)),
      decision TEXT CHECK (decision IN ('approved', 'rejected')),
      comment TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (leave_id) REFERENCES leaves(id),
      FOREIGN KEY (approver_id) REFERENCES users(id)
    );
  `)
}

function seedAdmin(db: Database.Database) {
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get('admin')
  if (existing) return

  const hash = hashSync('admin123', 10)
  db.prepare(
    'INSERT INTO users (username, password_hash, real_name, department, role) VALUES (?, ?, ?, ?, ?)',
  ).run('admin', hash, 'System Admin', 'Admin', 'admin')
}
