import { getDb } from '../../utils/db'
import { assignDepartmentManager } from '../../utils/orgSync'

export default defineEventHandler(async (event) => {
  const { role } = event.context.user
  if (role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: '无权操作' })
  }

  const id = getRouterParam(event, 'id')
  const { name, managerId } = await readBody(event)
  const db = getDb()

  const dept = db.prepare('SELECT * FROM departments WHERE id = ?').get(id) as any
  if (!dept) {
    throw createError({ statusCode: 404, statusMessage: '部门不存在' })
  }

  if (name !== undefined && name !== dept.name) {
    const existing = db.prepare('SELECT id FROM departments WHERE name = ? AND id != ?').get(name.trim(), id)
    if (existing) {
      throw createError({ statusCode: 400, statusMessage: '部门名称已存在' })
    }
  }

  const nextName = name?.trim() || dept.name
  db.prepare('UPDATE departments SET name = ? WHERE id = ?').run(nextName, id)

  if (managerId !== undefined) {
    assignDepartmentManager(db, Number(id), managerId)
  } else if (nextName !== dept.name && dept.manager_id) {
    db.prepare('UPDATE users SET department = ? WHERE id = ?').run(nextName, dept.manager_id)
  }

  return db.prepare('SELECT * FROM departments WHERE id = ?').get(id)
})
