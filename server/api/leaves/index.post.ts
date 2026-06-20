import { getDb } from '../../utils/db'

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
  const user = db.prepare('SELECT supervisor_id FROM users WHERE id = ? AND active = 1').get(applicantId) as any
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: '用户不存在' })
  }

  const result = db.prepare(
    'INSERT INTO leaves (user_id, type, start_time, end_time, duration, reason) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(applicantId, type, startTime, endTime, duration, reason)

  const leaveId = Number(result.lastInsertRowid)

  // 创建审批记录
  // 一级审批：直属主管
  if (user.supervisor_id) {
    db.prepare('INSERT INTO approvals (leave_id, approver_id, level) VALUES (?, ?, 1)').run(leaveId, user.supervisor_id)
  }

  // 二级审批：部门经理（请假超过3天）
  if (duration > 3) {
    const deptHead = db.prepare("SELECT id FROM users WHERE department = (SELECT department FROM users WHERE id = ?) AND role = 'dept_head' AND active = 1 LIMIT 1").get(applicantId) as any
    if (deptHead) {
      db.prepare('INSERT INTO approvals (leave_id, approver_id, level) VALUES (?, ?, 2)').run(leaveId, deptHead.id)
    }
  }

  const leave = db.prepare('SELECT * FROM leaves WHERE id = ?').get(leaveId)
  return leave
})