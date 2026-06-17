import { getDb } from '../../utils/db'
import { hashPassword } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const { role: currentRole } = event.context.user
  if (currentRole !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin only' })
  }

  const { username, password, realName, department, role, supervisorId } = await readBody(event)

  if (!username || !password || !realName || !department || !role) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
  }

  const db = getDb()

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'Username already exists' })
  }

  const result = db.prepare(
    'INSERT INTO users (username, password_hash, real_name, department, role, supervisor_id) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(username, hashPassword(password), realName, department, role, supervisorId || null)

  return { id: Number(result.lastInsertRowid), username, realName, department, role, supervisorId: supervisorId || null }
})
