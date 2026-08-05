import { api } from './api'

export const reportService = {
  async getReports() {
    const response = await api.get('/api/v1/reports')
    return response.data
  },

  async getSummary() {
    const response = await api.get('/api/v1/reports/summary')
    return response.data
  },

  async getDetail(id) {
    const response = await api.get(`/api/v1/reports/${id}`)
    return response.data
  },

  async generateReport(payload) {
    const response = await api.post('/api/v1/reports/generate', payload)
    return response.data
  },

  async downloadPdf(reportId, filters) {
    const response = await api.get('/api/v1/reports/export/pdf', {
      params: { report_id: reportId, ...filters },
      responseType: 'blob'
    })
    return response.data
  },

  async downloadCsv(reportId, filters) {
    const response = await api.get('/api/v1/reports/export/csv', {
      params: { report_id: reportId, ...filters },
      responseType: 'blob'
    })
    return response.data
  },

  async downloadExcel(reportId, filters) {
    const response = await api.get('/api/v1/reports/export/excel', {
      params: { report_id: reportId, ...filters },
      responseType: 'blob'
    })
    return response.data
  }
}
