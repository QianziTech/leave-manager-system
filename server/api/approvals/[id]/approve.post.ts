import { getDb } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const approvalId = getRouterParam(event, 'id')
  const { userId } = event.context.user
  const { comment } = await readBody(event)
  const db = getDb()

  const approval = db.prepare('SELECT * FROM approvals WHERE id = ?').get(approvalId) as any

  if (!approval) {
    throw createError({ statusCode: 404, statusMessage: 'Approval not found' })
  }

  if (approval.approver_id !== userId) {
    throw createError({ statusCode: 403, statusMessage: 'Not your approval task' })
  }

  if (approval.decision !== null) {
    throw createError({ statusCode: 400, statusMessage: 'Already decided' })
  }

  db.prepare("UPDATE approvals SET decision = 'approved', comment = ? WHERE id = ?").run(comment || null, approvalId)

  // Check if leave is fully approved
  const leave = db.prepare('SELECT * FROM leaves WHERE id = ?').get(approval.leave_id) as any

  if (leave.duration <= 3) {
    // Short leave: level 1 approval is enough
    db.prepare("UPDATE leaves SET status = 'approved', updated_at = datetime('now') WHERE id = ?").run(approval.leave_id)
  } else {
    // Long leave: need level 2 as well
    const level2 = db.prepare("SELECT * FROM approvals WHERE leave_id = ? AND level = 2 AND decision = 'approved'").get(approval.leave_id)
    if (level2) {
      db.prepare("UPDATE leaves SET status = 'approved', updated_at = datetime('now') WHERE id = ?").run(approval.leave_id)
    }
  }

  return db.prepare('SELECT * FROM approvals WHERE id = ?').get(approvalId)
})
