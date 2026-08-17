import { useState, useEffect } from 'react'
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import {
  Activity, Sliders, RefreshCw, Sparkles, TrendingUp,
  AlertCircle, CheckCircle2, ArrowUpRight, ArrowDownRight,
  Search, ShieldCheck
} from 'lucide-react'
import { analyticsService } from '../../services/analyticsService'
import { predictionService } from '../../services/predictionService'

const REGIONS = [
  'All', 'London', 'South East', 'South West', 'North West', 'East of England',
  'West Midlands', 'East Midlands', 'Yorkshire and The Humber', 'North East', 'Scotland', 'Wales'
]
const ROAD_TYPES = ['All', 'Major', 'Minor']

export function TrendsPage() {
  // Filters State
  const [filters, setFilters] = useState({
    region: 'All',
    roadType: 'All'
  })

  // Active Chart Period Tab
  const [activeTab, setActiveTab] = useState<'hourly' | 'daily' | 'weekly' | 'monthly'>('hourly')

  // Forecast Road Search State
  const [roads, setRoads] = useState<string[]>([])
  const [forecastRoad, setForecastRoad] = useState<string>('A1')
  const [forecastLoading, setForecastLoading] = useState<boolean>(false)
  const [forecastData, setForecastData] = useState<any>(null)

  // Trends Data State
  const [loading, setLoading] = useState<boolean>(true)
  const [trends, setTrends] = useState<any>(null)

  const fetchTrendsData = async () => {
    setLoading(true)
    try {
      const data = await analyticsService.getTrendsData(filters)
      setTrends(data)
    } catch (error) {
      console.error('Failed to load trends data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchForecastData = async () => {
    if (!forecastRoad.trim()) return
    setForecastLoading(true)
    try {
      const data = await analyticsService.getTrendsForecast(forecastRoad)
      setForecastData(data)
    } catch (error) {
      console.error('Failed to load forecast trends:', error)
    } finally {
      setForecastLoading(false)
    }
  }

  // Load list of available roads on mount
  useEffect(() => {
    const fetchRoads = async () => {
      try {
        const roadsList = await predictionService.getAvailableRoads()
        setRoads(roadsList)
        if (roadsList.length > 0) {
          const defaultRoad = roadsList.includes('A1') ? 'A1' : roadsList[0]
          setForecastRoad(defaultRoad)
        }
      } catch (error) {
        console.error('Failed to load roads:', error)
      }
    }
    fetchRoads()
  }, [])

  useEffect(() => {
    fetchTrendsData()
  }, [filters])

  useEffect(() => {
    fetchForecastData()
  }, [forecastRoad])

  // Get active chart dataset based on tab
  const getActiveDataset = () => {
    if (!trends) return []
    switch (activeTab) {
      case 'hourly': return trends.hourly_trends
      case 'daily': return trends.daily_trends
      case 'weekly': return trends.weekly_trends
      case 'monthly': return trends.monthly_trends
      default: return []
    }
  }

  return (
    <div className="min-h-screen bg-tv-bg p-6 text-tv-text">
      {/* Header Banner */}
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-tv-border pb-6 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-tv-primary">
            <TrendingUp className="h-4 w-4" />
            AI Trend Forecaster
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-tv-text">AI-Driven Traffic Trend Analysis</h1>
          <p className="mt-1 text-sm text-tv-muted">
            Compare historical baselines against ML predictions and generate dynamic recommendation cards.
          </p>
        </div>

        <button
          onClick={fetchTrendsData}
          className="flex items-center gap-2 rounded-xl border border-tv-border bg-black/[0.02] px-4 py-2.5 text-sm font-medium text-tv-text transition hover:bg-black/[0.03] hover:text-tv-text"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Recalculate Trends
        </button>
      </div>

      {/* AI Recommendation cards (Insight Cards Carousel/List) */}
      <div className="mb-8">
        <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-tv-muted">
          <Sparkles className="h-4 w-4 text-tv-primary" />
          AI Smart Recommendation Cards
        </h3>
        
        {loading && !trends ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-32 rounded-2xl bg-black/[0.01] animate-pulse border border-tv-border" />
            <div className="h-32 rounded-2xl bg-black/[0.01] animate-pulse border border-tv-border" />
            <div className="h-32 rounded-2xl bg-black/[0.01] animate-pulse border border-tv-border" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {trends?.ai_insights.map((insight: any) => {
              const bg = 
                insight.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300' :
                insight.type === 'warning' ? 'bg-amber-500/5 border-amber-500/20 text-amber-300' :
                'bg-blue-500/5 border-tv-primary/20 text-blue-300'

              const accentColor = 
                insight.type === 'success' ? 'text-emerald-400' :
                insight.type === 'warning' ? 'text-amber-400' :
                'text-tv-primary'

              const icon = 
                insight.type === 'success' ? <CheckCircle2 className={`h-5 w-5 ${accentColor}`} /> :
                insight.type === 'warning' ? <AlertCircle className={`h-5 w-5 ${accentColor}`} /> :
                <Sparkles className={`h-5 w-5 ${accentColor}`} />

              const sign = insight.impact_percentage > 0 ? '+' : ''

              return (
                <div key={insight.id} className={`rounded-2xl border p-4.5 flex flex-col justify-between shadow-lg ${bg}`}>
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-bold text-sm text-tv-text flex items-center gap-1.5 leading-tight">
                        {icon}
                        {insight.title}
                      </div>
                      {insight.impact_percentage !== null && (
                        <span className={`text-xs font-extrabold px-1.5 py-0.5 rounded bg-tv-surface border border-tv-border flex items-center gap-0.5 ${insight.impact_percentage > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                          {insight.impact_percentage > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {sign}{insight.impact_percentage}%
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-tv-text">
                      {insight.message}
                    </p>
                  </div>
                  
                  <div className="mt-4 text-[9px] text-tv-muted font-medium">
                    RECOMMENDED ACTION &bull; AI DISPATCHED
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left/Middle Columns: Trend Charts Panel */}
        <div className="flex flex-col gap-6 lg:col-span-8">
          {/* Historical vs Predicted Charts Container */}
          <div className="rounded-2xl border border-tv-border bg-tv-surface p-5 shadow-xl">
            <div className="mb-6 flex flex-col justify-between gap-4 border-b border-tv-border pb-4 md:flex-row md:items-center">
              <div>
                <h3 className="text-base font-bold text-tv-text flex items-center gap-2">
                  <Activity className="h-4 w-4 text-tv-primary" />
                  Historical vs Predicted Traffic Flow Comparison
                </h3>
                <p className="text-xs text-tv-muted">Comparing average baseline motor counts against forecasts.</p>
              </div>

              {/* Chart Tabs selector */}
              <div className="flex rounded-xl bg-tv-bg p-1 border border-tv-border">
                {(['hourly', 'daily', 'weekly', 'monthly'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase transition ${
                      activeTab === tab 
                        ? 'bg-tv-primary text-tv-text shadow-md' 
                        : 'text-tv-muted hover:text-tv-text'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {loading && !trends ? (
              <div className="flex h-80 items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-tv-primary" />
              </div>
            ) : (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getActiveDataset()}>
                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} label={{ value: 'Average Vehicles / Hr', angle: -90, position: 'insideLeft', fill: '#94a3b8', style: {textAnchor: 'middle'} }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                    <Legend verticalAlign="top" height={36} />
                    <Line type="monotone" dataKey="historical" stroke="#ff5b00" strokeWidth={2.5} name="Historical baseline" dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="predicted" stroke="#10b981" strokeWidth={2} name="AI Predicted Flow" strokeDasharray="4 4" dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Road Forecast Timeline Search */}
          <div className="rounded-2xl border border-tv-border bg-tv-surface p-5 shadow-xl">
            <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-base font-bold text-tv-text flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-tv-primary" />
                  Roadway Forecast Timeline Lookup
                </h3>
                <p className="text-xs text-tv-muted">Search predictions for a specific segment to overlay hourly speeds.</p>
              </div>

              {/* Search dropdown select */}
              <div className="relative flex items-center">
                <select
                  value={forecastRoad}
                  onChange={(e) => setForecastRoad(e.target.value)}
                  className="rounded-xl border border-tv-border bg-tv-surface pl-4 pr-10 py-2 text-sm text-tv-text focus:border-tv-primary focus:outline-none appearance-none cursor-pointer"
                >
                  {roads.map((road) => (
                    <option key={road} value={road} className="bg-tv-bg text-tv-text">
                      {road}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3 flex items-center text-tv-muted">
                  <svg className="h-4 w-4 fill-current text-tv-muted" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>

            {forecastLoading ? (
              <div className="flex h-72 items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-tv-primary" />
              </div>
            ) : forecastData ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Meta details */}
                <div className="md:col-span-1 rounded-2xl border border-tv-border bg-tv-surface/20 p-4.5 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-tv-primary tracking-wide uppercase">Segment Metadata</span>
                    <h4 className="mt-2 text-xl font-bold text-tv-text">{forecastData.road_name}</h4>
                    <p className="mt-1 text-xs text-tv-muted">Category: {forecastData.road_type}</p>
                    
                    <div className="mt-4 flex flex-col gap-2.5 text-xs text-tv-text">
                      <div className="flex justify-between">
                        <span>Latitude:</span>
                        <span className="font-mono text-tv-text">{forecastData.latitude.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Longitude:</span>
                        <span className="font-mono text-tv-text">{forecastData.longitude.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Timeline Date:</span>
                        <span className="font-mono text-tv-text">{forecastData.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center gap-1.5 text-[10px] text-emerald-400">
                    <ShieldCheck className="h-4 w-4" />
                    Model Telemetry verified
                  </div>
                </div>

                {/* Chart */}
                <div className="md:col-span-2 h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={forecastData.forecast}>
                      <defs>
                        <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                      <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                      <Legend verticalAlign="top" height={36} />
                      <Area type="monotone" dataKey="congestion_index" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#forecastGrad)" name="Congestion Index %" />
                      <Line type="monotone" dataKey="average_speed" stroke="#f59e0b" strokeWidth={2} name="Avg Speed (km/h)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-tv-muted text-sm">
                Enter a valid monitored roadway to load its hourly forecast comparison chart.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Filters and Region comparisons */}
        <div className="flex flex-col gap-6 lg:col-span-4">
          {/* Controls Filters */}
          <div className="rounded-2xl border border-tv-border bg-tv-surface p-5 shadow-xl">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-tv-text">
              <Sliders className="h-4 w-4 text-tv-primary" />
              Trends Filters
            </h3>

            <div className="flex flex-col gap-4">
              {/* Region */}
              <div>
                <label className="block text-xs font-semibold text-tv-muted uppercase tracking-wider mb-1.5">Region</label>
                <select
                  value={filters.region}
                  onChange={(e) => setFilters(prev => ({ ...prev, region: e.target.value }))}
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
                  value={filters.roadType}
                  onChange={(e) => setFilters(prev => ({ ...prev, roadType: e.target.value }))}
                  className="w-full rounded-xl border border-tv-border bg-tv-surface px-3 py-2 text-sm text-tv-text focus:outline-none"
                >
                  {ROAD_TYPES.map(rt => (
                    <option key={rt} value={rt}>{rt}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Regional comparisons table */}
          <div className="rounded-2xl border border-tv-border bg-tv-surface p-5 shadow-xl">
            <h3 className="mb-4 flex items-center gap-1.5 text-sm font-bold text-tv-text">
              <Activity className="h-4 w-4 text-tv-primary" />
              Region-wise Trends & Volume Changes
            </h3>

            {loading && !trends ? (
              <div className="flex h-48 items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-tv-primary" />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {trends?.region_trends.map((item: any) => {
                  const isPositive = item.volume_change_pct >= 0
                  return (
                    <div key={item.region} className="flex items-center justify-between border-b border-tv-border pb-2.5">
                      <div>
                        <span className="text-xs font-bold text-tv-text block">{item.region}</span>
                        <span className="text-[10px] text-tv-muted">Congestion: {item.avg_congestion}%</span>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded border flex items-center gap-0.5 ${
                        isPositive 
                          ? 'text-red-400 border-red-500/20 bg-red-500/5' 
                          : 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5'
                      }`}>
                        {isPositive ? '+' : ''}{item.volume_change_pct}%
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
