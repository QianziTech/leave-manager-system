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

  db.prepare("UPDATE approvals SET decision = 'rejected', comment = ? WHERE id = ?").run(comment || null, approvalId)
  db.prepare("UPDATE leaves SET status = 'rejected', updated_at = datetime('now') WHERE id = ?").run(approval.leave_id)

  return db.prepare('SELECT * FROM approvals WHERE id = ?').get(approvalId)
})
