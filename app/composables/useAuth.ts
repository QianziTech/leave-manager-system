interface User {
  id: number
  username: string
  realName: string
  department: string
  role: 'employee' | 'supervisor' | 'dept_head' | 'admin'
  supervisorId: number | null
  createdAt?: string
}

export const useAuth = () => {
  const user = useState<User | null>('auth:user', () => null)
  const isAuthenticated = computed(() => user.value !== null)

  async function fetchUser() {
    try {
      user.value = await $fetch('/api/auth/me')
    } catch {
      user.value = null
    }
  }

  async function login(username: string, password: string) {
    const result = await $fetch('/api/auth/login', {
      method: 'POST',
      body: { username, password },
    })
    user.value = result as User
    return result
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    user.value = null
    await navigateTo('/login')
  }

  return { user, isAuthenticated, login, logout, fetchUser }
}
