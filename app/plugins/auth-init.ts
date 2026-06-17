export default defineNuxtPlugin(async () => {
  const { fetchUser } = useAuth()
  try {
    await fetchUser()
  } catch {
    // User is not authenticated, that's fine
  }
})
