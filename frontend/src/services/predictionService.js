import { api } from './api'

export const predictionService = {
  /**
   * Get list of unique roads available for prediction.
   */
  async getAvailableRoads() {
    const response = await api.get('/api/prediction/roads')
    return response.data
  },

  /**
   * Get 24-hour traffic and congestion forecast.
   */
  async getForecast(roadName, dateStr) {
    const response = await api.get('/api/prediction/forecast', {
      params: {
        road_name: roadName,
        date: dateStr
      }
    })
    return response.data
  },

  /**
   * Legacy method used by Dashboard to show a summary prediction metrics.
   * Leverages real model predictions for a default road (e.g. 'A1').
   */
  async getCongestionForecast() {
    try {
      const roads = await this.getAvailableRoads()
      const defaultRoad = roads.includes('A1') ? 'A1' : roads[0]
      if (defaultRoad) {
        const today = new Date().toISOString().split('T')[0]
        const data = await this.getForecast(defaultRoad, today)
        return {
          confidence: data.confidence,
          peakHour: data.peak_hour,
          delayMinutes: data.estimated_delay_minutes,
          trends: data.forecast
        }
      }
    } catch (e) {
      console.warn("Dashboard prediction fetch failed, using fallback:", e)
    }
    // Fallback in case of server/model not fully initialized
    return { confidence: 0.88, peakHour: '17:00', delayMinutes: 6, trends: [] }
  },

  /**
   * Get aggregated prediction insights and reports
   */
  async getTrafficPredictionReports(params) {
    const response = await api.get('/api/v1/reports/traffic', { params })
    return response.data
  },

  /**
   * Generate and archive a custom traffic report in the backend.
   */
  async generateTrafficReport(payload) {
    const response = await api.post('/api/v1/reports/generate', payload)
    return response.data
  },

  /**
   * Get list of previously generated reports for this user.
   */
  async getTrafficReportsHistory() {
    const response = await api.get('/api/v1/reports/history')
    return response.data
  },

  /**
   * Delete a specific report from history.
   */
  async deleteTrafficReport(reportId) {
    const response = await api.delete(`/api/v1/reports/${reportId}`)
    return response.data
  },

  /**
   * Get the download absolute URL for a specific report.
   */
  getDownloadReportUrl(reportId) {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    return `${baseUrl}/api/v1/reports/${reportId}/download`
  },

  /**
   * Get 30m - 3h congestion forecasting workflow
   */
  async getCongestionForecastWorkflow(roadName, dateStr) {
    const response = await api.get('/api/v1/forecast/congestion', {
      params: {
        road_name: roadName,
        date: dateStr
      }
    })
    return response.data
  },

  /**
   * Get route recommendations between two points
   */
  async recommendRoutes(sourceRoad, destRoad, preference = "Fastest", weather = "Clear", roadCondition = "Excellent") {
    const response = await api.post('/api/v1/routes/recommend', {
      source_road: sourceRoad,
      dest_road: destRoad,
      preference,
      weather,
      road_condition: roadCondition
    })
    return response.data
  },

  /**
   * Estimate travel time metrics
   */
  async estimateTravelTime(distanceKm, congestionLevel, roadType = "Major", weather = "Clear", roadCondition = "Excellent") {
    const response = await api.post('/api/v1/routes/travel-time', {
      distance_km: distanceKm,
      congestion_level: congestionLevel,
      road_type: roadType,
      weather,
      road_condition: roadCondition
    })
    return response.data
  },

  /**
   * Get current hour congestion status of all roads for map visualization
   */
  async getMonitoringStatus() {
    const response = await api.get('/api/v1/forecast/monitoring-status')
    return response.data
  },

  /**
   * Get real-time traffic flow segment speed, limit and delay from external TomTom API.
   */
  async getLiveTrafficFlow(latitude, longitude, roadName) {
    const response = await api.get('/api/v1/traffic/live-flow', {
      params: {
        latitude,
        longitude,
        road_name: roadName
      }
    })
    return response.data
  }
}
