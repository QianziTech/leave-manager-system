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
    runMigrations(db)
    seedAdmin(db)
  }
  return db
}

function initSchema(db: Database.Database) {
  db.exec(`
    -- 迁移版本追踪
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY
    );

    -- 部门表
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      manager_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (manager_id) REFERENCES users(id)
    );

    -- 用户表
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      real_name TEXT NOT NULL,
      department TEXT NOT NULL DEFAULT '',
      department_id INTEGER,
      role TEXT NOT NULL CHECK (role IN ('employee', 'supervisor', 'dept_head', 'admin')),
      supervisor_id INTEGER,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (department_id) REFERENCES departments(id),
      FOREIGN KEY (supervisor_id) REFERENCES users(id)
    );

    -- 请假表
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

    -- 审批记录表
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

    -- 状态流转日志表
    CREATE TABLE IF NOT EXISTS status_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      leave_id INTEGER NOT NULL,
      from_status TEXT,
      to_status TEXT NOT NULL,
      operator_id INTEGER NOT NULL,
      operator_role TEXT NOT NULL,
      comment TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (leave_id) REFERENCES leaves(id),
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );

    -- 系统设置表
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)
}

function runMigrations(db: Database.Database) {
  const currentVersion = (db.prepare(
    'SELECT MAX(version) as v FROM schema_version',
  ).get() as any)?.v || 0

  // V1: departments 迁移
  if (currentVersion < 1) {
    // 尝试给 users 表加 department_id 列（旧表可能没这列）
    try {
      db.exec('ALTER TABLE users ADD COLUMN department_id INTEGER REFERENCES departments(id)')
    } catch {
      // 列已存在则忽略
    }

    // 将现有 department 文本迁移到 departments 表
    const depts = db.prepare(
      "SELECT DISTINCT department FROM users WHERE department IS NOT NULL AND department != ''",
    ).all() as any[]

    const insertDept = db.prepare('INSERT OR IGNORE INTO departments (name) VALUES (?)')
    const updateUser = db.prepare(
      'UPDATE users SET department_id = (SELECT id FROM departments WHERE name = ?) WHERE department = ?',
    )

    for (const d of depts) {
      insertDept.run(d.department)
      updateUser.run(d.department, d.department)
    }

    db.prepare('INSERT INTO schema_version (version) VALUES (1)').run()
  }

  // V2: menu_items 菜单管理表
  if (currentVersion < 2) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT NOT NULL UNIQUE,
        label TEXT NOT NULL,
        icon TEXT NOT NULL,
        roles TEXT NOT NULL DEFAULT '[]',
        sort_order INTEGER NOT NULL DEFAULT 0,
        visible INTEGER NOT NULL DEFAULT 1,
        enabled INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `)

    const seed = db.prepare(
      'INSERT OR IGNORE INTO menu_items (path, label, icon, roles, sort_order, visible) VALUES (?, ?, ?, ?, ?, ?)',
    )
    const defaults: [string, string, string, string, number, number][] = [
      ['/records', '请假记录', 'FileTextOutlined', '["employee","supervisor","dept_head","admin"]', 1, 1],
      ['/records/:id', '请假详情', 'FileTextOutlined', '["employee","supervisor","dept_head","admin"]', 0, 0],
      ['/apply', '申请请假', 'FormOutlined', '["employee","supervisor","dept_head","admin"]', 2, 1],
      ['/approvals', '待审批', 'CheckCircleOutlined', '["supervisor","dept_head","admin"]', 3, 1],
      ['/profile', '个人中心', 'UserOutlined', '["employee","supervisor","dept_head","admin"]', 4, 1],
      ['/admin/users', '用户管理', 'TeamOutlined', '["admin"]', 5, 1],
      ['/admin/departments', '部门管理', 'ApartmentOutlined', '["admin"]', 6, 1],
      ['/admin/settings', '系统设置', 'ControlOutlined', '["admin"]', 7, 1],
      ['/admin/menus', '菜单管理', 'MenuOutlined', '["admin"]', 8, 1],
    ]
    for (const d of defaults) {
      seed.run(...d)
    }

    db.prepare('INSERT INTO schema_version (version) VALUES (2)').run()
  }

  // 默认设置
  db.prepare(
    "INSERT OR IGNORE INTO settings (key, value, description) VALUES (?, ?, ?)",
  ).run('leave_multi_level_threshold', '3', '请假天数阈值，超过此天数需二级审批')
}

function seedAdmin(db: Database.Database) {
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get('admin')
  if (existing) return

  // 确保有管理部
  db.prepare('INSERT OR IGNORE INTO departments (name) VALUES (?)').run('管理部')

  const hash = hashSync('admin123', 10)
  db.prepare(`
    INSERT INTO users (username, password_hash, real_name, department, department_id, role)
    VALUES (?, ?, ?, ?, (SELECT id FROM departments WHERE name = ?), ?)
  `).run('admin', hash, 'System Admin', '管理部', '管理部', 'admin')
}
