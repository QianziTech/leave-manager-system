import { getDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const { userId, role } = event.context.user
  if (role !== 'employee' && role !== 'supervisor' && role !== 'dept_head' && role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const { type, startTime, endTime, duration, reason } = await readBody(event)

  if (!type || !startTime || !endTime || !duration || !reason) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
  }

  const db = getDb()

  const applicantId = role === 'admin' ? (await readBody(event)).userId || userId : userId
  const user = db.prepare('SELECT supervisor_id FROM users WHERE id = ? AND active = 1').get(applicantId) as any
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  const result = db.prepare(
    'INSERT INTO leaves (user_id, type, start_time, end_time, duration, reason) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(applicantId, type, startTime, endTime, duration, reason)

  const leaveId = Number(result.lastInsertRowid)

  // Create approval records
  // Level 1: direct supervisor
  if (user.supervisor_id) {
    db.prepare('INSERT INTO approvals (leave_id, approver_id, level) VALUES (?, ?, 1)').run(leaveId, user.supervisor_id)
  }

  // Level 2: department head (for long leaves > 3 days)
  if (duration > 3) {
    const deptHead = db.prepare("SELECT id FROM users WHERE department = (SELECT department FROM users WHERE id = ?) AND role = 'dept_head' AND active = 1 LIMIT 1").get(applicantId) as any
    if (deptHead) {
      db.prepare('INSERT INTO approvals (leave_id, approver_id, level) VALUES (?, ?, 2)').run(leaveId, deptHead.id)
    }
  }

  const leave = db.prepare('SELECT * FROM leaves WHERE id = ?').get(leaveId)
  return leave
})
