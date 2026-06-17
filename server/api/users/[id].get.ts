import { getDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const { role: currentRole } = event.context.user
  if (currentRole !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin only' })
  }

  const id = getRouterParam(event, 'id')
  const db = getDb()
  const user = db.prepare('SELECT id, username, real_name, department, role, supervisor_id, active, created_at FROM users WHERE id = ?').get(id)

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  return user
})
