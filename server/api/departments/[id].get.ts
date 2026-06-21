import { getDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const { role } = event.context.user
  if (role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: '无权操作' })
  }

  const id = getRouterParam(event, 'id')
  const db = getDb()

  const dept = db.prepare(`
    SELECT d.*, u.real_name as manager_name
    FROM departments d
    LEFT JOIN users u ON d.manager_id = u.id
    WHERE d.id = ?
  `).get(id) as any

  if (!dept) {
    throw createError({ statusCode: 404, statusMessage: '部门不存在' })
  }

  return dept
})
