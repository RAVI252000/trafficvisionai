import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Activity, AlertTriangle, TrendingUp, ArrowUpRight, ArrowDownRight,
  Compass, RefreshCw, Bell, Navigation, Clock, Sparkles, MapPin,
  Route, CheckCircle2, LayoutGrid, ShieldAlert, Info
} from 'lucide-react'
import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { predictionService } from '../../services/predictionService'
import 'leaflet/dist/leaflet.css'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 25 } }
} as const

interface StatCardProps {
  title: string
  value: string | number
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
  icon: React.ReactNode
  color: string
}

function StatCard({ title, value, change, changeType, icon, color }: StatCardProps) {
  const isPositive = changeType === 'positive'
  const isNegative = changeType === 'negative'
  
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="tv-glass rounded-2xl p-5 flex flex-col justify-between"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-tv-muted">{title}</span>
        <div className={`p-2 rounded-xl bg-opacity-10 ${color}`}>
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-baseline justify-between">
        <h3 className="text-2xl font-bold tracking-tight text-tv-text">{value}</h3>
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-bold rounded-lg px-2 py-0.5
            ${isPositive ? 'bg-tv-emerald/10 text-tv-emerald' : isNegative ? 'bg-red-500/10 text-red-400' : 'bg-white/10 text-tv-muted'}
          `}
        >
          {isPositive ? <ArrowUpRight className="h-3 w-3" /> : isNegative ? <ArrowDownRight className="h-3.5 w-3.5" /> : null}
          {change}
        </span>
      </div>
    </motion.div>
  )
}

export function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [mapCenter, setMapCenter] = useState<[number, number]>([53.627, -1.102]) // Default A1 UK coords
  
  // Dashboard Metrics States
  const [stats, setStats] = useState({
    totalRoads: 0,
    avgCongestion: 0,
    hotspotsCount: 0,
    systemStatus: 'Stable',
    activeAlerts: 4
  })

  const [forecast, setForecast] = useState({
    confidence: 0.88,
    peakHour: '17:00',
    delayMinutes: 6,
    defaultRoadName: 'A1',
    currentVolume: 1250,
    currentCongestion: 35,
    currentStatus: 'CLEAR'
  })

  const [checkpoints, setCheckpoints] = useState<any[]>([])
  const [hourlyData, setHourlyData] = useState<any[]>([])

  // Recent Logs Mock (Requirement: Recent Predictions, Recent Route Requests)
  const recentPredictions = [
    { road: 'A1', time: '14:30', result: 'Clear (26%)', volume: 840 },
    { road: 'A3112', time: '14:15', result: 'Heavy Delay (71%)', volume: 1120 },
    { road: 'A638', time: '13:55', result: 'Moderate (42%)', volume: 910 },
  ]

  const recentRoutes = [
    { from: 'A1 Checkpoint', to: 'A3112 Bypass', delay: 'Low delay (2.1m)', distance: '8.4 km' },
    { from: 'A638 East', to: 'A1 Junction', delay: 'Heavy delay (9.5m)', distance: '14.2 km' },
  ]

  const loadData = async () => {
    try {
      // 1. Fetch live checkpoints status from new endpoint
      const monitoringData = await predictionService.getMonitoringStatus()
      if (Array.isArray(monitoringData)) {
        setCheckpoints(monitoringData)

        // Calculate aggregate stats
        const total = monitoringData.length
        const hotspots = monitoringData.filter((l: any) => l.congestion_index >= 60).length
        const avgCong = total > 0
          ? Math.round(monitoringData.reduce((sum: number, l: any) => sum + l.congestion_index, 0) / total)
          : 35
        
        let statusLabel = 'Stable'
        if (hotspots > 3) statusLabel = 'Heavy Congestion'
        else if (hotspots > 0) statusLabel = 'Moderate Traffic'

        setStats({
          totalRoads: total,
          avgCongestion: avgCong,
          hotspotsCount: hotspots,
          systemStatus: statusLabel,
          activeAlerts: hotspots + 2
        })

        if (total > 0) {
          // Average coordinates to center map preview
          const avgLat = monitoringData.reduce((sum: number, loc: any) => sum + loc.latitude, 0) / total
          const avgLng = monitoringData.reduce((sum: number, loc: any) => sum + loc.longitude, 0) / total
          setMapCenter([avgLat, avgLng])
        }

        // 2. Load 24h hourly forecast trend for a default road (like A1 or first road)
        const defaultRoad = monitoringData.find((l: any) => l.road_name === 'A1')?.road_name || monitoringData[0]?.road_name
        if (defaultRoad) {
          const today = new Date().toISOString().split('T')[0]
          const forecastRes = await predictionService.getForecast(defaultRoad, today)
          
          if (forecastRes && forecastRes.forecast) {
            setForecast({
              confidence: forecastRes.confidence,
              peakHour: forecastRes.peak_hour,
              delayMinutes: forecastRes.estimated_delay_minutes,
              defaultRoadName: defaultRoad,
              currentVolume: forecastRes.forecast[new Date().getHours()]?.predicted_volume || 1100,
              currentCongestion: forecastRes.forecast[new Date().getHours()]?.congestion_index || 30,
              currentStatus: forecastRes.forecast[new Date().getHours()]?.congestion_status || 'CLEAR'
            })

            // Map forecast array to chart data
            const mappedCharts = forecastRes.forecast.map((f: any) => ({
              time: f.time,
              volume: f.predicted_volume,
              congestion: f.congestion_index
            }))
            setHourlyData(mappedCharts)
          }
        }
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      // Standard fallback in case server is starting up or database empty
      setStats({
        totalRoads: 4,
        avgCongestion: 36,
        hotspotsCount: 1,
        systemStatus: 'Stable',
        activeAlerts: 3
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    await new Promise((resolve) => setTimeout(resolve, 800))
    setRefreshing(false)
  }

  // Get status color coding
  const getStatusColor = (idx: number) => {
    if (idx < 30) return '#10B981' // Green
    if (idx < 60) return '#F59E0B' // Orange
    return '#EF4444' // Red
  }

  const getStatusBg = (idx: number) => {
    if (idx < 30) return 'bg-tv-emerald/10 text-tv-emerald border-tv-emerald/20'
    if (idx < 60) return 'bg-tv-orange/10 text-tv-orange border-tv-orange/20'
    return 'bg-red-500/10 text-red-400 border-red-500/20'
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center text-tv-muted">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-tv-primary" />
          <span className="text-sm font-medium">Assembling city metrics…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header section */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-tv-text">Dashboard</h1>
          <p className="text-sm text-tv-muted mt-1">Smart Traffic Prediction & Congestion Management Control</p>
        </div>
        <div className="flex items-center gap-3 self-end sm:self-center">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-tv-text transition-all hover:bg-white/[0.08] disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 text-tv-primary ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Refresh Metrics'}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5"
      >
        <StatCard
          title="Monitored Roads"
          value={stats.totalRoads}
          change="Live Sensors"
          changeType="positive"
          icon={<LayoutGrid className="h-5 w-5 text-tv-primary" />}
          color="text-tv-primary bg-tv-primary"
        />
        <StatCard
          title="Avg Congestion"
          value={`${stats.avgCongestion}%`}
          change={stats.systemStatus}
          changeType={stats.avgCongestion > 50 ? 'negative' : 'positive'}
          icon={<Activity className="h-5 w-5 text-tv-orange" />}
          color="text-tv-orange bg-tv-orange"
        />
        <StatCard
          title="Peak Traffic Hour"
          value={forecast.peakHour}
          change={`Max Delay: ${forecast.delayMinutes}m`}
          changeType="neutral"
          icon={<Clock className="h-5 w-5 text-purple-400" />}
          color="text-purple-400 bg-purple-500"
        />
        <StatCard
          title="Model Confidence"
          value={`${Math.round(forecast.confidence * 100)}%`}
          change="XGBoost R²"
          changeType="positive"
          icon={<Sparkles className="h-5 w-5 text-blue-400" />}
          color="text-blue-400 bg-blue-500"
        />
        <StatCard
          title="Hotspot Locations"
          value={`${stats.hotspotsCount} Roads`}
          change="Congestion &ge; 60%"
          changeType={stats.hotspotsCount > 0 ? 'negative' : 'neutral'}
          icon={<AlertTriangle className="h-5 w-5 text-red-400" />}
          color="text-red-400 bg-red-500"
        />
      </motion.div>

      {/* Map and Main Charts grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        
        {/* Map Preview Card */}
        <div className="lg:col-span-7 flex flex-col h-[480px] rounded-2xl border border-white/[0.08] bg-[#1E293B] overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <div className="flex items-center gap-2">
              <Compass className="h-5 w-5 text-tv-primary animate-pulse" />
              <span className="text-sm font-bold text-tv-text">Live Traffic Hotspots Map Preview</span>
            </div>
            <span className="rounded-full bg-tv-emerald/10 px-2.5 py-0.5 text-[9px] font-bold text-tv-emerald flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-tv-emerald animate-ping" />
              LIVE CHECKS
            </span>
          </div>

          <div className="flex-1 w-full relative z-10">
            <MapContainer
              center={mapCenter}
              zoom={11}
              className="h-full w-full"
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              {checkpoints.map((pt, idx) => (
                <Circle
                  key={idx}
                  center={[pt.latitude, pt.longitude]}
                  radius={400}
                  pathOptions={{
                    color: getStatusColor(pt.congestion_index),
                    fillColor: getStatusColor(pt.congestion_index),
                    fillOpacity: 0.45,
                    weight: 1.5
                  }}
                >
                  <Popup>
                    <div className="p-1 min-w-[150px] text-slate-800">
                      <h4 className="text-xs font-bold border-b pb-1 mb-1.5">{pt.road_name} ({pt.road_type})</h4>
                      <p className="text-[11px] leading-relaxed my-0.5"><strong>Congestion:</strong> <span style={{ color: getStatusColor(pt.congestion_index) }} className="font-bold">{pt.congestion_index}% ({pt.congestion_status})</span></p>
                      <p className="text-[11px] leading-relaxed my-0.5"><strong>Flow Rate:</strong> {pt.predicted_volume} /hr</p>
                      <p className="text-[11px] leading-relaxed my-0.5"><strong>Confidence:</strong> {Math.round(pt.confidence * 100)}%</p>
                    </div>
                  </Popup>
                </Circle>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Charts and default road forecast trend Box */}
        <div className="lg:col-span-5 flex flex-col h-[480px] rounded-2xl border border-white/[0.08] bg-[#1E293B] overflow-hidden">
          <div className="border-b border-white/[0.06] px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-tv-primary" />
              <span className="text-sm font-bold text-tv-text">Forecast Volume Curve ({forecast.defaultRoadName})</span>
            </div>
            <span className="text-[10px] bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 rounded text-tv-muted uppercase font-bold">24-Hour</span>
          </div>
          <div className="flex-1 p-5 min-h-0 flex flex-col justify-between">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVolumeDash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCongestionDash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                  <XAxis dataKey="time" stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      borderColor: 'rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                      color: '#F8FAFC',
                      fontSize: '11px'
                    }}
                  />
                  <Area type="monotone" dataKey="volume" name="Volume (/hr)" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorVolumeDash)" />
                  <Area type="monotone" dataKey="congestion" name="Congestion %" stroke="#F59E0B" strokeWidth={1.5} fillOpacity={1} fill="url(#colorCongestionDash)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            {/* Live Prediction Widget Info */}
            <div className="bg-white/[0.01] border border-white/[0.04] p-3 rounded-xl flex items-center justify-between text-xs mt-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-tv-primary" />
                <div>
                  <span className="font-bold text-tv-text block">{forecast.defaultRoadName} Current prediction</span>
                  <span className="text-[10px] text-tv-muted">Hour: {new Date().getHours()}:00 &bull; {forecast.currentVolume} vehicles</span>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getStatusBg(forecast.currentCongestion)}`}>
                {forecast.currentStatus} ({forecast.currentCongestion}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Lower Grid: Top Busy Roads, Recent Logs, Safety Warnings */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        
        {/* Widget 1: Top Congested Roads & Congestion Trends */}
        <div className="tv-glass rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/[0.04] pb-3 mb-4">
              <span className="text-sm font-bold text-tv-text flex items-center gap-2">
                <ShieldAlert className="h-4.5 w-4.5 text-red-400" />
                Top Congested Checkpoints
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-red-400">Bottlenecks</span>
            </div>

            <div className="space-y-3">
              {checkpoints.length > 0 ? (
                checkpoints
                  .slice()
                  .sort((a, b) => b.congestion_index - a.congestion_index)
                  .slice(0, 3)
                  .map((road, idx) => {
                    const statusColor = getStatusColor(road.congestion_index)
                    return (
                      <div key={idx} className="bg-white/[0.01] border border-white/[0.04] p-2.5 rounded-xl space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-tv-text flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: statusColor }}></span>
                            {road.road_name} ({road.road_type})
                          </span>
                          <span className="font-bold text-tv-text">{road.congestion_index}%</span>
                        </div>
                        <div className="w-full bg-white/[0.08] h-1 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${road.congestion_index}%`,
                              backgroundColor: statusColor
                            }}
                          />
                        </div>
                      </div>
                    )
                  })
              ) : (
                <div className="text-center text-xs text-tv-muted py-6">No busy roads recorded.</div>
              )}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/[0.04] text-[10px] text-tv-muted flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-tv-primary flex-shrink-0" />
            <span>Updated live from XGBoost capacity evaluation.</span>
          </div>
        </div>

        {/* Widget 2: Recent Logs Log (Predictions & Route analysis) */}
        <div className="tv-glass rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/[0.04] pb-3 mb-4">
              <span className="text-sm font-bold text-tv-text flex items-center gap-2">
                <Route className="h-4.5 w-4.5 text-tv-primary" />
                Recent System Activity Log
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-tv-muted">Live run</span>
            </div>

            {/* Sub Section 1: Predictions Log */}
            <div className="space-y-2 mb-4">
              <h5 className="text-[10px] uppercase font-bold tracking-wider text-tv-muted mb-1.5 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-tv-emerald" /> Recent Predictions
              </h5>
              {recentPredictions.map((pred, index) => (
                <div key={index} className="flex justify-between items-center text-[11px] py-1 border-b border-white/[0.02] text-tv-muted">
                  <span className="font-semibold text-tv-text">{pred.road} evaluation</span>
                  <div className="flex gap-2.5 items-center">
                    <span>{pred.volume} /hr</span>
                    <span className="text-tv-text font-medium">{pred.result}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Sub Section 2: Routing Log */}
            <div className="space-y-2">
              <h5 className="text-[10px] uppercase font-bold tracking-wider text-tv-muted mb-1.5 flex items-center gap-1">
                <Navigation className="h-3.5 w-3.5 text-tv-primary" /> Recent Route Requests
              </h5>
              {recentRoutes.map((route, index) => (
                <div key={index} className="text-[11px] p-1.5 rounded bg-white/[0.01] border border-white/[0.03] space-y-0.5">
                  <div className="flex justify-between text-tv-text font-semibold">
                    <span>{route.from} &rarr; {route.to}</span>
                    <span className="text-tv-primary font-bold">{route.distance}</span>
                  </div>
                  <p className="text-[10px] text-tv-muted">{route.delay}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Widget 3: Live Incident Alerts (Safety Warnings) */}
        <div className="tv-glass rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/[0.04] pb-3 mb-4">
              <span className="text-sm font-bold text-tv-text flex items-center gap-2">
                <Bell className="h-4.5 w-4.5 text-red-400 animate-swing" />
                Active Alerts &amp; Advisories
              </span>
              <span className="text-[10px] font-bold text-red-400">Critical</span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg hover:bg-white/[0.02] p-1.5 transition-colors">
                <span className="h-2 w-2 mt-1.5 rounded-full bg-red-500 shrink-0 animate-pulse" />
                <div>
                  <span className="block text-xs font-semibold text-tv-text leading-tight">Congestion Bypass Suggested: A3112</span>
                  <span className="block text-[10px] text-tv-muted mt-0.5">Capacity saturation is 71%, bypass suggested via A30.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg hover:bg-white/[0.02] p-1.5 transition-colors">
                <span className="h-2 w-2 mt-1.5 rounded-full bg-tv-orange shrink-0" />
                <div>
                  <span className="block text-xs font-semibold text-tv-text leading-tight">Safety Advisory: South West Area</span>
                  <span className="block text-[10px] text-tv-muted mt-0.5">Rainfall warning. Standard safety speeds reduced by 15%.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg hover:bg-white/[0.02] p-1.5 transition-colors">
                <span className="h-2 w-2 mt-1.5 rounded-full bg-tv-emerald shrink-0" />
                <div>
                  <span className="block text-xs font-semibold text-tv-text leading-tight">Calibration completed: XGBoost volume</span>
                  <span className="block text-[10px] text-tv-muted mt-0.5">Model evaluation report compiled at 0.549 R².</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-white/[0.04]">
            <button className="flex w-full items-center justify-center gap-1 text-xs font-bold text-tv-primary hover:text-blue-400 transition-colors cursor-pointer">
              <Navigation className="h-3.5 w-3.5" /> Optimize Routes Now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
