const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms))

/** Placeholder analytics service — mock data only */
export const analyticsService = {
  async getTrafficTrends() {
    await delay()
    return { series: [], summary: {} }
  },
}
