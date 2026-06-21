import { getDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const { role } = event.context.user
  if (role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: '无权操作' })
  }

  const id = getRouterParam(event, 'id')
  const db = getDb()

  const dept = db.prepare('SELECT * FROM departments WHERE id = ?').get(id) as any
  if (!dept) {
    throw createError({ statusCode: 404, statusMessage: '部门不存在' })
  }

  const userCount = (db.prepare(
    'SELECT COUNT(*) as c FROM users WHERE department_id = ? AND active = 1',
  ).get(id) as any).c

  if (userCount > 0) {
    throw createError({ statusCode: 400, statusMessage: `该部门下还有 ${userCount} 名在职员工，无法删除` })
  }

  db.prepare('DELETE FROM departments WHERE id = ?').run(id)
  return { success: true }
})
