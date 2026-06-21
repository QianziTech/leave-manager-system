import type Database from 'better-sqlite3'

/** 状态流转事件 */
export const StatusEvent = {
  SUBMITTED: 'submitted',
  LEVEL1_APPROVED: 'level1_approved',
  LEVEL1_REJECTED: 'level1_rejected',
  LEVEL2_APPROVED: 'level2_approved',
  LEVEL2_REJECTED: 'level2_rejected',
  FINAL_APPROVED: 'final_approved',
  FINAL_REJECTED: 'final_rejected',
  WITHDRAWN: 'withdrawn',
  EDITED: 'edited',
} as const

/** 合法状态转换 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  ['']: [StatusEvent.SUBMITTED],           // 新建
  [StatusEvent.SUBMITTED]: [
    StatusEvent.LEVEL1_APPROVED,
    StatusEvent.LEVEL1_REJECTED,
    StatusEvent.WITHDRAWN,
    StatusEvent.EDITED,
  ],
  [StatusEvent.LEVEL1_APPROVED]: [
    StatusEvent.LEVEL2_APPROVED,
    StatusEvent.LEVEL2_REJECTED,
    StatusEvent.FINAL_APPROVED,
    StatusEvent.WITHDRAWN,
  ],
  [StatusEvent.LEVEL2_APPROVED]: [
    StatusEvent.FINAL_APPROVED,
    StatusEvent.LEVEL2_REJECTED,
  ],
}

export function isValidTransition(from: string, to: string): boolean {
  const allowed = VALID_TRANSITIONS[from]
  if (!allowed) return true // 未知状态，宽松处理
  return allowed.includes(to)
}

export function logStatusChange(
  db: Database.Database,
  params: {
    leaveId: number
    fromStatus: string
    toStatus: string
    operatorId: number
    operatorRole: string
    comment?: string
  },
) {
  db.prepare(`
    INSERT INTO status_logs (leave_id, from_status, to_status, operator_id, operator_role, comment)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    params.leaveId,
    params.fromStatus || null,
    params.toStatus,
    params.operatorId,
    params.operatorRole,
    params.comment || null,
  )
}

export function getStatusLogs(db: Database.Database, leaveId: number) {
  return db.prepare(`
    SELECT sl.*, u.real_name as operator_name
    FROM status_logs sl JOIN users u ON sl.operator_id = u.id
    WHERE sl.leave_id = ?
    ORDER BY sl.created_at ASC
  `).all(leaveId)
}
