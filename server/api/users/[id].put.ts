import { getDb } from '../../utils/db'
import { hashPassword } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const { role: currentRole } = event.context.user
  if (currentRole !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin only' })
  }

  const id = getRouterParam(event, 'id')
  const { username, password, realName, department, role, supervisorId } = await readBody(event)
  const db = getDb()

  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  const updates: string[] = []
  const params: any[] = []

  if (username) { updates.push('username = ?'); params.push(username) }
  if (password) { updates.push('password_hash = ?'); params.push(hashPassword(password)) }
  if (realName) { updates.push('real_name = ?'); params.push(realName) }
  if (department) { updates.push('department = ?'); params.push(department) }
  if (role) { updates.push('role = ?'); params.push(role) }
  if (supervisorId !== undefined) { updates.push('supervisor_id = ?'); params.push(supervisorId) }

  if (updates.length > 0) {
    params.push(id)
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params)
  }

  return db.prepare('SELECT id, username, real_name, department, role, supervisor_id, active, created_at FROM users WHERE id = ?').get(id)
})
