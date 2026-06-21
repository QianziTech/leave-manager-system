export default defineEventHandler(async (event) => {
  const { role } = event.context.user
  const db = getDb()

  const rows = db.prepare(`
    SELECT id, path, label, icon, roles
    FROM menu_items
    WHERE enabled = 1 AND visible = 1
    ORDER BY sort_order
  `).all() as any[]

  return rows.filter((row) => {
    const rowRoles: string[] = JSON.parse(row.roles || '[]')
    return rowRoles.includes(role)
  }).map(({ id, path, label, icon }) => ({ id, path, label, icon }))
})
