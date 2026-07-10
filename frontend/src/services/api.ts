import axios from 'axios'
import { STORAGE_KEY } from '../utils/constants'

// Base URL points to the FastAPI backend server
const API_URL = 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const rawSession = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY)
    if (rawSession) {
      try {
        const session = JSON.parse(rawSession)
        if (session && session.token) {
          config.headers.Authorization = `Bearer ${session.token}`
        }
      } catch (error) {
        console.error('Error parsing session storage:', error)
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token expiration/unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Only clear and redirect if we were already authenticated
      const rawSession = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY)
      if (rawSession) {
        localStorage.removeItem(STORAGE_KEY)
        sessionStorage.removeItem(STORAGE_KEY)
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)
