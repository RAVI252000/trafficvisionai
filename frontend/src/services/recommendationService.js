import { api } from './api'

export const recommendationService = {
  async getRecommendations(params) {
    const response = await api.get('/api/v1/recommendations', { params })
    return response.data
  },

  async getSummary() {
    const response = await api.get('/api/v1/recommendations/summary')
    return response.data
  },

  async getDetail(id) {
    const response = await api.get(`/api/v1/recommendations/${id}`)
    return response.data
  },

  async generateRecommendations() {
    const response = await api.post('/api/v1/recommendations/generate')
    return response.data
  },

  async updateStatus(id, status) {
    const response = await api.patch(`/api/v1/recommendations/${id}/status`, { status })
    return response.data
  }
}
