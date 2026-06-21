import { getDb } from '../../utils/db'
import { hashPassword } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const currentUser = event.context.user
  if (!currentUser || currentUser.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: '仅管理员可操作' })
  }

  const { username, password, realName, departmentId, role, supervisorId } = await readBody(event)

  if (!username || !password || !realName || !departmentId || !role) {
    throw createError({ statusCode: 400, statusMessage: '请填写所有必填字段' })
  }

  const db = getDb()

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: '用户名已存在' })
  }

  const dept = db.prepare('SELECT id, name FROM departments WHERE id = ?').get(departmentId) as any
  if (!dept) {
    throw createError({ statusCode: 400, statusMessage: '部门不存在' })
  }

  const result = db
    .prepare('INSERT INTO users (username, password_hash, real_name, department, department_id, role, supervisor_id) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(username, hashPassword(password), realName, dept.name, departmentId, role, supervisorId || null)

  return {
    id: Number(result.lastInsertRowid),
    username,
    realName,
    departmentId,
    departmentName: dept.name,
    role,
    supervisorId: supervisorId || null,
  }
})
