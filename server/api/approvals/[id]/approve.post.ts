import { getDb } from '../../../utils/db'
import { logStatusChange, StatusEvent } from '../../../utils/stateMachine'

export default defineEventHandler(async (event) => {
  const approvalId = getRouterParam(event, 'id')
  const { userId, role } = event.context.user
  const { comment } = await readBody(event)
  const db = getDb()

  const approval = db.prepare(`
    SELECT a.*
    FROM approvals a
    WHERE a.id = ?
  `).get(approvalId) as any

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

  // 记录审批日志
  const levelEvent = approval.level === 1 ? StatusEvent.LEVEL1_APPROVED : StatusEvent.LEVEL2_APPROVED
  logStatusChange(db, {
    leaveId: approval.leave_id,
    fromStatus: StatusEvent.SUBMITTED,
    toStatus: levelEvent,
    operatorId: userId,
    operatorRole: role,
    comment: comment || undefined,
  })

  const pendingApproval = db.prepare(
    'SELECT id FROM approvals WHERE leave_id = ? AND decision IS NULL',
  ).get(approval.leave_id)

  if (!pendingApproval) {
    // 所有已分配审批节点都通过后，请假才最终通过。
    db.prepare("UPDATE leaves SET status = 'approved', updated_at = datetime('now') WHERE id = ?").run(approval.leave_id)
    logStatusChange(db, {
      leaveId: approval.leave_id,
      fromStatus: levelEvent,
      toStatus: StatusEvent.FINAL_APPROVED,
      operatorId: userId,
      operatorRole: role,
    })
  }

  return db.prepare('SELECT * FROM approvals WHERE id = ?').get(approvalId)
})
