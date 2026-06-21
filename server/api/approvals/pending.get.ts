import { getDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const { userId } = event.context.user
  const db = getDb()

  let sql = `
    SELECT a.*, l.type as leave_type, l.start_time, l.end_time, l.duration, l.reason,
           u.real_name as applicant_name, d.name as applicant_department
    FROM approvals a
    JOIN leaves l ON a.leave_id = l.id
    JOIN users u ON l.user_id = u.id
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE a.approver_id = ? AND a.decision IS NULL AND l.status = 'pending'
      AND NOT EXISTS (
        SELECT 1 FROM approvals prev
        WHERE prev.leave_id = a.leave_id
          AND prev.level < a.level
          AND prev.decision IS NULL
      )
  `

  const params: any[] = [userId]

  sql += ' ORDER BY a.created_at DESC'

  const approvals = db.prepare(sql).all(...params)
  return approvals
})
