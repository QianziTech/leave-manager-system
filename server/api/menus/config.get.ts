export default defineEventHandler(async (event) => {
  const { role } = event.context.user
  if (role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: '无权操作' })
  }

  const db = getDb()
  const rows = db.prepare(`
    SELECT id, path, label, icon, roles, sort_order, visible, enabled
    FROM menu_items
    ORDER BY sort_order
  `).all() as any[]

  return rows.map((row) => ({
    ...row,
    roles: JSON.parse(row.roles || '[]'),
  }))
})
