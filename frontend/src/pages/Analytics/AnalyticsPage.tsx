import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import {
  FileText, Download, Calendar, MapPin, Gauge, LayoutGrid,
  Clock, BarChart3, TrendingUp, Info, Activity, ShieldAlert, Sparkles, RefreshCw, Trash2
} from 'lucide-react'
import { predictionService } from '../../services/predictionService'
import { api } from '../../services/api'

export function AnalyticsPage() {
  const [reportData, setReportData] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [exporting, setExporting] = useState<boolean>(false)

  // Filters state
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [selectedRegion, setSelectedRegion] = useState<string>('All')
  const [selectedRoadType, setSelectedRoadType] = useState<string>('All')
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('All')

  // Custom Report Generation states
  const [history, setHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState<boolean>(true)
  const [reportName, setReportName] = useState<string>('')
  const [reportType, setReportType] = useState<string>('General Traffic Flow Summary')
  const [reportFormat, setReportFormat] = useState<string>('HTML')
  const [generating, setGenerating] = useState<boolean>(false)

  // Pre-fill report name dynamically when filters change
  useEffect(() => {
    const formattedRegion = selectedRegion === 'All' ? 'All Regions' : selectedRegion
    const datePart = selectedDate || 'All Dates'
    setReportName(`Traffic Report (${formattedRegion} - ${datePart})`)
  }, [selectedDate, selectedRegion])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const data = await predictionService.getTrafficPredictionReports({
        date: selectedDate,
        region: selectedRegion,
        road_type: selectedRoadType,
        time_range: selectedTimeRange
      })
      setReportData(data)
    } catch (error) {
      console.error('Failed to fetch prediction reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    setHistoryLoading(true)
    try {
      const data = await predictionService.getTrafficReportsHistory()
      setHistory(data)
    } catch (error) {
      console.error('Failed to fetch reports history:', error)
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [selectedDate, selectedRegion, selectedRoadType, selectedTimeRange])

  useEffect(() => {
    fetchHistory()
  }, [])

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reportName.trim()) {
      alert('Please enter a report name.')
      return
    }
    setGenerating(true)
    try {
      await predictionService.generateTrafficReport({
        name: reportName,
        report_type: reportType,
        date: selectedDate,
        region: selectedRegion,
        road_type: selectedRoadType,
        time_range: selectedTimeRange,
        format: reportFormat
      })
      
      // Clear custom name changes and reload history
      const formattedRegion = selectedRegion === 'All' ? 'All Regions' : selectedRegion
      const datePart = selectedDate || 'All Dates'
      setReportName(`Traffic Report (${formattedRegion} - ${datePart})`)
      await fetchHistory()
      alert('Report generated and added to archive history successfully!')
    } catch (error) {
      console.error('Failed to generate report:', error)
      alert('Failed to generate report. Please verify connection to backend.')
    } finally {
      setGenerating(false)
    }
  }

  const handleDeleteReport = async (id: number) => {
    if (!confirm('Are you sure you want to permanently delete this report from archive history?')) return
    try {
      await predictionService.deleteTrafficReport(id)
      setHistory(prev => prev.filter(r => r.id !== id))
    } catch (error) {
      console.error('Failed to delete report:', error)
      alert('Failed to delete report.')
    }
  }

  const downloadReportFile = async (reportId: number, format: string, name: string) => {
    try {
      const response = await api.get(`/api/v1/reports/${reportId}/download`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      const extension = format.toLowerCase() === 'csv' ? 'csv' : 'html'
      link.setAttribute('download', `${name.replace(/\s+/g, '_')}.${extension}`)
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download report:', error)
      alert('Failed to download report file.')
    }
  }

  const viewReportHtml = async (reportId: number) => {
    try {
      const response = await api.get(`/api/v1/reports/${reportId}/download`, {
        responseType: 'text'
      })
      const newWindow = window.open()
      if (newWindow) {
        newWindow.document.write(response.data)
        newWindow.document.close()
      } else {
        alert('Pop-up blocker is enabled. Please allow pop-ups to view printable report preview.')
      }
    } catch (error) {
      console.error('Failed to preview report:', error)
      alert('Failed to load printable report preview.')
    }
  }

  // Real CSV Export
  const handleExportCSV = () => {
    if (!reportData) return
    setExporting(true)
    
    // Create CSV content starting with summary metrics
    let csvContent = "data:text/csv;charset=utf-8,"
    csvContent += "TRAFFICVISION AI - PREDICTION REPORT\n"
    csvContent += `Generated On,${new Date().toISOString()}\n`
    csvContent += `Filters: Date=${selectedDate}, Region=${selectedRegion}, Road Type=${selectedRoadType}, Time Range=${selectedTimeRange}\n\n`
    
    csvContent += "REPORT SUMMARY METRICS\n"
    csvContent += `Total Predictions,${reportData.total_predictions}\n`
    csvContent += `Average Traffic Volume (vehicles/hr),${reportData.average_traffic_volume}\n`
    csvContent += `Average Congestion Index (%),${reportData.average_congestion_score}\n`
    csvContent += `Peak Hour,${reportData.peak_hour}\n`
    csvContent += `Lowest Hour,${reportData.lowest_traffic_hour}\n`
    csvContent += `Model Accuracy (%),${reportData.prediction_accuracy}%\n\n`

    csvContent += "24-HOUR HOURLY FLOW FORECAST TRENDS\n"
    csvContent += "Hour,Actual Volume (vehicles/hr),Predicted Volume (vehicles/hr),Congestion Index (%)\n"
    
    reportData.hourly_trends.forEach((row: any) => {
      csvContent += `${row.label},${row.actual},${row.predicted},${row.congestion}\n`
    })

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `TrafficVision_Prediction_Report_${selectedDate}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    setTimeout(() => setExporting(false), 600)
  }

  // Mock PDF Export
  const handleExportPDF = () => {
    setExporting(true)
    setTimeout(() => {
      alert("PDF report layout compiled successfully! Downloading 'TrafficVision_Prediction_Report.pdf' (Mocked file download).")
      setExporting(false)
    }, 1000)
  }

  // Helper to color accuracy values
  const getAccuracyColor = (pct: number) => {
    if (pct >= 85) return 'text-tv-emerald bg-tv-emerald/10 border-tv-emerald/20'
    if (pct >= 70) return 'text-tv-orange bg-tv-orange/10 border-tv-orange/20'
    return 'text-red-400 bg-red-500/10 border-red-500/20'
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  } as const

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80 } }
  } as const

  return (
    <div className="space-y-6 pb-12">
      {/* Title & Actions Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-tv-text flex items-center gap-2">
            <FileText className="h-7 w-7 text-tv-primary" />
            Traffic Prediction Reports
          </h1>
          <p className="text-tv-muted mt-1">
            Aggregate machine learning insights, model comparisons, and traffic distribution reports.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2.5 self-end sm:self-center">
          <button
            onClick={handleExportCSV}
            disabled={loading || exporting}
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-tv-text transition-all hover:bg-white/[0.08] disabled:opacity-50 cursor-pointer"
          >
            <Download className="h-4 w-4 text-tv-emerald" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportPDF}
            disabled={loading || exporting}
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-tv-text transition-all hover:bg-white/[0.08] disabled:opacity-50 cursor-pointer"
          >
            <FileText className="h-4 w-4 text-tv-primary" />
            <span>{exporting ? 'Generating PDF...' : 'Export PDF'}</span>
          </button>
        </div>
      </div>

      {/* Filters and Report Generator Panels Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Prediction Filters Panel */}
        <div className="lg:col-span-2 bg-tv-surface/40 border border-white/[0.06] p-5 rounded-2xl backdrop-blur-md flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-tv-text uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-tv-primary" />
              Prediction Filters
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Date Picker */}
              <div className="space-y-1.5">
                <label className="text-xs text-tv-muted">Target Date</label>
                <div className="flex items-center gap-2 bg-tv-surface border border-white/[0.08] px-3 py-2.5 rounded-xl">
                  <Calendar className="h-4 w-4 text-tv-primary" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-transparent text-sm text-tv-text focus:outline-none cursor-pointer w-full"
                  />
                </div>
              </div>

              {/* Region Filter */}
              <div className="space-y-1.5">
                <label className="text-xs text-tv-muted">Region</label>
                <div className="flex items-center gap-2 bg-tv-surface border border-white/[0.08] px-3 py-2.5 rounded-xl">
                  <MapPin className="h-4 w-4 text-tv-primary" />
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="bg-transparent text-sm text-tv-text focus:outline-none cursor-pointer w-full"
                  >
                    <option value="All">All Regions</option>
                    {reportData?.regions?.map((reg: string) => (
                      <option key={reg} value={reg}>
                        {reg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Road Type Filter */}
              <div className="space-y-1.5">
                <label className="text-xs text-tv-muted">Road Category</label>
                <div className="flex items-center gap-2 bg-tv-surface border border-white/[0.08] px-3 py-2.5 rounded-xl">
                  <LayoutGrid className="h-4 w-4 text-tv-primary" />
                  <select
                    value={selectedRoadType}
                    onChange={(e) => setSelectedRoadType(e.target.value)}
                    className="bg-transparent text-sm text-tv-text focus:outline-none cursor-pointer w-full"
                  >
                    <option value="All">All Road Types</option>
                    <option value="Major">Major Roads (A-Roads/Motorways)</option>
                    <option value="Minor">Minor Roads</option>
                  </select>
                </div>
              </div>

              {/* Time Range Filter */}
              <div className="space-y-1.5">
                <label className="text-xs text-tv-muted">Time Window</label>
                <div className="flex items-center gap-2 bg-tv-surface border border-white/[0.08] px-3 py-2.5 rounded-xl">
                  <Clock className="h-4 w-4 text-tv-primary" />
                  <select
                    value={selectedTimeRange}
                    onChange={(e) => setSelectedTimeRange(e.target.value)}
                    className="bg-transparent text-sm text-tv-text focus:outline-none cursor-pointer w-full"
                  >
                    <option value="All">24-Hour Cycle</option>
                    <option value="Morning">Morning Peak (06:00 - 11:00)</option>
                    <option value="Afternoon">Afternoon Flow (12:00 - 16:00)</option>
                    <option value="Evening">Evening Peak (17:00 - 21:00)</option>
                    <option value="Night">Night Off-Peak (22:00 - 05:00)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Report Generator Control Card */}
        <div className="bg-tv-surface/40 border border-white/[0.06] p-5 rounded-2xl backdrop-blur-md flex flex-col justify-between">
          <h4 className="text-xs font-bold text-tv-text uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-tv-primary" />
            Archive Custom Report
          </h4>
          <form onSubmit={handleGenerateReport} className="space-y-3">
            {/* Custom Report Title */}
            <div className="space-y-1">
              <label className="text-[10px] text-tv-muted uppercase font-semibold">Report Title</label>
              <input
                type="text"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="Enter report title..."
                className="w-full bg-tv-surface border border-white/[0.08] px-3 py-2 rounded-xl text-xs text-tv-text focus:outline-none focus:border-tv-primary/50"
              />
            </div>

            {/* Report Type */}
            <div className="space-y-1">
              <label className="text-[10px] text-tv-muted uppercase font-semibold">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full bg-tv-surface border border-white/[0.08] px-3 py-2 rounded-xl text-xs text-tv-text focus:outline-none focus:border-tv-primary/50 cursor-pointer"
              >
                <option value="General Traffic Flow Summary">General Traffic Flow Summary</option>
                <option value="Congestion & Bottlenecks Analysis">Congestion & Bottlenecks Analysis</option>
                <option value="Peak Hour Saturation">Peak Hour Saturation</option>
                <option value="Vehicle Classification Breakdown">Vehicle Classification Breakdown</option>
              </select>
            </div>

            {/* Export Format */}
            <div className="space-y-1">
              <label className="text-[10px] text-tv-muted uppercase font-semibold">Format</label>
              <select
                value={reportFormat}
                onChange={(e) => setReportFormat(e.target.value)}
                className="w-full bg-tv-surface border border-white/[0.08] px-3 py-2 rounded-xl text-xs text-tv-text focus:outline-none focus:border-tv-primary/50 cursor-pointer"
              >
                <option value="HTML">HTML printable layout (PDF conversion)</option>
                <option value="CSV">CSV Spreadsheet</option>
              </select>
            </div>

            {/* Generate Button */}
            <button
              type="submit"
              disabled={generating}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-tv-primary px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-blue-600 disabled:opacity-50 cursor-pointer mt-1"
            >
              {generating ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Compiling report...</span>
                </>
              ) : (
                <>
                  <FileText className="h-3.5 w-3.5" />
                  <span>Generate &amp; Archive Report</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <div key="loading" className="flex h-[45vh] w-full items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="h-9 w-9 animate-spin text-tv-primary" />
              <span className="text-sm font-medium text-tv-muted">Analyzing dataset and compiling predictions…</span>
            </div>
          </div>
        ) : reportData ? (
          <motion.div
            key="content"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            {/* KPI Metrics Cards Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
              <motion.div variants={cardVariants} className="tv-glass p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-tv-muted uppercase tracking-wider">Total Runs</p>
                  <h3 className="text-2xl font-bold mt-1 text-tv-text">{reportData.total_predictions.toLocaleString()}</h3>
                  <p className="text-xs text-tv-muted mt-1">Aggregated indices</p>
                </div>
                <div className="p-3 bg-tv-primary/10 text-tv-primary border border-tv-primary/20 rounded-xl">
                  <BarChart3 className="h-5 w-5" />
                </div>
              </motion.div>

              <motion.div variants={cardVariants} className="tv-glass p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-tv-muted uppercase tracking-wider">Avg Traffic Flow</p>
                  <h3 className="text-2xl font-bold mt-1 text-tv-text">{reportData.average_traffic_volume.toLocaleString()}</h3>
                  <p className="text-xs text-tv-muted mt-1">Vehicles per hour</p>
                </div>
                <div className="p-3 bg-tv-emerald/10 text-tv-emerald border border-tv-emerald/20 rounded-xl">
                  <Gauge className="h-5 w-5" />
                </div>
              </motion.div>

              <motion.div variants={cardVariants} className="tv-glass p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-tv-muted uppercase tracking-wider">Avg Congestion</p>
                  <h3 className="text-2xl font-bold mt-1 text-tv-text">{reportData.average_congestion_score}%</h3>
                  <p className="text-xs text-tv-muted mt-1">Road capacity index</p>
                </div>
                <div className="p-3 bg-tv-orange/10 text-tv-orange border border-tv-orange/20 rounded-xl">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </motion.div>

              <motion.div variants={cardVariants} className="tv-glass p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-tv-muted uppercase tracking-wider">Peak Hour</p>
                  <h3 className="text-2xl font-bold mt-1 text-tv-text">{reportData.peak_hour}</h3>
                  <p className="text-xs text-tv-muted mt-1">Lowest at {reportData.lowest_traffic_hour}</p>
                </div>
                <div className="p-3 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl">
                  <Clock className="h-5 w-5" />
                </div>
              </motion.div>

              <motion.div variants={cardVariants} className="tv-glass p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-tv-muted uppercase tracking-wider">Accuracy Rating</p>
                  <h3 className="text-2xl font-bold mt-1 text-tv-text">{reportData.prediction_accuracy}%</h3>
                  <p className="text-xs text-tv-muted mt-1">XGBoost cross R²</p>
                </div>
                <div className={`p-3 rounded-xl border ${getAccuracyColor(reportData.prediction_accuracy)}`}>
                  <Sparkles className="h-5 w-5" />
                </div>
              </motion.div>
            </div>

            {/* Charts Visual Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              
              {/* Chart 1: Line Chart - Historical vs Predicted Traffic */}
              <motion.div variants={cardVariants} className="tv-glass p-6 rounded-2xl">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-tv-text flex items-center gap-1.5">
                    <Activity className="h-4.5 w-4.5 text-tv-primary" />
                    Historical vs Predicted Traffic Comparison
                  </h3>
                  <p className="text-xs text-tv-muted">Comparison of historical observed volumes vs model predictions</p>
                </div>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reportData.hourly_trends} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.02)" vertical={false} />
                      <XAxis dataKey="label" stroke="var(--color-tv-muted)" fontSize={10} tickLine={false} />
                      <YAxis stroke="var(--color-tv-muted)" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(30, 41, 59, 0.95)',
                          borderColor: 'rgba(255, 255, 255, 0.08)',
                          borderRadius: '12px',
                          color: '#f8fafc',
                          fontSize: '11px'
                        }}
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" fontSize={11} wrapperStyle={{ fontSize: '11px' }} />
                      <Line type="monotone" dataKey="actual" name="Historical Flow" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                      <Line type="monotone" dataKey="predicted" name="Predicted Flow" stroke="#2563eb" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Chart 2: Area Chart - Congestion Index Progression */}
              <motion.div variants={cardVariants} className="tv-glass p-6 rounded-2xl">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-tv-text flex items-center gap-1.5">
                    <TrendingUp className="h-4.5 w-4.5 text-tv-orange" />
                    Hourly Congestion Index Trend
                  </h3>
                  <p className="text-xs text-tv-muted">Expected road congestion index (percentage capacity saturation)</p>
                </div>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={reportData.hourly_trends} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="congGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.02)" vertical={false} />
                      <XAxis dataKey="label" stroke="var(--color-tv-muted)" fontSize={10} tickLine={false} />
                      <YAxis stroke="var(--color-tv-muted)" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(30, 41, 59, 0.95)',
                          borderColor: 'rgba(255, 255, 255, 0.08)',
                          borderRadius: '12px',
                          color: '#f8fafc',
                          fontSize: '11px'
                        }}
                      />
                      <Area type="monotone" dataKey="congestion" name="Congestion Level (%)" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#congGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Chart 3: Bar Chart - High Congestion Roads */}
              <motion.div variants={cardVariants} className="tv-glass p-6 rounded-2xl">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-tv-text flex items-center gap-1.5">
                    <ShieldAlert className="h-4.5 w-4.5 text-red-400" />
                    Top Congested Monitored Roads
                  </h3>
                  <p className="text-xs text-tv-muted">Average congestion score index (%) across filtered criteria</p>
                </div>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.road_trends} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.02)" vertical={false} />
                      <XAxis dataKey="road" stroke="var(--color-tv-muted)" fontSize={10} tickLine={false} />
                      <YAxis stroke="var(--color-tv-muted)" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(30, 41, 59, 0.95)',
                          borderColor: 'rgba(255, 255, 255, 0.08)',
                          borderRadius: '12px',
                          color: '#f8fafc',
                          fontSize: '11px'
                        }}
                      />
                      <Bar dataKey="congestion" name="Avg Congestion (%)" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Chart 4: Pie Chart - Vehicle Distribution Split */}
              <motion.div variants={cardVariants} className="tv-glass p-6 rounded-2xl">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-tv-text flex items-center gap-1.5">
                    <LayoutGrid className="h-4.5 w-4.5 text-tv-emerald" />
                    Vehicle Classification Distribution
                  </h3>
                  <p className="text-xs text-tv-muted">Predicted volume share categorized by vehicle class type</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={reportData.vehicle_split}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {reportData.vehicle_split.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(30, 41, 59, 0.95)',
                            borderColor: 'rgba(255, 255, 255, 0.08)',
                            borderRadius: '12px',
                            color: '#f8fafc',
                            fontSize: '11px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 text-xs">
                    {reportData.vehicle_split.map((entry: any, idx: number) => {
                      const total = reportData.vehicle_split.reduce((sum: number, el: any) => sum + el.value, 0)
                      const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0'
                      return (
                        <div key={idx} className="flex items-center justify-between p-1.5 rounded-lg bg-white/[0.01] border border-white/[0.04]">
                          <span className="flex items-center gap-2 text-tv-muted">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
                            {entry.name}
                          </span>
                          <span className="font-bold text-tv-text">{pct}%</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* High Congestion Roads Summary Table */}
            <motion.div variants={cardVariants} className="tv-glass p-5 rounded-2xl">
              <h4 className="text-sm font-bold text-tv-text flex items-center gap-1.5 border-b border-white/[0.05] pb-3 mb-3">
                <Info className="h-4 w-4 text-tv-orange" />
                Critical Congestion Roads Overview
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-tv-muted border-b border-white/[0.06] pb-2">
                      <th className="py-2.5 font-semibold">Road Name</th>
                      <th className="py-2.5 font-semibold">Region Location</th>
                      <th className="py-2.5 font-semibold">Congestion Index</th>
                      <th className="py-2.5 font-semibold">Flow Rate Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.road_trends.map((item: any, idx: number) => {
                      const statusColor = item.congestion >= 60 ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-tv-orange bg-tv-orange/10 border-tv-orange/20'
                      const statusText = item.congestion >= 85 ? 'Critical (Blocked)' : (item.congestion >= 60 ? 'Heavy Delay' : 'Moderate')
                      return (
                        <tr key={idx} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 font-semibold text-tv-text">{item.road}</td>
                          <td className="py-3 text-tv-muted">{selectedRegion !== 'All' ? selectedRegion : 'United Kingdom'}</td>
                          <td className="py-3 font-bold text-tv-text">{item.congestion}%</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded border font-medium ${statusColor}`}>
                              {statusText}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Archived Reports History Panel */}
            <motion.div variants={cardVariants} className="tv-glass p-5 rounded-2xl">
              <div className="flex items-center justify-between border-b border-white/[0.05] pb-3 mb-4">
                <h4 className="text-sm font-bold text-tv-text flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-tv-primary" />
                  Archived Reports History
                </h4>
                <span className="text-[10px] bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 rounded text-tv-muted uppercase font-bold">
                  Saved on Cloud
                </span>
              </div>

              {historyLoading ? (
                <div className="text-center text-xs text-tv-muted py-6 flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-tv-primary" />
                  <span>Loading archived history...</span>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center text-xs text-tv-muted py-8 bg-white/[0.01] rounded-xl border border-white/[0.02]">
                  No reports generated yet. Use the tool above to generate one.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="text-tv-muted border-b border-white/[0.06] pb-2">
                        <th className="py-2.5 font-semibold">Report Name</th>
                        <th className="py-2.5 font-semibold">Report Type</th>
                        <th className="py-2.5 font-semibold">Filters</th>
                        <th className="py-2.5 font-semibold">Generated Date</th>
                        <th className="py-2.5 font-semibold">Format</th>
                        <th className="py-2.5 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((rep) => (
                        <tr key={rep.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 font-semibold text-tv-text">{rep.name}</td>
                          <td className="py-3 text-tv-muted">{rep.report_type}</td>
                          <td className="py-3 text-tv-muted">
                            Region: {rep.filters_applied?.region || 'All'}, 
                            Date: {rep.filters_applied?.date || 'All'}
                          </td>
                          <td className="py-3 text-tv-muted">
                            {new Date(rep.created_at).toLocaleString()}
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${
                              rep.format === 'CSV' 
                                ? 'bg-tv-emerald/10 text-tv-emerald border-tv-emerald/20' 
                                : 'bg-tv-primary/10 text-tv-primary border-tv-primary/20'
                            }`}>
                              {rep.format}
                            </span>
                          </td>
                          <td className="py-3 text-right space-x-2">
                            {rep.format === 'CSV' ? (
                              <button
                                onClick={() => downloadReportFile(rep.id, rep.format, rep.name)}
                                className="px-2.5 py-1 rounded bg-tv-emerald/10 text-tv-emerald hover:bg-tv-emerald/20 transition-colors font-medium border border-tv-emerald/20 cursor-pointer text-[10px]"
                              >
                                Download CSV
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => viewReportHtml(rep.id)}
                                  className="px-2.5 py-1 rounded bg-tv-primary/10 text-tv-primary hover:bg-tv-primary/20 transition-colors font-medium border border-tv-primary/20 cursor-pointer text-[10px]"
                                >
                                  View &amp; Print
                                </button>
                                <button
                                  onClick={() => downloadReportFile(rep.id, rep.format, rep.name)}
                                  className="px-2.5 py-1 rounded bg-white/5 text-tv-text hover:bg-white/10 transition-colors font-medium border border-white/10 cursor-pointer text-[10px]"
                                >
                                  Download HTML
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDeleteReport(rep.id)}
                              className="px-2.5 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors font-medium border border-red-500/20 cursor-pointer text-[10px]"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </motion.div>
        ) : (
          <div key="empty" className="tv-glass p-8 text-center text-tv-muted">
            Failed to load reporting data. Try adjusting your filters.
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AnalyticsPage
