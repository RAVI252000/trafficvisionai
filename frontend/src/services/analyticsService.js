import { api } from './api'

export const analyticsService = {
  /**
   * Fetch traffic analytics dashboard KPIs.
   */
  async getDashboardKPIs(params) {
    const response = await api.get('/api/v1/analytics/dashboard', { params })
    return response.data
  },

  /**
   * Fetch structured chart datasets for Recharts.
   */
  async getChartsData(params) {
    const response = await api.get('/api/v1/analytics/charts', { params })
    return response.data
  },

  /**
   * Fetch Leaflet traffic heatmap coordinates and status metadata.
   */
  async getHeatmapData(params) {
    const response = await api.get('/api/v1/heatmap', { params })
    return response.data
  },

  /**
   * Fetch traffic trend comparisons and AI insights.
   */
  async getTrendsData(params) {
    const response = await api.get('/api/v1/trends', { params })
    return response.data
  },

  /**
   * Fetch forecast timeline for a specific road name.
   */
  async getTrendsForecast(roadName, date) {
    const response = await api.get('/api/v1/trends/forecast', {
      params: { road_name: roadName, date }
    })
    return response.data
  }
}
