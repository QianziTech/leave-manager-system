import { getDb } from '../../utils/db'
import { comparePassword, hashPassword } from '../../utils/auth'
import { createToken } from '../../utils/jwt'

export default defineEventHandler(async (event) => {
  const { username, password } = await readBody(event)

  if (!username || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Username and password required' })
  }

  const db = getDb()
  const user = db
    .prepare('SELECT id, username, password_hash, real_name, department, role, supervisor_id, active FROM users WHERE username = ?')
    .get(username) as any

  if (!user || !user.active) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  if (!comparePassword(password, user.password_hash)) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  const token = await createToken({
    userId: user.id,
    username: user.username,
    role: user.role,
  })

  setCookie(event, 'token', token, {
    httpOnly: true,
    path: '/',
    maxAge: 86400,
    sameSite: 'lax',
  })

  return {
    id: user.id,
    username: user.username,
    realName: user.real_name,
    department: user.department,
    role: user.role,
    supervisorId: user.supervisor_id,
  }
})
