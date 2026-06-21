export default defineEventHandler(async (event) => {
  const { role } = event.context.user
  if (role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: '无权操作' })
  }

  const body = await readBody(event)
  const { menus } = body as { menus: any[] }

  if (!Array.isArray(menus)) {
    throw createError({ statusCode: 400, statusMessage: '参数格式错误' })
  }

  const db = getDb()

  const updateStmt = db.prepare(`
    UPDATE menu_items
    SET label = ?, icon = ?, roles = ?, sort_order = ?, visible = ?, enabled = ?, updated_at = datetime('now')
    WHERE id = ?
  `)

  const transaction = db.transaction(() => {
    for (const m of menus) {
      updateStmt.run(
        m.label,
        m.icon,
        JSON.stringify(m.roles || []),
        m.sort_order ?? 0,
        m.visible ?? 1,
        m.enabled ?? 1,
        m.id,
      )
    }
  })

  transaction()

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
