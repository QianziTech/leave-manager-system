import { getDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const { userId } = event.context.user
  const db = getDb()
  const user = db
    .prepare(`
      SELECT u.id, u.username, u.real_name, u.department_id, d.name as department_name,
             u.role, u.supervisor_id, u.created_at
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ? AND u.active = 1
    `)
    .get(userId) as any

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: '用户不存在' })
  }

  return {
    id: user.id,
    username: user.username,
    realName: user.real_name,
    departmentId: user.department_id,
    departmentName: user.department_name || '',
    role: user.role,
    supervisorId: user.supervisor_id,
    createdAt: user.created_at,
  }
})
