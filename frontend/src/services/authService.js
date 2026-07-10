import { api } from './api'
import { STORAGE_KEY } from '../utils/constants'

export const authService = {
  async login(email, password) {
    try {
      const response = await api.post('/api/auth/login', { email, password })
      const { access_token, user: dbUser } = response.data
      
      // Format backend user to frontend expectations, and include token
      const sessionUser = {
        id: dbUser.id,
        name: dbUser.full_name,
        email: dbUser.email,
        role: dbUser.role,
        avatar: null,
        token: access_token
      }
      
      return sessionUser
    } catch (error) {
      if (error.response && error.response.data && error.response.data.detail) {
        throw new Error(error.response.data.detail)
      }
      throw new Error('Connection to authentication server failed')
    }
  },

  async loginAsDemo() {
    // Authenticate using the seeded traffic operator credentials
    return this.login('operator@trafficvision.ai', 'Operator@123')
  },

  saveSession(user, remember = false) {
    const storage = remember ? localStorage : sessionStorage
    storage.setItem(STORAGE_KEY, JSON.stringify(user))
  },

  getStoredSession() {
    const raw =
      localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  },

  clearSession() {
    localStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(STORAGE_KEY)
  },

  async logout() {
    try {
      await api.post('/api/auth/logout')
    } catch (e) {
      console.warn('Backend logout failed or not supported:', e)
    } finally {
      this.clearSession()
    }
  },
}
export default authService
