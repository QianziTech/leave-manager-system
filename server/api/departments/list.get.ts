import { getDb } from '../../utils/db'

export default defineEventHandler(async () => {
  const db = getDb()
  return db.prepare('SELECT id, name FROM departments ORDER BY id').all()
})
