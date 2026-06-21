import { getDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const { role: currentRole } = event.context.user
  if (currentRole !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: '仅管理员可操作' })
  }

  const id = getRouterParam(event, 'id')
  const db = getDb()
  const user = db.prepare(`
    SELECT u.id, u.username, u.real_name, u.department_id, d.name as department_name,
           u.role, u.supervisor_id, u.active, u.created_at
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.id = ?
  `).get(id) as any

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: '用户不存在' })
  }

  return user
})
