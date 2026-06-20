import { getDb } from '../../utils/db'
import { hashPassword } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const { role: currentRole } = event.context.user
  if (currentRole !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: '仅管理员可操作' })
  }

  const { username, password, realName, department, role, supervisorId } = await readBody(event)

  if (!username || !password || !realName || !department || !role) {
    throw createError({ statusCode: 400, statusMessage: '请填写所有必填字段' })
  }

  const db = getDb()

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: '用户名已存在' })
  }

  const result = db.prepare(
    'INSERT INTO users (username, password_hash, real_name, department, role, supervisor_id) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(username, hashPassword(password), realName, department, role, supervisorId || null)

  return { id: Number(result.lastInsertRowid), username, realName, department, role, supervisorId: supervisorId || null }
})