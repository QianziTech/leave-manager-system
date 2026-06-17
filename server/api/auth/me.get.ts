import { getDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const { userId } = event.context.user
  const db = getDb()
  const user = db
    .prepare('SELECT id, username, real_name, department, role, supervisor_id, created_at FROM users WHERE id = ? AND active = 1')
    .get(userId) as any

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  return {
    id: user.id,
    username: user.username,
    realName: user.real_name,
    department: user.department,
    role: user.role,
    supervisorId: user.supervisor_id,
    createdAt: user.created_at,
  }
})
