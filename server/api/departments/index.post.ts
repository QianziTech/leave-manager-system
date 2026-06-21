import { getDb } from '../../utils/db'
import { assignDepartmentManager } from '../../utils/orgSync'

export default defineEventHandler(async (event) => {
  const { role } = event.context.user
  if (role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: '无权操作' })
  }

  const { name, managerId } = await readBody(event)
  if (!name || !name.trim()) {
    throw createError({ statusCode: 400, statusMessage: '部门名称不能为空' })
  }

  const db = getDb()

  const existing = db.prepare('SELECT id FROM departments WHERE name = ?').get(name.trim())
  if (existing) {
    throw createError({ statusCode: 400, statusMessage: '部门名称已存在' })
  }

  const result = db.prepare(
    'INSERT INTO departments (name, manager_id) VALUES (?, ?)',
  ).run(name.trim(), null)

  const departmentId = Number(result.lastInsertRowid)
  assignDepartmentManager(db, departmentId, managerId ?? null)

  return db.prepare('SELECT * FROM departments WHERE id = ?').get(departmentId)
})
