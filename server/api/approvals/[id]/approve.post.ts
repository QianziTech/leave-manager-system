import { getDb } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const approvalId = getRouterParam(event, 'id')
  const { userId } = event.context.user
  const { comment } = await readBody(event)
  const db = getDb()

  const approval = db.prepare('SELECT * FROM approvals WHERE id = ?').get(approvalId) as any

  if (!approval) {
    throw createError({ statusCode: 404, statusMessage: '审批记录不存在' })
  }

  if (approval.approver_id !== userId) {
    throw createError({ statusCode: 403, statusMessage: '无权审批该记录' })
  }

  if (approval.decision !== null) {
    throw createError({ statusCode: 400, statusMessage: '该审批已处理' })
  }

  db.prepare("UPDATE approvals SET decision = 'approved', comment = ? WHERE id = ?").run(comment || null, approvalId)

  // 检查请假是否已完全审批通过
  const leave = db.prepare('SELECT * FROM leaves WHERE id = ?').get(approval.leave_id) as any

  if (leave.duration <= 3) {
    // 短假（≤3天）：一级审批即可
    db.prepare("UPDATE leaves SET status = 'approved', updated_at = datetime('now') WHERE id = ?").run(approval.leave_id)
  } else {
    // 长假（>3天）：需要二级审批
    const level2 = db.prepare("SELECT * FROM approvals WHERE leave_id = ? AND level = 2 AND decision = 'approved'").get(approval.leave_id)
    if (level2) {
      db.prepare("UPDATE leaves SET status = 'approved', updated_at = datetime('now') WHERE id = ?").run(approval.leave_id)
    }
  }

  return db.prepare('SELECT * FROM approvals WHERE id = ?').get(approvalId)
})