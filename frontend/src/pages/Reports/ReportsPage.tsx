import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Download, Sliders, RefreshCw, AlertCircle,
  Clock, Shield, X, Play, Eye
} from 'lucide-react'
import { reportService } from '../../services/reportService'
import { useAuth } from '../../hooks/useAuth'

const REPORT_TYPES = ['Daily Report', 'Weekly Report', 'Monthly Report', 'Custom Report']
const REGIONS = ['All', 'Karnataka']
const ROAD_TYPES = ['All', 'Major', 'Minor']

export function ReportsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  // States
  const [loading, setLoading] = useState<boolean>(true)
  const [reports, setReports] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [selectedReport, setSelectedReport] = useState<any>(null)
  
  const [generating, setGenerating] = useState<boolean>(false)
  const [downloading, setDownloading] = useState<string | null>(null)

  // Report Creation Form state
  const [form, setForm] = useState({
    name: 'Daily Traffic Performance Digest',
    reportType: 'Daily Report',
    startDate: '',
    endDate: '',
    region: 'All',
    roadType: 'All'
  })

  // Autofill name based on choices
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    setForm(prev => ({
      ...prev,
      name: `${prev.reportType} - ${prev.region === 'All' ? 'All Regions' : prev.region} (${today})`
    }))
  }, [form.reportType, form.region])

  const loadReportsData = async () => {
    setLoading(true)
    try {
      const [listData, summaryData] = await Promise.all([
        reportService.getReports(),
        reportService.getSummary()
      ])
      setReports(listData)
      setSummary(summaryData)
    } catch (error) {
      console.error('Failed to load reports:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReportsData()
  }, [])

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault()
    setGenerating(true)
    try {
      const payload = {
        name: form.name,
        report_type: form.reportType,
        start_date: form.startDate || undefined,
        end_date: form.endDate || undefined,
        region: form.region,
        road_type: form.roadType,
        format: 'PDF' // default saved format, but download handles other extensions dynamically
      }
      await reportService.generateReport(payload)
      await loadReportsData()
      alert('Traffic Report compiled and archived successfully!')
    } catch (error) {
      console.error('Failed to generate report:', error)
    } finally {
      setGenerating(false)
    }
  }

  const handleDownloadFile = async (reportId: number, format: 'PDF' | 'CSV' | 'Excel') => {
    setDownloading(`${reportId}-${format}`)
    try {
      let blob;
      let extension = '';
      let mimeType = '';

      if (format === 'PDF') {
        blob = await reportService.downloadPdf(reportId)
        extension = 'pdf'
        mimeType = 'application/pdf'
      } else if (format === 'CSV') {
        blob = await reportService.downloadCsv(reportId)
        extension = 'csv'
        mimeType = 'text/csv'
      } else {
        blob = await reportService.downloadExcel(reportId)
        extension = 'xlsx'
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }

      const file = new Blob([blob], { type: mimeType })
      const fileURL = URL.createObjectURL(file)
      const downloadAnchor = document.createElement('a')
      downloadAnchor.href = fileURL
      downloadAnchor.setAttribute('download', `TrafficReport_Digest_${reportId}.${extension}`)
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.remove()
      URL.revokeObjectURL(fileURL)
    } catch (error) {
      console.error('Export download failed:', error)
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="min-h-screen bg-tv-bg p-6 text-tv-text">
      {/* Header Banner */}
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-tv-border pb-6 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-tv-primary">
            <FileText className="h-4 w-4" />
            AI Analytics Reporting
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-tv-text">AI Reports & Digests</h1>
          <p className="mt-1 text-sm text-tv-muted">
            Generate and export comprehensive PDF, Excel, and CSV digests of traffic volume, predictions, and recommendations.
          </p>
        </div>

        <button
          onClick={loadReportsData}
          className="flex items-center gap-2 rounded-xl border border-tv-border bg-black/[0.02] px-4 py-2.5 text-sm font-medium text-tv-text transition hover:bg-black/[0.03] hover:text-tv-text"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Sync Reports
        </button>
      </div>

      {/* KPI Counters */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-tv-border bg-tv-surface/40 p-4.5">
          <span className="text-xs font-semibold text-tv-muted uppercase tracking-wider">Total Generated Reports</span>
          <div className="mt-2 text-2xl font-bold text-tv-text">{summary?.total_reports || 0}</div>
        </div>
        <div className="rounded-2xl border border-tv-border bg-tv-surface/40 p-4.5">
          <span className="text-xs font-semibold text-tv-muted uppercase tracking-wider text-tv-primary">Daily Digests</span>
          <div className="mt-2 text-2xl font-bold text-tv-primary">{summary?.daily_count || 0}</div>
        </div>
        <div className="rounded-2xl border border-tv-border bg-tv-surface/40 p-4.5">
          <span className="text-xs font-semibold text-tv-muted uppercase tracking-wider text-emerald-400">Weekly Summary Digests</span>
          <div className="mt-2 text-2xl font-bold text-emerald-500">{summary?.weekly_count || 0}</div>
        </div>
        <div className="rounded-2xl border border-tv-border bg-tv-surface/40 p-4.5">
          <span className="text-xs font-semibold text-tv-muted uppercase tracking-wider text-amber-400">Monthly Aggregations</span>
          <div className="mt-2 text-2xl font-bold text-amber-500">{summary?.monthly_count || 0}</div>
        </div>
      </div>

      {/* Primary Layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left Column: Generate Report Form (Admin Only) */}
        <div className="rounded-2xl border border-tv-border bg-tv-surface p-5 shadow-xl xl:col-span-1 h-fit">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-tv-text">
            <Sliders className="h-4 w-4 text-tv-primary" />
            Generate New AI Report
          </h3>

          {isAdmin ? (
            <form onSubmit={handleCreateReport} className="flex flex-col gap-4">
              {/* Report Type */}
              <div>
                <label className="block text-xs font-semibold text-tv-muted uppercase tracking-wider mb-1.5">Report Type</label>
                <select
                  value={form.reportType}
                  onChange={(e) => setForm(prev => ({ ...prev, reportType: e.target.value }))}
                  className="w-full rounded-xl border border-tv-border bg-tv-surface px-3 py-2 text-sm text-tv-text focus:outline-none"
                >
                  {REPORT_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Region */}
              <div>
                <label className="block text-xs font-semibold text-tv-muted uppercase tracking-wider mb-1.5">Region</label>
                <select
                  value={form.region}
                  onChange={(e) => setForm(prev => ({ ...prev, region: e.target.value }))}
                  className="w-full rounded-xl border border-tv-border bg-tv-surface px-3 py-2 text-sm text-tv-text focus:outline-none"
                >
                  {REGIONS.map(reg => (
                    <option key={reg} value={reg}>{reg}</option>
                  ))}
                </select>
              </div>

              {/* Road Type */}
              <div>
                <label className="block text-xs font-semibold text-tv-muted uppercase tracking-wider mb-1.5">Road Type</label>
                <select
                  value={form.roadType}
                  onChange={(e) => setForm(prev => ({ ...prev, roadType: e.target.value }))}
                  className="w-full rounded-xl border border-tv-border bg-tv-surface px-3 py-2 text-sm text-tv-text focus:outline-none"
                >
                  {ROAD_TYPES.map(rt => (
                    <option key={rt} value={rt}>{rt}</option>
                  ))}
                </select>
              </div>

              {/* Date Filters (Required for custom reports) */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-tv-muted uppercase tracking-wider mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full rounded-xl border border-tv-border bg-tv-surface px-3 py-1.5 text-xs text-tv-text focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-tv-muted uppercase tracking-wider mb-1.5">End Date</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full rounded-xl border border-tv-border bg-tv-surface px-3 py-1.5 text-xs text-tv-text focus:outline-none"
                  />
                </div>
              </div>

              {/* Report Name */}
              <div>
                <label className="block text-xs font-semibold text-tv-muted uppercase tracking-wider mb-1.5">Report Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-xl border border-tv-border bg-tv-surface px-3.5 py-2 text-sm text-tv-text focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={generating}
                className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-tv-primary py-2.5 text-sm font-semibold text-tv-text shadow-lg shadow-tv-primary/20 hover:bg-blue-500 transition disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                {generating ? 'Compiling Statistics...' : 'Compile & Save Report'}
              </button>
            </form>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-6 border border-tv-border bg-black/[0.01] rounded-2xl">
              <Shield className="h-8 w-8 text-tv-muted mb-2" />
              <span className="text-xs font-semibold text-tv-text">Generate Restricted</span>
              <p className="text-[11px] text-tv-muted mt-1 max-w-[200px]">
                Report compilation permissions are restricted to Administrative roles.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Generated Reports list */}
        <div className="rounded-2xl border border-tv-border bg-tv-surface p-5 shadow-xl xl:col-span-2">
          <h3 className="mb-4 text-sm font-bold text-tv-text uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-tv-primary" />
            Recent Reports Archive
          </h3>

          {loading && reports.length === 0 ? (
            <div className="flex h-80 flex-col items-center justify-center gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-tv-primary" />
              <span className="text-sm font-medium text-tv-muted">Loading reports archive...</span>
            </div>
          ) : reports.length === 0 ? (
            <div className="flex h-80 flex-col items-center justify-center text-center">
              <AlertCircle className="h-8 w-8 text-tv-muted mb-2" />
              <h4 className="font-bold text-tv-text text-sm">Reports Archive Empty</h4>
              <p className="text-xs text-tv-muted mt-1 max-w-sm">
                No reports have been compiled yet. Use the compile manager on the left to create one.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {reports.map(rep => (
                <div
                  key={rep.id}
                  className="flex flex-col justify-between p-4.5 rounded-2xl border border-tv-border bg-black/[0.01] hover:bg-black/[0.02] transition sm:flex-row sm:items-center gap-4"
                >
                  <div>
                    <span className="text-[10px] font-bold text-tv-primary uppercase tracking-wider">{rep.report_type}</span>
                    <h4 className="text-sm font-bold text-tv-text mt-1 leading-tight">{rep.name}</h4>
                    <p className="text-[11px] text-tv-muted mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Compiled: {new Date(rep.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setSelectedReport(rep)}
                      className="flex items-center gap-1.5 rounded-lg border border-tv-border bg-black/[0.02] px-2.5 py-1.5 text-xs text-tv-text hover:text-tv-text transition"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Preview
                    </button>

                    <button
                      onClick={() => handleDownloadFile(rep.id, 'PDF')}
                      disabled={downloading === `${rep.id}-PDF`}
                      className="flex items-center gap-1 rounded-lg bg-red-500/10 border border-red-500/20 px-2 py-1.5 text-[10px] font-semibold text-red-400 hover:bg-red-500/20 transition disabled:opacity-40"
                    >
                      <Download className="h-3 w-3" />
                      {downloading === `${rep.id}-PDF` ? '...' : 'PDF'}
                    </button>

                    <button
                      onClick={() => handleDownloadFile(rep.id, 'Excel')}
                      disabled={downloading === `${rep.id}-Excel`}
                      className="flex items-center gap-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-1.5 text-[10px] font-semibold text-emerald-400 hover:bg-emerald-500/20 transition disabled:opacity-40"
                    >
                      <Download className="h-3 w-3" />
                      {downloading === `${rep.id}-Excel` ? '...' : 'Excel'}
                    </button>

                    <button
                      onClick={() => handleDownloadFile(rep.id, 'CSV')}
                      disabled={downloading === `${rep.id}-CSV`}
                      className="flex items-center gap-1 rounded-lg bg-slate-500/10 border border-tv-border px-2 py-1.5 text-[10px] font-semibold text-tv-text hover:bg-black/[0.03] transition disabled:opacity-40"
                    >
                      <Download className="h-3 w-3" />
                      {downloading === `${rep.id}-CSV` ? '...' : 'CSV'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Report Preview Drawer */}
      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
            <div className="absolute inset-0" onClick={() => setSelectedReport(null)} />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="relative h-full w-full max-w-xl border-l border-tv-border bg-tv-surface p-6 shadow-2xl overflow-y-auto flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="mb-6 flex items-center justify-between border-b border-tv-border pb-4">
                  <div>
                    <span className="text-[10px] font-bold text-tv-primary uppercase tracking-wider">{selectedReport.report_type} Preview</span>
                    <h3 className="text-base font-bold text-tv-text mt-1">{selectedReport.name}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="rounded-lg p-1.5 text-tv-muted hover:bg-black/[0.03] hover:text-tv-text"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Preview Content */}
                <div className="flex flex-col gap-6 text-xs text-tv-text">
                  {/* Metadata */}
                  <div className="rounded-xl border border-tv-border bg-black/[0.01] p-3 text-tv-muted">
                    <span className="font-bold text-tv-text block mb-1">Compilation Metadata</span>
                    Generated At: <span className="text-tv-text font-mono">{selectedReport.summary_data.metadata.generated_at}</span>
                    <br/>
                    Applied Filters: <span className="text-tv-text font-mono">{JSON.stringify(selectedReport.summary_data.metadata.filters)}</span>
                  </div>

                  {/* Executive Summary */}
                  <div>
                    <span className="block text-xs font-semibold text-tv-muted uppercase tracking-wider mb-2">Executive Summary</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="rounded-xl bg-tv-surface/60 p-3 border border-tv-border">
                        <span className="text-tv-muted block text-[10px] uppercase">Total Vehicles</span>
                        <span className="text-sm font-bold text-tv-text mt-0.5 block">
                          {selectedReport.summary_data.kpis.total_traffic_count.toLocaleString()}
                        </span>
                      </div>
                      <div className="rounded-xl bg-tv-surface/60 p-3 border border-tv-border">
                        <span className="text-tv-muted block text-[10px] uppercase">Avg Density</span>
                        <span className="text-sm font-bold text-tv-text mt-0.5 block">
                          {selectedReport.summary_data.kpis.average_congestion_score}%
                        </span>
                      </div>
                      <div className="rounded-xl bg-tv-surface/60 p-3 border border-tv-border">
                        <span className="text-tv-muted block text-[10px] uppercase">Peak Hour</span>
                        <span className="text-sm font-bold text-amber-500 mt-0.5 block">
                          {selectedReport.summary_data.kpis.peak_hour}
                        </span>
                      </div>
                      <div className="rounded-xl bg-tv-surface/60 p-3 border border-tv-border">
                        <span className="text-tv-muted block text-[10px] uppercase">Travel Time</span>
                        <span className="text-sm font-bold text-tv-text mt-0.5 block">
                          {selectedReport.summary_data.kpis.average_travel_time_minutes}m
                        </span>
                      </div>
                      <div className="rounded-xl bg-tv-surface/60 p-3 border border-tv-border">
                        <span className="text-tv-muted block text-[10px] uppercase">Accuracy Index</span>
                        <span className="text-sm font-bold text-emerald-400 mt-0.5 block">
                          {selectedReport.summary_data.kpis.prediction_accuracy_pct}%
                        </span>
                      </div>
                      <div className="rounded-xl bg-tv-surface/60 p-3 border border-tv-border">
                        <span className="text-tv-muted block text-[10px] uppercase">Monitored Roads</span>
                        <span className="text-sm font-bold text-tv-text mt-0.5 block">
                          {selectedReport.summary_data.kpis.total_roads_monitored}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Hotspots */}
                  <div>
                    <span className="block text-xs font-semibold text-tv-muted uppercase tracking-wider mb-2">Segment Hotspots</span>
                    <div className="flex flex-col gap-2 bg-tv-surface/40 border border-tv-border p-3.5 rounded-xl">
                      <div>
                        <span className="text-tv-muted block text-[10px]">MOST CONGESTED segments</span>
                        <span className="text-tv-text font-bold text-sm mt-0.5 block">
                          {selectedReport.summary_data.hotspots.most_congested_roads.join(', ') || 'None'}
                        </span>
                      </div>
                      <div className="mt-2.5">
                        <span className="text-tv-muted block text-[10px]">LEAST CONGESTED segments</span>
                        <span className="text-tv-text font-bold text-sm mt-0.5 block">
                          {selectedReport.summary_data.hotspots.least_congested_roads.join(', ') || 'None'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Incidents & Advisories */}
                  <div>
                    <span className="block text-xs font-semibold text-tv-muted uppercase tracking-wider mb-2">Safety & Advisories Summary</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-tv-surface/60 p-3 border border-tv-border">
                        <span className="text-tv-muted block text-[10px] uppercase">Total Incident Alerts</span>
                        <span className="text-sm font-bold text-tv-text mt-0.5 block">
                          {selectedReport.summary_data.alerts.total_registered}
                        </span>
                      </div>
                      <div className="rounded-xl bg-tv-surface/60 p-3 border border-tv-border">
                        <span className="text-tv-muted block text-[10px] uppercase">AI Decisions Generated</span>
                        <span className="text-sm font-bold text-tv-text mt-0.5 block">
                          {selectedReport.summary_data.recommendations.total_generated}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Download Actions */}
              <div className="mt-8 border-t border-tv-border pt-4.5">
                <span className="block text-xs font-semibold text-tv-muted uppercase tracking-wider mb-2.5">Download File</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleDownloadFile(selectedReport.id, 'PDF')}
                    disabled={downloading !== null}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 py-2.5 text-xs font-semibold hover:bg-red-500/20 transition disabled:opacity-40"
                  >
                    <Download className="h-4 w-4" /> PDF
                  </button>
                  <button
                    onClick={() => handleDownloadFile(selectedReport.id, 'Excel')}
                    disabled={downloading !== null}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 py-2.5 text-xs font-semibold hover:bg-emerald-500/20 transition disabled:opacity-40"
                  >
                    <Download className="h-4 w-4" /> Excel
                  </button>
                  <button
                    onClick={() => handleDownloadFile(selectedReport.id, 'CSV')}
                    disabled={downloading !== null}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-tv-border bg-black/[0.02] text-tv-text py-2.5 text-xs font-semibold hover:bg-black/[0.03] transition disabled:opacity-40"
                  >
                    <Download className="h-4 w-4" /> CSV
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
