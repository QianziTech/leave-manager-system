import { getDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const { userId, role } = event.context.user
  const db = getDb()

  const leave = db.prepare(`
    SELECT l.*, u.real_name as applicant_name, u.department as applicant_department
    FROM leaves l JOIN users u ON l.user_id = u.id
    WHERE l.id = ?
  `).get(id) as any

  if (!leave) {
    throw createError({ statusCode: 404, statusMessage: 'Leave not found' })
  }

  // Role-based access control
  if (role === 'employee' && leave.user_id !== userId) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const approvals = db.prepare(`
    SELECT a.*, u.real_name as approver_name
    FROM approvals a JOIN users u ON a.approver_id = u.id
    WHERE a.leave_id = ?
    ORDER BY a.level
  `).all(id)

  return { ...leave, approvals }
})
