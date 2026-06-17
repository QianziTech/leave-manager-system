import { getDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const { userId } = event.context.user
  const db = getDb()

  const approvals = db.prepare(`
    SELECT a.*, l.type as leave_type, l.start_time, l.end_time, l.duration, l.reason,
           u.real_name as applicant_name, u.department as applicant_department
    FROM approvals a
    JOIN leaves l ON a.leave_id = l.id
    JOIN users u ON l.user_id = u.id
    WHERE a.approver_id = ? AND a.decision IS NULL AND l.status = 'pending'
    ORDER BY a.created_at DESC
  `).all(userId)

  return approvals
})
