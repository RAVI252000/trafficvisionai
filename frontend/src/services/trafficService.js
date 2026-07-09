const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms))

/**
 * Placeholder traffic data service.
 * Returns mock data — swap with Axios + REST endpoints later.
 */
export const trafficService = {
  async getLiveTraffic() {
    await delay()
    return {
      vehicleCount: 12847,
      density: 'moderate',
      congestionLevel: 34,
      averageSpeed: 42,
      roads: [],
    }
  },

  async getRoadStatus() {
    await delay()
    return []
  },
}
