import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import {
  Download, Clock, BarChart3, TrendingUp, Activity, ShieldAlert,
  Sparkles, RefreshCw, Shield, Settings, Sliders
} from 'lucide-react'
import { analyticsService } from '../../services/analyticsService'
import { useAuth } from '../../hooks/useAuth'

// Centralized filter options
const REGIONS = ['All', 'Karnataka']

const LOCAL_AUTHORITIES = ['All', 'BBMP (Bengaluru)']

const ROAD_TYPES = ['All', 'Major', 'Minor']
const TIME_PERIODS = ['All', 'Morning', 'Afternoon', 'Evening', 'Night']

export function AnalyticsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  // Loading & State
  const [loading, setLoading] = useState<boolean>(true)
  const [exporting, setExporting] = useState<boolean>(false)
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false)
  const [dashboardSettings, setDashboardSettings] = useState({
    defaultRegion: 'All',
    autoRefreshInterval: 'Off',
    dataRefreshedAt: new Date().toLocaleTimeString()
  })

  // Dynamic Filters State
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    region: 'All',
    localAuthority: 'All',
    roadType: 'All',
    roadName: '',
    timePeriod: 'All'
  })

  // Data State
  const [kpis, setKpis] = useState<any>(null)
  const [charts, setCharts] = useState<any>(null)

  // Fetch Dashboard and Charts data
  const fetchData = async () => {
    setLoading(true)
    try {
      const apiParams = {
        start_date: filters.startDate || undefined,
        end_date: filters.endDate || undefined,
        region: filters.region,
        local_authority: filters.localAuthority,
        road_type: filters.roadType,
        road_name: filters.roadName || undefined,
        time_period: filters.timePeriod
      }

      const [kpiRes, chartsRes] = await Promise.all([
        analyticsService.getDashboardKPIs(apiParams),
        analyticsService.getChartsData(apiParams)
      ])

      setKpis(kpiRes)
      setCharts(chartsRes)
      setDashboardSettings(prev => ({
        ...prev,
        dataRefreshedAt: new Date().toLocaleTimeString()
      }))
    } catch (error) {
      console.error('Failed to fetch analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [filters])

  // Handle filter resets
  const handleResetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      region: 'All',
      localAuthority: 'All',
      roadType: 'All',
      roadName: '',
      timePeriod: 'All'
    })
  }

  // Handle Excel/PDF exports
  const handleExport = async (format: 'PDF' | 'CSV') => {
    if (!isAdmin) return
    setExporting(true)
    // Simulate generation delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    setExporting(false)
    
    // Create client-side file download
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ kpis, charts, filters }, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute("href", dataStr)
    downloadAnchor.setAttribute("download", `TrafficVision_Analytics_Report_${filters.region}_${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  return (
    <div className="min-h-screen bg-tv-bg p-6 text-tv-text">
      {/* Header Banner */}
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-tv-border pb-6 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-tv-primary">
            <Activity className="h-4 w-4" />
            AI Traffic Analytics Engine
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-tv-text">System Insights & Analytics</h1>
          <p className="mt-1 text-sm text-tv-muted">
            Real-time urban capacity metrics, XGBoost ML accuracy indices, and dynamic vehicle trends analysis.
          </p>
        </div>

        {/* Action Controls based on Role */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 rounded-xl border border-tv-border bg-black/[0.02] px-4 py-2.5 text-sm font-medium text-tv-text transition hover:bg-black/[0.04] hover:text-tv-text"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {isAdmin ? (
            <>
              <button
                onClick={() => handleExport('CSV')}
                disabled={exporting || loading}
                className="flex items-center gap-2 rounded-xl bg-tv-primary px-4 py-2.5 text-sm font-semibold text-tv-text shadow-lg shadow-tv-primary/20 transition hover:bg-blue-500 hover:shadow-tv-primary/30 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                {exporting ? 'Exporting...' : 'Export Data (CSV)'}
              </button>
              <button
                onClick={() => setShowSettingsModal(true)}
                className="flex items-center justify-center rounded-xl border border-tv-border bg-black/[0.02] p-2.5 text-tv-text transition hover:bg-black/[0.04] hover:text-tv-text"
                title="Manage Dashboard Settings"
              >
                <Settings className="h-5 w-5" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-tv-border bg-black/[0.02] px-3.5 py-2 text-xs text-tv-muted" title="Exporting is restricted to administrators.">
              <Shield className="h-4 w-4 text-tv-muted" />
              Operator View Only
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Query Filter Panel */}
      <div className="mb-8 rounded-2xl border border-tv-border bg-tv-surface p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-tv-text">
            <Sliders className="h-4 w-4 text-tv-primary" />
            Dynamic Dashboard Filters
          </div>
          <button
            onClick={handleResetFilters}
            className="text-xs font-medium text-tv-primary hover:text-tv-primary transition"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          {/* Start Date */}
          <div>
            <label className="block text-xs font-semibold text-tv-muted uppercase tracking-wider mb-1.5">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full rounded-xl border border-tv-border bg-tv-surface px-3.5 py-2 text-sm text-tv-text focus:border-tv-primary focus:outline-none"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-semibold text-tv-muted uppercase tracking-wider mb-1.5">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full rounded-xl border border-tv-border bg-tv-surface px-3.5 py-2 text-sm text-tv-text focus:border-tv-primary focus:outline-none"
            />
          </div>

          {/* Region */}
          <div>
            <label className="block text-xs font-semibold text-tv-muted uppercase tracking-wider mb-1.5">Region</label>
            <select
              value={filters.region}
              onChange={(e) => setFilters(prev => ({ ...prev, region: e.target.value }))}
              className="w-full rounded-xl border border-tv-border bg-tv-surface px-3 py-2 text-sm text-tv-text focus:border-tv-primary focus:outline-none"
            >
              {REGIONS.map(reg => (
                <option key={reg} value={reg}>{reg}</option>
              ))}
            </select>
          </div>

          {/* Local Authority */}
          <div>
            <label className="block text-xs font-semibold text-tv-muted uppercase tracking-wider mb-1.5">Local Authority</label>
            <select
              value={filters.localAuthority}
              onChange={(e) => setFilters(prev => ({ ...prev, localAuthority: e.target.value }))}
              className="w-full rounded-xl border border-tv-border bg-tv-surface px-3 py-2 text-sm text-tv-text focus:border-tv-primary focus:outline-none"
            >
              {LOCAL_AUTHORITIES.map(auth => (
                <option key={auth} value={auth}>{auth}</option>
              ))}
            </select>
          </div>

          {/* Road Type */}
          <div>
            <label className="block text-xs font-semibold text-tv-muted uppercase tracking-wider mb-1.5">Road Type</label>
            <select
              value={filters.roadType}
              onChange={(e) => setFilters(prev => ({ ...prev, roadType: e.target.value }))}
              className="w-full rounded-xl border border-tv-border bg-tv-surface px-3 py-2 text-sm text-tv-text focus:border-tv-primary focus:outline-none"
            >
              {ROAD_TYPES.map(rt => (
                <option key={rt} value={rt}>{rt}</option>
              ))}
            </select>
          </div>

          {/* Road Name */}
          <div>
            <label className="block text-xs font-semibold text-tv-muted uppercase tracking-wider mb-1.5">Road Name</label>
            <input
              type="text"
              placeholder="e.g. A1, M25"
              value={filters.roadName}
              onChange={(e) => setFilters(prev => ({ ...prev, roadName: e.target.value }))}
              className="w-full rounded-xl border border-tv-border bg-tv-surface px-3.5 py-2 text-sm text-tv-text placeholder-slate-500 focus:border-tv-primary focus:outline-none"
            />
          </div>

          {/* Time Period */}
          <div>
            <label className="block text-xs font-semibold text-tv-muted uppercase tracking-wider mb-1.5">Time Period</label>
            <select
              value={filters.timePeriod}
              onChange={(e) => setFilters(prev => ({ ...prev, timePeriod: e.target.value }))}
              className="w-full rounded-xl border border-tv-border bg-tv-surface px-3 py-2 text-sm text-tv-text focus:border-tv-primary focus:outline-none"
            >
              {TIME_PERIODS.map(tp => (
                <option key={tp} value={tp}>{tp}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading && !kpis ? (
        <div className="flex h-96 flex-col items-center justify-center gap-3">
          <RefreshCw className="h-10 w-10 animate-spin text-tv-primary" />
          <p className="text-sm font-medium text-tv-muted">Compiling dataset metrics...</p>
        </div>
      ) : (
        <>
          {/* KPI Dashboard Cards Grid */}
          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {/* 1. Total Traffic Count */}
            <div className="rounded-2xl border border-tv-border bg-tv-surface/40 p-4.5">
              <div className="text-xs font-semibold text-tv-muted uppercase tracking-wider">Total Traffic Count</div>
              <div className="mt-2 text-2xl font-bold text-tv-text">{(kpis?.total_traffic_count || 0).toLocaleString()}</div>
              <div className="mt-1 text-[10px] text-tv-muted">Total observed vehicles</div>
            </div>

            {/* 2. Total Predictions */}
            <div className="rounded-2xl border border-tv-border bg-tv-surface/40 p-4.5">
              <div className="text-xs font-semibold text-tv-muted uppercase tracking-wider">Total Predictions</div>
              <div className="mt-2 text-2xl font-bold text-tv-text">{(kpis?.total_predictions || 0).toLocaleString()}</div>
              <div className="mt-1 text-[10px] text-tv-primary flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> XGBoost Generated
              </div>
            </div>

            {/* 3. Average Traffic Density */}
            <div className="rounded-2xl border border-tv-border bg-tv-surface/40 p-4.5">
              <div className="text-xs font-semibold text-tv-muted uppercase tracking-wider">Avg Traffic Density</div>
              <div className="mt-2 text-2xl font-bold text-tv-text">{kpis?.average_traffic_density}%</div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-green-500 to-amber-500"
                  style={{ width: `${Math.min(100, kpis?.average_traffic_density || 0)}%` }}
                />
              </div>
            </div>

            {/* 4. Average Congestion Score */}
            <div className="rounded-2xl border border-tv-border bg-tv-surface/40 p-4.5">
              <div className="text-xs font-semibold text-tv-muted uppercase tracking-wider">Avg Congestion Index</div>
              <div className="mt-2 text-2xl font-bold text-tv-text">{kpis?.average_congestion_score}%</div>
              <div className="mt-1 text-[10px] text-tv-muted">Capacity utilization ratio</div>
            </div>

            {/* 5. Peak Hour */}
            <div className="rounded-2xl border border-tv-border bg-tv-surface/40 p-4.5">
              <div className="text-xs font-semibold text-tv-muted uppercase tracking-wider">Peak Traffic Hour</div>
              <div className="mt-2 text-2xl font-bold text-amber-500 flex items-center gap-1.5">
                <Clock className="h-5 w-5 text-amber-500" />
                {kpis?.peak_hour}
              </div>
              <div className="mt-1 text-[10px] text-tv-muted">Highest volume segment</div>
            </div>

            {/* 6. Lowest Traffic Hour */}
            <div className="rounded-2xl border border-tv-border bg-tv-surface/40 p-4.5">
              <div className="text-xs font-semibold text-tv-muted uppercase tracking-wider">Lowest Hour</div>
              <div className="mt-2 text-2xl font-bold text-green-500 flex items-center gap-1.5">
                <Clock className="h-5 w-5 text-green-500" />
                {kpis?.lowest_traffic_hour}
              </div>
              <div className="mt-1 text-[10px] text-tv-muted">Lowest density interval</div>
            </div>

            {/* 7. Average Travel Time */}
            <div className="rounded-2xl border border-tv-border bg-tv-surface/40 p-4.5">
              <div className="text-xs font-semibold text-tv-muted uppercase tracking-wider">Avg Travel Time</div>
              <div className="mt-2 text-2xl font-bold text-tv-text">{kpis?.average_travel_time}m</div>
              <div className="mt-1 text-[10px] text-tv-muted">Estimated per 1.5 km segment</div>
            </div>

            {/* 8. Total Alerts */}
            <div className="rounded-2xl border border-tv-border bg-tv-surface/40 p-4.5">
              <div className="text-xs font-semibold text-tv-muted uppercase tracking-wider">Total Active Alerts</div>
              <div className="mt-2 text-2xl font-bold text-red-500 flex items-center gap-1.5">
                <ShieldAlert className="h-5 w-5 text-red-500" />
                {kpis?.total_alerts}
              </div>
              <div className="mt-1 text-[10px] text-tv-muted">Registered in incident DB</div>
            </div>

            {/* 9. Prediction Accuracy */}
            <div className="rounded-2xl border border-tv-border bg-tv-surface/40 p-4.5">
              <div className="text-xs font-semibold text-tv-muted uppercase tracking-wider">Prediction Accuracy</div>
              <div className="mt-2 text-2xl font-bold text-emerald-400">{kpis?.prediction_accuracy}%</div>
              <div className="mt-1 text-[10px] text-tv-muted">Average R² confidence score</div>
            </div>

            {/* 10. Total Monitored Roads */}
            <div className="rounded-2xl border border-tv-border bg-tv-surface/40 p-4.5">
              <div className="text-xs font-semibold text-tv-muted uppercase tracking-wider">Monitored Roads</div>
              <div className="mt-2 text-2xl font-bold text-tv-text">{kpis?.total_monitored_roads}</div>
              <div className="mt-1 text-[10px] text-tv-muted">Unique segment records</div>
            </div>
          </div>

          {/* Charts Panel */}
          {charts && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Hourly Traffic Trend (Line Chart) */}
              <div className="rounded-2xl border border-tv-border bg-tv-surface p-5">
                <h3 className="mb-4 text-base font-bold text-tv-text flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-tv-primary" />
                  Hourly Traffic & Congestion Trends (Historical vs AI Predicted)
                </h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={charts.hourly_trend}>
                      <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                      <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                      <YAxis yAxisId="left" stroke="#94a3b8" fontSize={11} label={{ value: 'Vehicles / Hr', angle: -90, position: 'insideLeft', fill: '#94a3b8', style: {textAnchor: 'middle'} }} />
                      <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={11} domain={[0, 100]} label={{ value: 'Congestion %', angle: 90, position: 'insideRight', fill: '#f59e0b', style: {textAnchor: 'middle'} }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} labelClassName="text-tv-text font-bold" />
                      <Legend verticalAlign="top" height={36} />
                      <Line yAxisId="left" type="monotone" dataKey="volume" stroke="#ff5b00" strokeWidth={2.5} name="Historical Volume" dot={false} />
                      <Line yAxisId="left" type="monotone" dataKey="predicted" stroke="#10b981" strokeWidth={2} name="AI Predicted Volume" strokeDasharray="5 5" dot={false} />
                      <Line yAxisId="right" type="monotone" dataKey="congestion" stroke="#f59e0b" strokeWidth={2} name="Congestion index" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Daily Traffic Comparison (Bar Chart) */}
              <div className="rounded-2xl border border-tv-border bg-tv-surface p-5">
                <h3 className="mb-4 text-base font-bold text-tv-text flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-tv-primary" />
                  Daily Traffic Patterns (Volume & Congestion)
                </h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.daily_trend}>
                      <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                      <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                      <YAxis yAxisId="left" stroke="#94a3b8" fontSize={11} />
                      <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={11} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                      <Legend verticalAlign="top" height={36} />
                      <Bar yAxisId="left" dataKey="volume" fill="#ff5b00" name="Average Volume" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="right" dataKey="congestion" fill="#f59e0b" name="Avg Congestion %" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Congestion Distribution (Pie Chart) */}
              <div className="rounded-2xl border border-tv-border bg-tv-surface p-5">
                <h3 className="mb-4 text-base font-bold text-tv-text flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-tv-primary" />
                  Traffic Congestion Distribution Levels
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-4">
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={charts.congestion_distribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {charts.congestion_distribution.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col gap-3">
                    {charts.congestion_distribution.map((level: any) => (
                      <div key={level.name} className="flex items-center justify-between border-b border-tv-border pb-2">
                        <div className="flex items-center gap-2 text-sm text-tv-text">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: level.color }} />
                          {level.name}
                        </div>
                        <div className="text-sm font-bold text-tv-text">{level.value.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Vehicle Category Analysis (Stacked Bar Chart) */}
              <div className="rounded-2xl border border-tv-border bg-tv-surface p-5">
                <h3 className="mb-4 text-base font-bold text-tv-text flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-tv-primary" />
                  Vehicle Classification Timeline (Stacked)
                </h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.vehicle_category_analysis}>
                      <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                      <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                      <Legend verticalAlign="top" height={36} />
                      <Bar dataKey="cars" stackId="a" fill="#ff5b00" name="Cars & Taxis" />
                      <Bar dataKey="lgvs" stackId="a" fill="#10b981" name="Light Vans (LGVs)" />
                      <Bar dataKey="hgvs" stackId="a" fill="#f59e0b" name="Trucks (HGVs)" />
                      <Bar dataKey="buses" stackId="a" fill="#8b5cf6" name="Buses & Coaches" />
                      <Bar dataKey="cycles" stackId="a" fill="#ec4899" name="Pedal Cycles" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Traffic Density Timeline (Area Chart) */}
              <div className="rounded-2xl border border-tv-border bg-tv-surface p-5 lg:col-span-2">
                <h3 className="mb-4 text-base font-bold text-tv-text flex items-center gap-2">
                  <Activity className="h-4 w-4 text-tv-primary" />
                  Traffic Congestion Density Timeline (Last 15 Observations)
                </h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={charts.density_timeline}>
                      <defs>
                        <linearGradient id="colorDensity" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ff5b00" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#ff5b00" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                      <Area type="monotone" dataKey="density" stroke="#ff5b00" strokeWidth={2.5} fillOpacity={1} fill="url(#colorDensity)" name="Average Density %" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Admin Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-tv-border bg-tv-surface p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-tv-border pb-4">
                <div className="flex items-center gap-2 text-lg font-bold text-tv-text">
                  <Settings className="h-5 w-5 text-tv-primary" />
                  Dashboard Settings
                </div>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="rounded-lg p-1 text-tv-muted hover:bg-black/[0.03] hover:text-tv-text"
                >
                  &times;
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-semibold text-tv-muted uppercase tracking-wider mb-1.5">Default Workspace Region</label>
                  <select
                    value={dashboardSettings.defaultRegion}
                    onChange={(e) => setDashboardSettings(prev => ({ ...prev, defaultRegion: e.target.value }))}
                    className="w-full rounded-xl border border-tv-border bg-tv-surface px-3 py-2 text-sm text-tv-text focus:outline-none"
                  >
                    {REGIONS.map(reg => (
                      <option key={reg} value={reg}>{reg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-tv-muted uppercase tracking-wider mb-1.5">Auto-Refresh Interval</label>
                  <select
                    value={dashboardSettings.autoRefreshInterval}
                    onChange={(e) => setDashboardSettings(prev => ({ ...prev, autoRefreshInterval: e.target.value }))}
                    className="w-full rounded-xl border border-tv-border bg-tv-surface px-3 py-2 text-sm text-tv-text focus:outline-none"
                  >
                    <option value="Off">Off</option>
                    <option value="30s">Every 30 seconds</option>
                    <option value="1m">Every 1 minute</option>
                    <option value="5m">Every 5 minutes</option>
                  </select>
                </div>

                <div className="rounded-xl border border-tv-border bg-black/[0.01] p-3 text-xs text-tv-muted">
                  <span className="font-semibold text-tv-text block mb-1">System Status</span>
                  Data last compiled at: <span className="text-tv-text font-mono">{dashboardSettings.dataRefreshedAt}</span>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-tv-border pt-4">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="rounded-xl border border-tv-border px-4 py-2 text-sm font-semibold text-tv-text transition hover:bg-black/[0.03]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowSettingsModal(false)
                    fetchData()
                  }}
                  className="rounded-xl bg-tv-primary px-4 py-2 text-sm font-semibold text-tv-text shadow-lg transition hover:bg-blue-500"
                >
                  Apply Settings
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
