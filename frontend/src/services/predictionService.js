const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms))

/** Placeholder prediction service — mock data only */
export const predictionService = {
  async getCongestionForecast() {
    await delay()
    return { confidence: 0.87, peakHour: '18:00', delayMinutes: 12, trends: [] }
  },
}
