const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms))

/** Placeholder alert service — mock data only */
export const alertService = {
  async getAlerts() {
    await delay()
    return []
  },
}
