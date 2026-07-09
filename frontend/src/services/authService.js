import { MOCK_USERS, DEMO_USER_EMAIL } from '../data/mockUsers'
import { STORAGE_KEY } from '../utils/constants'

const NETWORK_DELAY = 900

/** Strip password before returning user to the app layer */
function sanitizeUser(user) {
  const { password: _pw, ...safe } = user
  return safe
}

function delay(ms = NETWORK_DELAY) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Mock authentication service.
 * Replace method bodies with Axios calls when the backend is ready.
 */
export const authService = {
  async login(email, password) {
    await delay()

    const user = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
    )

    if (!user) {
      throw new Error('Invalid email or password')
    }

    const session = sanitizeUser(user)
    return session
  },

  async loginAsDemo() {
    await delay(600)

    const user = MOCK_USERS.find((u) => u.email === DEMO_USER_EMAIL)
    if (!user) throw new Error('Demo user not configured')

    return sanitizeUser(user)
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
    await delay(300)
    this.clearSession()
  },
}
