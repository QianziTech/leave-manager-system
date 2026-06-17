import { getDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const { userId, role } = event.context.user
  const query = getQuery(event)
  const db = getDb()

  let where = '1=1'
  const params: any[] = []

  if (role === 'employee') {
    where += ' AND l.user_id = ?'
    params.push(userId)
  } else if (role === 'supervisor' || role === 'dept_head') {
    where += ' AND l.user_id IN (SELECT id FROM users WHERE supervisor_id = ? OR id = ?)'
    params.push(userId, userId)
  }

  if (query.status) {
    where += ' AND l.status = ?'
    params.push(query.status)
  }

  const page = Number(query.page) || 1
  const pageSize = Number(query.pageSize) || 10

  const countRow = db.prepare(
    `SELECT COUNT(*) as total FROM leaves l WHERE ${where}`,
  ).get(...params) as any

  const leaves = db.prepare(
    `SELECT l.*, u.real_name as applicant_name, u.department as applicant_department
     FROM leaves l JOIN users u ON l.user_id = u.id
     WHERE ${where}
     ORDER BY l.created_at DESC
     LIMIT ? OFFSET ?`,
  ).all(...params, pageSize, (page - 1) * pageSize)

  return { list: leaves, total: countRow.total, page, pageSize }
})
