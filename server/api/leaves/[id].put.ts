import { getDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const { userId } = event.context.user
  const db = getDb()

  const leave = db.prepare('SELECT * FROM leaves WHERE id = ?').get(id) as any

  if (!leave) {
    throw createError({ statusCode: 404, statusMessage: 'Leave not found' })
  }

  if (leave.user_id !== userId) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  if (leave.status !== 'pending') {
    throw createError({ statusCode: 400, statusMessage: 'Only pending leaves can be modified' })
  }

  const { type, startTime, endTime, duration, reason } = await readBody(event)

  db.prepare(`
    UPDATE leaves SET type = COALESCE(?, type), start_time = COALESCE(?, start_time),
    end_time = COALESCE(?, end_time), duration = COALESCE(?, duration),
    reason = COALESCE(?, reason), updated_at = datetime('now')
    WHERE id = ?
  `).run(type || null, startTime || null, endTime || null, duration || null, reason || null, id)

  return db.prepare('SELECT * FROM leaves WHERE id = ?').get(id)
})
