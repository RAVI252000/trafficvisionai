import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Car,
  Activity,
  Gauge,
  AlertTriangle,
  CloudRain,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Compass,
  RefreshCw,
  Bell,
  Navigation
} from 'lucide-react'
import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import 'leaflet/dist/leaflet.css'

// Import mock data services
import { trafficService } from '../../services/trafficService'
import { predictionService } from '../../services/predictionService'

// Helper for card animation stagger
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
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
          className={`inline-flex items-center gap-1 text-xs font-bold rounded-lg px-2 py-0.5
            ${isPositive ? 'bg-tv-emerald/10 text-tv-emerald' : isNegative ? 'bg-red-500/10 text-red-400' : 'bg-white/10 text-tv-muted'}
          `}
        >
          {isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : isNegative ? <ArrowDownRight className="h-3.5 w-3.5" /> : null}
          {change}
        </span>
      </div>
    </motion.div>
  )
}

export function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Dashboard states
  const [stats, setStats] = useState({
    vehicleCount: 0,
    density: 'Moderate',
    congestionLevel: 0,
    averageSpeed: 0,
    activeAlerts: 5
  })
  
  const [forecast, setForecast] = useState({
    confidence: 0,
    peakHour: '',
    delayMinutes: 0
  })

  // Simulated traffic checkpoints in New York City (Manhattan) for the mini map
  const checkpoints = [
    { id: 1, name: 'Times Square Intersection', coords: [40.7580, -73.9855] as [number, number], level: 'High', color: '#F59E0B', radius: 180, speed: '14 km/h', flow: '420 vehicles/hr' },
    { id: 2, name: 'Lincoln Tunnel Entrance', coords: [40.7590, -74.0010] as [number, number], level: 'Critical', color: '#EF4444', radius: 240, speed: '7 km/h', flow: '680 vehicles/hr' },
    { id: 3, name: 'FDR Drive & E 34th St', coords: [40.7420, -73.9710] as [number, number], level: 'Low', color: '#10B981', radius: 120, speed: '58 km/h', flow: '210 vehicles/hr' },
    { id: 4, name: 'Brooklyn Bridge Entry', coords: [40.7061, -73.9969] as [number, number], level: 'Moderate', color: '#F59E0B', radius: 160, speed: '32 km/h', flow: '340 vehicles/hr' },
    { id: 5, name: 'Central Park West & 72nd St', coords: [40.7760, -73.9760] as [number, number], level: 'Low', color: '#10B981', radius: 100, speed: '45 km/h', flow: '150 vehicles/hr' },
  ]

  // Recharts Chart Mock Data
  const hourlyData = [
    { time: '08:00', volume: 8500, speed: 28, congestion: 68 },
    { time: '10:00', volume: 9200, speed: 22, congestion: 74 },
    { time: '12:00', volume: 11400, speed: 18, congestion: 82 },
    { time: '14:00', volume: 10200, speed: 26, congestion: 70 },
    { time: '16:00', volume: 12847, speed: 15, congestion: 88 }, // Live Point
    { time: '18:00', volume: 14200, speed: 10, congestion: 95 }, // Predicted Peak
    { time: '20:00', volume: 9800, speed: 30, congestion: 60 },
    { time: '22:00', volume: 6200, speed: 45, congestion: 38 },
  ]

  const weeklyData = [
    { day: 'Mon', average: 11400, peak: 13900 },
    { day: 'Tue', average: 12100, peak: 14200 },
    { day: 'Wed', average: 11900, peak: 13800 },
    { day: 'Thu', average: 12400, peak: 14600 },
    { day: 'Fri', average: 13500, peak: 15900 },
    { day: 'Sat', average: 9200, peak: 11200 },
    { day: 'Sun', average: 7800, peak: 9500 },
  ]

  const loadData = async () => {
    try {
      const traffic = await trafficService.getLiveTraffic()
      const pred = await predictionService.getCongestionForecast()
      
      setStats({
        vehicleCount: traffic.vehicleCount,
        density: traffic.density,
        congestionLevel: traffic.congestionLevel,
        averageSpeed: traffic.averageSpeed,
        activeAlerts: 5
      })

      setForecast({
        confidence: pred.confidence,
        peakHour: pred.peakHour,
        delayMinutes: pred.delayMinutes
      })
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    }
  }

  useEffect(() => {
    loadData().then(() => setLoading(false))
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    // Small artificial timeout for visual indicator rotation
    await new Promise((resolve) => setTimeout(resolve, 800))
    setRefreshing(false)
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
    <div className="space-y-6">
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
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-tv-text transition-all hover:bg-white/[0.08] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 text-tv-primary ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Refresh Metrics'}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5"
      >
        <StatCard
          title="Vehicle Count"
          value={stats.vehicleCount.toLocaleString()}
          change="+8.3%"
          changeType="positive"
          icon={<Car className="h-5 w-5 text-tv-primary" />}
          color="text-tv-primary bg-tv-primary"
        />
        <StatCard
          title="Congestion Index"
          value={`${stats.congestionLevel}%`}
          change="Moderate"
          changeType="neutral"
          icon={<Activity className="h-5 w-5 text-tv-orange" />}
          color="text-tv-orange bg-tv-orange"
        />
        <StatCard
          title="Average Speed"
          value={`${stats.averageSpeed} km/h`}
          change="-4 km/h"
          changeType="negative"
          icon={<Gauge className="h-5 w-5 text-tv-emerald" />}
          color="text-tv-emerald bg-tv-emerald"
        />
        <StatCard
          title="Prediction Index"
          value={`${Math.round(forecast.confidence * 100)}%`}
          change="High Conf."
          changeType="positive"
          icon={<TrendingUp className="h-5 w-5 text-blue-400" />}
          color="text-blue-400 bg-blue-500"
        />
        <StatCard
          title="Active Alerts"
          value={stats.activeAlerts}
          change="3 Critical"
          changeType="negative"
          icon={<AlertTriangle className="h-5 w-5 text-red-400" />}
          color="text-red-400 bg-red-500"
        />
      </motion.div>

      {/* Map and Main Charts grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Interactive Map Box */}
        <div className="lg:col-span-7 flex flex-col h-[480px] rounded-2xl border border-white/[0.08] bg-[#1E293B] overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <div className="flex items-center gap-2">
              <Compass className="h-5 w-5 text-tv-primary animate-pulse" />
              <span className="text-sm font-bold text-tv-text">Live Traffic Hotspots</span>
            </div>
            <span className="rounded-full bg-tv-emerald/10 px-2 py-0.5 text-[10px] font-bold text-tv-emerald flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-tv-emerald animate-ping" />
              Map Live
            </span>
          </div>

          <div className="flex-1 w-full relative z-10">
            <MapContainer
              center={[40.7484, -73.9857]}
              zoom={13}
              className="h-full w-full"
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              {checkpoints.map((pt) => (
                <Circle
                  key={pt.id}
                  center={pt.coords}
                  radius={pt.radius}
                  pathOptions={{
                    color: pt.color,
                    fillColor: pt.color,
                    fillOpacity: 0.35,
                    weight: 1.5
                  }}
                >
                  <Popup>
                    <div className="p-1 min-w-[150px] text-slate-800 dark:text-tv-text">
                      <h4 className="text-xs font-bold border-b border-slate-200 pb-1 mb-1.5">{pt.name}</h4>
                      <p className="text-[11px] leading-relaxed my-0.5"><strong>Congestion:</strong> <span style={{ color: pt.color }} className="font-semibold">{pt.level}</span></p>
                      <p className="text-[11px] leading-relaxed my-0.5"><strong>Avg Speed:</strong> {pt.speed}</p>
                      <p className="text-[11px] leading-relaxed my-0.5"><strong>Flow Rate:</strong> {pt.flow}</p>
                    </div>
                  </Popup>
                </Circle>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Charts and forecast Box */}
        <div className="lg:col-span-5 flex flex-col h-[480px] rounded-2xl border border-white/[0.08] bg-[#1E293B] overflow-hidden">
          <div className="border-b border-white/[0.06] px-5 py-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-tv-primary" />
              <span className="text-sm font-bold text-tv-text">Live Traffic Flow Rate (Hourly)</span>
            </div>
          </div>
          <div className="flex-1 p-5 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCongestion" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="time" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderColor: 'rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    color: '#F8FAFC',
                    fontSize: '12px'
                  }}
                />
                <Area type="monotone" dataKey="volume" name="Vehicles" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorVolume)" />
                <Area type="monotone" dataKey="congestion" name="Congestion %" stroke="#F59E0B" strokeWidth={1.5} fillOpacity={1} fill="url(#colorCongestion)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Lower Row widgets */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Weather & Safety Widget */}
        <div className="tv-glass rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/[0.04] pb-3 mb-4">
              <span className="text-sm font-bold text-tv-text flex items-center gap-2">
                <CloudRain className="h-4.5 w-4.5 text-blue-400" />
                Weather &amp; Safety
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-tv-muted">New York HQ</span>
            </div>
            
            <div className="flex items-center gap-4 py-2">
              <span className="text-4xl font-extrabold text-white">21°C</span>
              <div className="text-left">
                <span className="block text-xs font-semibold text-tv-text">Heavy Rainfall</span>
                <span className="text-[10px] text-tv-muted leading-relaxed">Wet roads, visibility reduced by 30%</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 rounded-xl bg-tv-orange/10 border border-tv-orange/20 p-3">
            <span className="block text-xs font-bold text-tv-orange flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" /> Safety Advisory
            </span>
            <p className="mt-1 text-[11px] text-tv-text/90 leading-relaxed">
              Wet conditions detected. System recommends reducing speeds by 15% on highway links. Speed cameras automated limits updated.
            </p>
          </div>
        </div>

        {/* Weekly distribution chart */}
        <div className="tv-glass rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-3 mb-4">
            <span className="text-sm font-bold text-tv-text flex items-center gap-2">
              <Car className="h-4.5 w-4.5 text-tv-primary" />
              Weekly Traffic Peak Volume
            </span>
          </div>
          
          <div className="flex-1 h-36 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderColor: 'rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    color: '#F8FAFC',
                    fontSize: '11px'
                  }}
                />
                <Bar dataKey="average" name="Avg Volume" fill="#1E293B" stroke="rgba(255, 255, 255, 0.12)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="peak" name="Peak Volume" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent critical alerts list */}
        <div className="tv-glass rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/[0.04] pb-3 mb-3">
              <span className="text-sm font-bold text-tv-text flex items-center gap-2">
                <Bell className="h-4.5 w-4.5 text-red-400 animate-swing" />
                Live Incidents
              </span>
              <span className="text-[10px] font-bold text-red-400">Critical</span>
            </div>
            
            <div className="space-y-3 mt-3">
              <div className="flex items-start gap-3 rounded-lg hover:bg-white/[0.02] p-1.5 transition-colors">
                <span className="h-2 w-2 mt-1.5 rounded-full bg-red-500 shrink-0" />
                <div>
                  <span className="block text-xs font-semibold text-tv-text leading-tight">Accident: Manhattan Bridge Outbound</span>
                  <span className="block text-[10px] text-tv-muted mt-0.5">2 lanes blocked, delay: 22 mins</span>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg hover:bg-white/[0.02] p-1.5 transition-colors">
                <span className="h-2 w-2 mt-1.5 rounded-full bg-tv-orange shrink-0" />
                <div>
                  <span className="block text-xs font-semibold text-tv-text leading-tight">Construction: FDR Drive Northbound</span>
                  <span className="block text-[10px] text-tv-muted mt-0.5">1 lane closed, speed limit 30 km/h</span>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg hover:bg-white/[0.02] p-1.5 transition-colors">
                <span className="h-2 w-2 mt-1.5 rounded-full bg-red-500 shrink-0" />
                <div>
                  <span className="block text-xs font-semibold text-tv-text leading-tight">Emergency: 5th Avenue Gas Leak</span>
                  <span className="block text-[10px] text-tv-muted mt-0.5">Road blocked at 34th St intersection</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-white/[0.04]">
            <button className="flex w-full items-center justify-center gap-1 text-xs font-bold text-tv-primary hover:text-blue-400 transition-colors">
              <Navigation className="h-3.5 w-3.5" /> Optimize Routes Now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
export default DashboardPage
