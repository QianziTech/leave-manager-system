import { getDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const { role } = event.context.user
  if (role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: '无权操作' })
  }

  const body = await readBody(event)
  const db = getDb()

  const allowedKeys = ['leave_multi_level_threshold']

  const stmt = db.prepare(
    "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))",
  )

  for (const key of allowedKeys) {
    if (body[key] !== undefined) {
      stmt.run(key, String(body[key]))
    }
  }

  const rows = db.prepare('SELECT key, value, description FROM settings').all() as any[]
  const settings: Record<string, string> = {}
  for (const row of rows) {
    settings[row.key] = row.value
  }
  return settings
})
