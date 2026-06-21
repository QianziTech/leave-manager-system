import { getDb } from '../../utils/db'
import { logStatusChange, StatusEvent } from '../../utils/stateMachine'
import { assertApprovalFlowReady, createApprovalRecords, resolveApprovalFlow } from '../../utils/approvalFlow'

export default defineEventHandler(async (event) => {
  const { userId, role } = event.context.user
  if (role !== 'employee' && role !== 'supervisor' && role !== 'dept_head' && role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: '无权操作' })
  }

  const { type, startTime, endTime, duration, reason } = await readBody(event)

  if (!type || !startTime || !endTime || !duration || !reason) {
    throw createError({ statusCode: 400, statusMessage: '请填写所有必填字段' })
  }

  const db = getDb()

  const applicantId = role === 'admin' ? (await readBody(event)).userId || userId : userId
  const flow = resolveApprovalFlow(db, applicantId, duration)
  assertApprovalFlowReady(flow)

  const result = db.prepare(
    'INSERT INTO leaves (user_id, type, start_time, end_time, duration, reason) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(applicantId, type, startTime, endTime, duration, reason)

  const leaveId = Number(result.lastInsertRowid)
  createApprovalRecords(db, leaveId, flow.levels)

  const leave = db.prepare('SELECT * FROM leaves WHERE id = ?').get(leaveId)

  // 记录状态日志
  logStatusChange(db, {
    leaveId,
    fromStatus: '',
    toStatus: StatusEvent.SUBMITTED,
    operatorId: applicantId,
    operatorRole: role,
  })

  return leave
})
