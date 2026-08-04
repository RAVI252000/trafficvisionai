import { api } from './api'

/**
 * Service to manage system alerts via the REST API.
 */
export const alertService = {
  /**
   * Fetch all alerts with optional filters.
   * @param {Object} params - Query filters (status, severity, alert_type)
   */
  async getAlerts(params = {}) {
    const response = await api.get('/api/v1/alerts', { params })
    return response.data
  },

  /**
   * Fetch details for a specific alert.
   * @param {number} id - Alert ID
   */
  async getAlert(id) {
    const response = await api.get(`/api/v1/alerts/${id}`)
    return response.data
  },

  /**
   * Create a manual alert (Admin only).
   * @param {Object} payload - Alert details (title, description, location, road_name, alert_type, severity)
   */
  async createAlert(payload) {
    const response = await api.post('/api/v1/alerts', payload)
    return response.data
  },

  /**
   * Acknowledge an active alert (Operator or Admin).
   * @param {number} id - Alert ID
   */
  async acknowledgeAlert(id) {
    const response = await api.patch(`/api/v1/alerts/${id}/acknowledge`)
    return response.data
  },

  /**
   * Resolve an alert (Admin only).
   * @param {number} id - Alert ID
   */
  async resolveAlert(id) {
    const response = await api.patch(`/api/v1/alerts/${id}/resolve`)
    return response.data
  },

  /**
   * Delete an alert (Admin only).
   * @param {number} id - Alert ID
   */
  async deleteAlert(id) {
    const response = await api.delete(`/api/v1/alerts/${id}`)
    return response.data
  }
}
