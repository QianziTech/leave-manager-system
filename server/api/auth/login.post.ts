import { getDb } from '../../utils/db'
import { comparePassword } from '../../utils/auth'
import { createToken } from '../../utils/jwt'

export default defineEventHandler(async (event) => {
  const { username, password } = await readBody(event)

  if (!username || !password) {
    throw createError({ statusCode: 400, statusMessage: '请输入用户名和密码' })
  }

  const db = getDb()
  const user = db
    .prepare(`
      SELECT u.id, u.username, u.password_hash, u.real_name, u.department_id,
             d.name as department_name, u.role, u.supervisor_id, u.active
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.username = ?
    `)
    .get(username) as any

  if (!user || !user.active) {
    throw createError({ statusCode: 401, statusMessage: '用户名或密码错误' })
  }

  if (!comparePassword(password, user.password_hash)) {
    throw createError({ statusCode: 401, statusMessage: '用户名或密码错误' })
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
    departmentId: user.department_id,
    departmentName: user.department_name || '',
    role: user.role,
    supervisorId: user.supervisor_id,
  }
})
