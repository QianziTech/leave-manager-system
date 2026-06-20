import { getDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const { role: currentRole } = event.context.user
  if (currentRole !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: '仅管理员可操作' })
  }

  const id = getRouterParam(event, 'id')
  const db = getDb()

  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: '用户不存在' })
  }

  // 软删除
  db.prepare('UPDATE users SET active = 0 WHERE id = ?').run(id)

  return { success: true }
})