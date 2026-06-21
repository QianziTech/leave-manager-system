import { getDb } from '../../utils/db'
import { getStatusLogs } from '../../utils/stateMachine'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const { userId, role } = event.context.user
  const db = getDb()

  const leave = db.prepare(`
    SELECT l.*, u.real_name as applicant_name, d.name as applicant_department,
           u.department_id as applicant_department_id
    FROM leaves l
    JOIN users u ON l.user_id = u.id
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE l.id = ?
  `).get(id) as any

  if (!leave) {
    throw createError({ statusCode: 404, statusMessage: '请假记录不存在' })
  }

  // 角色权限控制
  if (role === 'employee' && leave.user_id !== userId) {
    throw createError({ statusCode: 403, statusMessage: '无权查看该记录' })
  }

  // supervisor/dept_head 只能看本部门
  if (role === 'supervisor' || role === 'dept_head') {
    const currentUser = db.prepare('SELECT department_id FROM users WHERE id = ?').get(userId) as any
    if (leave.applicant_department_id !== currentUser?.department_id) {
      throw createError({ statusCode: 403, statusMessage: '无权查看非本部门的请假记录' })
    }
  }

  const approvals = db.prepare(`
    SELECT a.*, u.real_name as approver_name
    FROM approvals a JOIN users u ON a.approver_id = u.id
    WHERE a.leave_id = ?
    ORDER BY a.level
  `).all(id)

  const statusLogs = getStatusLogs(db, Number(id))

  return { ...leave, approvals, statusLogs }
})
