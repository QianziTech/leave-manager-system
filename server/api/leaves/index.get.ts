import { getDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const { userId, role } = event.context.user
  const query = getQuery(event)
  const db = getDb()

  let where = '1=1'
  const params: any[] = []

  // 获取当前用户的 department_id
  const currentUser = db.prepare('SELECT department_id FROM users WHERE id = ?').get(userId) as any

  if (role === 'employee') {
    where += ' AND l.user_id = ?'
    params.push(userId)
  } else if (role === 'dept_head') {
    // 主管可查看本部门全员，以及自己作为审批人的请假记录
    where += ` AND (
      l.user_id IN (SELECT id FROM users WHERE department_id = ?)
      OR EXISTS (
        SELECT 1 FROM approvals a
        WHERE a.leave_id = l.id AND a.approver_id = ?
      )
    )`
    params.push(currentUser?.department_id, userId)
  } else if (role === 'supervisor') {
    // 部门经理只能看到本部门的请假记录（自己 + 下属）
    where += ` AND l.user_id IN (
      SELECT id FROM users WHERE department_id = ?
      AND (supervisor_id = ? OR id = ?)
    )`
    params.push(currentUser?.department_id, userId, userId)
  }
  // admin 看到全部（不加限制）

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
    `SELECT l.*, u.real_name as applicant_name, d.name as applicant_department
     FROM leaves l
     JOIN users u ON l.user_id = u.id
     LEFT JOIN departments d ON u.department_id = d.id
     WHERE ${where}
     ORDER BY l.created_at DESC
     LIMIT ? OFFSET ?`,
  ).all(...params, pageSize, (page - 1) * pageSize)

  return { list: leaves, total: countRow.total, page, pageSize }
})
