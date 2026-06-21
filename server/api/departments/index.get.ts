import { getDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const { role } = event.context.user
  if (role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: '无权操作' })
  }

  const db = getDb()
  const departments = db.prepare(`
    SELECT d.*, u.real_name as manager_name
    FROM departments d
    LEFT JOIN users u ON d.manager_id = u.id
    ORDER BY d.id
  `).all()

  return departments
})
