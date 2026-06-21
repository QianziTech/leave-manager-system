import type Database from 'better-sqlite3'

export interface ApprovalLevel {
  level: number
  role: string
  approverName: string
  approverId: number
}

export function getLeaveApprovalThreshold(db: Database.Database) {
  const thresholdRow = db.prepare(
    "SELECT value FROM settings WHERE key = 'leave_multi_level_threshold'",
  ).get() as any

  return thresholdRow ? Number(thresholdRow.value) : 3
}

export function resolveApprovalFlow(db: Database.Database, applicantId: number, duration: number) {
  const user = db.prepare(`
    SELECT u.id, u.supervisor_id, u.department_id, u.real_name,
           d.name as department_name, d.manager_id
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.id = ? AND u.active = 1
  `).get(applicantId) as any

  if (!user) {
    return null
  }

  const threshold = getLeaveApprovalThreshold(db)
  const levels: ApprovalLevel[] = []

  const supervisor = findSupervisor(db, user.supervisor_id, user.manager_id, user.id)
  if (supervisor) {
    levels.push({
      level: 1,
      role: 'supervisor',
      approverName: supervisor.real_name,
      approverId: supervisor.id,
    })
  }

  if (duration > threshold) {
    const deptHead = findDepartmentHead(db, user.department_id, user.manager_id, supervisor?.id || 0)
    if (deptHead) {
      levels.push({
        level: 2,
        role: 'dept_head',
        approverName: deptHead.real_name,
        approverId: deptHead.id,
      })
    }
  }

  return {
    user,
    levels,
    threshold,
    needMultiLevel: duration > threshold,
  }
}

export function createApprovalRecords(db: Database.Database, leaveId: number, levels: ApprovalLevel[]) {
  const insert = db.prepare('INSERT INTO approvals (leave_id, approver_id, level) VALUES (?, ?, ?)')
  for (const level of levels) {
    insert.run(leaveId, level.approverId, level.level)
  }
}

export function assertApprovalFlowReady(
  flow: ReturnType<typeof resolveApprovalFlow>,
): asserts flow is NonNullable<ReturnType<typeof resolveApprovalFlow>> {
  if (!flow) {
    throw createError({ statusCode: 404, statusMessage: '用户不存在' })
  }

  if (flow.levels.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: '未配置审批人，请在用户管理设置直属上级，或在部门管理设置部门经理',
    })
  }

  if (flow.needMultiLevel && !flow.levels.some(level => level.level === 2)) {
    throw createError({
      statusCode: 400,
      statusMessage: '超过阈值的请假需要二级审批，请配置部门经理或部门经理角色用户',
    })
  }
}

function findSupervisor(
  db: Database.Database,
  supervisorId: number | null,
  managerId: number | null,
  applicantId: number,
) {
  if (supervisorId) {
    const supervisor = db.prepare(
      'SELECT id, real_name FROM users WHERE id = ? AND active = 1',
    ).get(supervisorId) as any
    if (supervisor) {
      return supervisor
    }
  }

  if (!managerId || managerId === applicantId) {
    return null
  }

  return db.prepare(
    'SELECT id, real_name FROM users WHERE id = ? AND active = 1',
  ).get(managerId) as any
}

function findDepartmentHead(
  db: Database.Database,
  departmentId: number | null,
  managerId: number | null,
  excludedApproverId: number,
) {
  if (managerId && managerId !== excludedApproverId) {
    const manager = db.prepare(
      'SELECT id, real_name FROM users WHERE id = ? AND active = 1',
    ).get(managerId) as any
    if (manager) {
      return manager
    }
  }

  if (!departmentId) {
    return null
  }

  return db.prepare(
    "SELECT id, real_name FROM users WHERE department_id = ? AND role = 'dept_head' AND active = 1 AND id != ? LIMIT 1",
  ).get(departmentId, excludedApproverId) as any
}
