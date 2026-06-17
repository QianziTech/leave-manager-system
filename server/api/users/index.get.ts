import { getDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const { role } = event.context.user
  if (role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin only' })
  }

  const db = getDb()
  const query = getQuery(event)
  let sql = 'SELECT id, username, real_name, department, role, supervisor_id, active, created_at FROM users WHERE 1=1'
  const params: any[] = []

  if (query.department) {
    sql += ' AND department = ?'
    params.push(query.department)
  }

  sql += ' ORDER BY created_at DESC'

  const users = db.prepare(sql).all(...params)
  return users
})
