import type Database from 'better-sqlite3'

export function assignDepartmentManager(
  db: Database.Database,
  departmentId: number,
  managerId: number | null,
) {
  if (managerId === null) {
    db.prepare('UPDATE departments SET manager_id = NULL WHERE id = ?').run(departmentId)
    return
  }

  const dept = db.prepare('SELECT id, name FROM departments WHERE id = ?').get(departmentId) as any
  if (!dept) {
    throw createError({ statusCode: 400, statusMessage: '部门不存在' })
  }

  const manager = db.prepare('SELECT id FROM users WHERE id = ? AND active = 1').get(managerId)
  if (!manager) {
    throw createError({ statusCode: 400, statusMessage: '部门经理不存在或已停用' })
  }

  db.prepare('UPDATE departments SET manager_id = NULL WHERE manager_id = ? AND id != ?')
    .run(managerId, departmentId)
  db.prepare('UPDATE departments SET manager_id = ? WHERE id = ?').run(managerId, departmentId)
  db.prepare("UPDATE users SET role = 'dept_head', department = ?, department_id = ? WHERE id = ?")
    .run(dept.name, departmentId, managerId)
}

export function reconcileUserDepartmentManager(db: Database.Database, userId: number) {
  const user = db.prepare(
    'SELECT id, role, department_id, active FROM users WHERE id = ?',
  ).get(userId) as any

  if (!user || !user.active || user.role !== 'dept_head' || !user.department_id) {
    db.prepare('UPDATE departments SET manager_id = NULL WHERE manager_id = ?').run(userId)
    return
  }

  db.prepare('UPDATE departments SET manager_id = NULL WHERE manager_id = ? AND id != ?')
    .run(userId, user.department_id)
  db.prepare('UPDATE departments SET manager_id = ? WHERE id = ?').run(userId, user.department_id)
}
