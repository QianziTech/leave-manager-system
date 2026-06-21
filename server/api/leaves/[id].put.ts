import { getDb } from '../../utils/db'
import { logStatusChange, StatusEvent } from '../../utils/stateMachine'
import { assertApprovalFlowReady, resolveApprovalFlow } from '../../utils/approvalFlow'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const { userId, role } = event.context.user
  const db = getDb()

  const leave = db.prepare('SELECT * FROM leaves WHERE id = ?').get(id) as any

  if (!leave) {
    throw createError({ statusCode: 404, statusMessage: '请假记录不存在' })
  }

  if (leave.user_id !== userId) {
    throw createError({ statusCode: 403, statusMessage: '无权修改该记录' })
  }

  if (leave.status === 'rejected') {
    throw createError({ statusCode: 400, statusMessage: '已拒绝的请假无法修改，请重新提交申请' })
  }

  if (leave.status !== 'pending') {
    throw createError({ statusCode: 400, statusMessage: '只有待审批的请假才能修改' })
  }

  const { type, startTime, endTime, duration, reason } = await readBody(event)

  db.prepare(`
    UPDATE leaves SET type = COALESCE(?, type), start_time = COALESCE(?, start_time),
    end_time = COALESCE(?, end_time), duration = COALESCE(?, duration),
    reason = COALESCE(?, reason), updated_at = datetime('now')
    WHERE id = ?
  `).run(type || null, startTime || null, endTime || null, duration || null, reason || null, id)

  // 如果 duration 变化，重新计算审批链
  if (duration !== undefined && duration !== leave.duration) {
    const flow = resolveApprovalFlow(db, leave.user_id, duration)
    assertApprovalFlowReady(flow)

    const hasLevel2 = db.prepare(
      "SELECT id FROM approvals WHERE leave_id = ? AND level = 2",
    ).get(id)

    if (flow?.needMultiLevel && !hasLevel2) {
      // 需要新增二级审批
      const level2 = flow.levels.find(level => level.level === 2)
      if (level2) {
        db.prepare('INSERT INTO approvals (leave_id, approver_id, level) VALUES (?, ?, 2)').run(id, level2.approverId)
      }
    } else if (!flow?.needMultiLevel && hasLevel2) {
      // 不再需要二级审批，删除已有的二级审批（仅当未处理时）
      db.prepare(
        "DELETE FROM approvals WHERE leave_id = ? AND level = 2 AND decision IS NULL",
      ).run(id)
    }
  }

  logStatusChange(db, {
    leaveId: Number(id),
    fromStatus: StatusEvent.SUBMITTED,
    toStatus: StatusEvent.EDITED,
    operatorId: userId,
    operatorRole: role,
  })

  return db.prepare('SELECT * FROM leaves WHERE id = ?').get(id)
})
