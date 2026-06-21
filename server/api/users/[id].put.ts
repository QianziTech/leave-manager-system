import { getDb } from '../../utils/db'
import { hashPassword } from '../../utils/auth'
import { reconcileUserDepartmentManager } from '../../utils/orgSync'

export default defineEventHandler(async (event) => {
  const { role: currentRole } = event.context.user
  if (currentRole !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: '仅管理员可操作' })
  }

  const id = getRouterParam(event, 'id')
  const { username, password, realName, departmentId, role, supervisorId } = await readBody(event)
  const db = getDb()

  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: '用户不存在' })
  }

  const updates: string[] = []
  const params: any[] = []

  if (username) { updates.push('username = ?'); params.push(username) }
  if (password) { updates.push('password_hash = ?'); params.push(hashPassword(password)) }
  if (realName) { updates.push('real_name = ?'); params.push(realName) }
  if (departmentId !== undefined) {
    const dept = db.prepare('SELECT id, name FROM departments WHERE id = ?').get(departmentId) as any
    if (!dept) {
      throw createError({ statusCode: 400, statusMessage: '部门不存在' })
    }
    updates.push('department = ?'); params.push(dept.name)
    updates.push('department_id = ?'); params.push(departmentId)
  }
  if (role) { updates.push('role = ?'); params.push(role) }
  if (supervisorId !== undefined) { updates.push('supervisor_id = ?'); params.push(supervisorId) }

  if (updates.length > 0) {
    params.push(id)
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params)
    reconcileUserDepartmentManager(db, Number(id))
  }

  return db.prepare(`
    SELECT u.id, u.username, u.real_name, u.department_id, d.name as department_name,
           u.role, u.supervisor_id, u.active, u.created_at
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.id = ?
  `).get(id)
})
