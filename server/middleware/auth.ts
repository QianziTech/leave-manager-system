import { verifyToken } from '../utils/jwt'

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  // Only apply to API routes
  if (!path.startsWith('/api/')) {
    return
  }

  if (path.startsWith('/api/auth/login') || path.startsWith('/api/auth/register')) {
    return
  }

  const token = getCookie(event, 'token')
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  try {
    const payload = await verifyToken(token)
    event.context.user = payload
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'Invalid token' })
  }
})
