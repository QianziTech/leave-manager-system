import { getDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const { userId } = event.context.user
  const db = getDb()

  const leave = db.prepare('SELECT * FROM leaves WHERE id = ?').get(id) as any

  if (!leave) {
    throw createError({ statusCode: 404, statusMessage: '请假记录不存在' })
  }

  if (leave.user_id !== userId) {
    throw createError({ statusCode: 403, statusMessage: '无权撤回该记录' })
  }

  if (leave.status !== 'pending') {
    throw createError({ statusCode: 400, statusMessage: '只有待审批的请假才能撤回' })
  }

  db.prepare("UPDATE leaves SET status = 'withdrawn', updated_at = datetime('now') WHERE id = ?").run(id)

  return { success: true }
})