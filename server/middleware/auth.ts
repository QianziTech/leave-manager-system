import { verifyToken } from '../utils/jwt'

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  // 仅对 API 路由生效
  if (!path.startsWith('/api/')) {
    return
  }

  if (path.startsWith('/api/auth/login') || path.startsWith('/api/auth/register')) {
    return
  }

  const token = getCookie(event, 'token')
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: '未登录，请先登录' })
  }

  try {
    const payload = await verifyToken(token)
    event.context.user = payload
  } catch {
    throw createError({ statusCode: 401, statusMessage: '登录已过期，请重新登录' })
  }
})