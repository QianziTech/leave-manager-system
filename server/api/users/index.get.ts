import { getDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const { role } = event.context.user
  if (role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: '仅管理员可操作' })
  }

  const db = getDb()
  const query = getQuery(event)
  let sql = `SELECT u.id, u.username, u.real_name, u.department_id, d.name as department_name,
             u.role, u.supervisor_id, u.active, u.created_at
             FROM users u
             LEFT JOIN departments d ON u.department_id = d.id
             WHERE 1=1`
  const params: any[] = []

  if (query.departmentId) {
    sql += ' AND u.department_id = ?'
    params.push(query.departmentId)
  }

  sql += ' ORDER BY u.created_at DESC'

  const users = db.prepare(sql).all(...params)
  return users
})
