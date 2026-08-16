import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapContainer, TileLayer, Circle, Popup, useMap } from 'react-leaflet'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts'
import {
  MapPin,
  Calendar,
  TrendingUp,
  Clock,
  Gauge,
  Car,
  Truck,
  Bus,
  Bike,
  Info,
  Sparkles,
  RefreshCw,
  Search,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react'
import { predictionService } from '../../services/predictionService'
import 'leaflet/dist/leaflet.css'

// Helper component to fly the Leaflet map to new coordinates when the selected road changes
function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, map.getZoom())
  }, [center, map])
  return null
}

export function TrafficPredictionPage() {
  const [roads, setRoads] = useState<string[]>([])
  const [selectedRoad, setSelectedRoad] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [loading, setLoading] = useState<boolean>(true)
  const [forecastData, setForecastData] = useState<any>(null)
  const [selectedHour, setSelectedHour] = useState<number>(17) // default to peak/evening hour

  // Tab state: 'hourly' (24h forecast) vs 'workflow' (+30m to +3h timeline)
  const [activeTab, setActiveTab] = useState<'hourly' | 'workflow'>('hourly')
  const [workflowData, setWorkflowData] = useState<any>(null)
  const [loadingWorkflow, setLoadingWorkflow] = useState<boolean>(false)

  // Load the list of unique roads
  useEffect(() => {
    const fetchRoads = async () => {
      try {
        const roadsList = await predictionService.getAvailableRoads()
        setRoads(roadsList)
        if (roadsList.length > 0) {
          // Default to first road or A1
          const defaultRoad = roadsList.includes('A1') ? 'A1' : roadsList[0]
          setSelectedRoad(defaultRoad)
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error('Failed to load roads:', error)
        setLoading(false)
      }
    }
    fetchRoads()
  }, [])

  // Fetch 24h forecast data whenever road or date changes
  useEffect(() => {
    if (!selectedRoad) {
      setLoading(false)
      return
    }

    const fetchForecast = async () => {
      setLoading(true)
      try {
        const data = await predictionService.getForecast(selectedRoad, selectedDate)
        setForecastData(data)
        // Reset selected hour to the predicted peak hour
        const peakHourInt = parseInt(data.peak_hour.split(':')[0])
        setSelectedHour(peakHourInt)
      } catch (error) {
        console.error('Failed to fetch forecast:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchForecast()
  }, [selectedRoad, selectedDate])

  // Fetch workflow data when road/date or activeTab switches to workflow
  useEffect(() => {
    if (!selectedRoad || activeTab !== 'workflow') return

    const fetchWorkflow = async () => {
      setLoadingWorkflow(true)
      try {
        const data = await predictionService.getCongestionForecastWorkflow(selectedRoad, selectedDate)
        setWorkflowData(data)
      } catch (error) {
        console.error('Failed to fetch workflow forecast:', error)
      } finally {
        setLoadingWorkflow(false)
      }
    }
    fetchWorkflow()
  }, [selectedRoad, selectedDate, activeTab])

  const activeForecast = forecastData?.forecast?.find(
    (f: any) => parseInt(f.time.split(':')[0]) === selectedHour
  ) || forecastData?.forecast?.[selectedHour]

  // Get color for congestion levels
  const getCongestionColor = (index: number) => {
    if (index < 30) return '#10B981' // Green
    if (index < 60) return '#F59E0B' // Orange/Yellow
    if (index < 85) return '#EF4444' // Red
    return '#B91C1C' // Critical Dark Red
  }

  const getCongestionBg = (index: number) => {
    if (index < 30) return 'bg-tv-emerald/10 text-tv-emerald border-tv-emerald/20'
    if (index < 60) return 'bg-tv-orange/10 text-tv-orange border-tv-orange/20'
    if (index < 85) return 'bg-red-500/10 text-red-400 border-red-500/20'
    return 'bg-rose-700/20 text-rose-400 border-rose-700/30'
  }

  // Parse vehicle breakdown data for bar chart
  const breakdownData = activeForecast
    ? [
        { name: 'Cars & Taxis', count: activeForecast.breakdown.cars_and_taxis, color: '#3B82F6', icon: Car },
        { name: 'Vans / LGVs', count: activeForecast.breakdown.lgvs, color: '#10B981', icon: Truck },
        { name: 'Trucks / HGVs', count: activeForecast.breakdown.all_hgvs, color: '#F59E0B', icon: Truck },
        { name: 'Buses', count: activeForecast.breakdown.buses_and_coaches, color: '#8B5CF6', icon: Bus },
        { name: 'Cycles', count: activeForecast.breakdown.pedal_cycles, color: '#EC4899', icon: Bike }
      ]
    : []

  const containerVariants = {
    hidden: { opacity: 0, y: 15 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Section */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-tv-text flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-tv-primary animate-pulse" />
            Traffic Flow & Congestion Prediction
          </h1>
          <p className="text-tv-muted mt-1">
            Machine Learning forecasting of traffic densities, delays, and vehicle distributions.
          </p>
        </div>

        {/* Filters Panel */}
        <div className="flex flex-wrap items-center gap-3 bg-black/[0.02] border border-tv-border p-3 rounded-2xl backdrop-blur-md">
          {/* Road Dropdown */}
          <div className="relative flex items-center bg-tv-surface border border-tv-border px-3 py-2 rounded-xl">
            <Search className="h-4 w-4 text-tv-muted mr-2" />
            <select
              value={selectedRoad}
              onChange={(e) => setSelectedRoad(e.target.value)}
              className="bg-transparent text-sm text-tv-text focus:outline-none cursor-pointer max-w-[200px]"
            >
              {roads.map((road) => (
                <option key={road} value={road}>
                  {road}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-tv-surface border border-tv-border px-3 py-2 rounded-xl">
            <Calendar className="h-4 w-4 text-tv-primary" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm text-tv-text focus:outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Tabs Segment Control */}
      <div className="flex border-b border-tv-border pb-0.5">
        <button
          onClick={() => setActiveTab('hourly')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'hourly'
              ? 'border-tv-primary text-tv-text'
              : 'border-transparent text-tv-muted hover:text-tv-text'
          }`}
        >
          24-Hour Forecast Flow
        </button>
        <button
          onClick={() => setActiveTab('workflow')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'workflow'
              ? 'border-tv-primary text-tv-text'
              : 'border-transparent text-tv-muted hover:text-tv-text'
          }`}
        >
          Congestion Forecasting Workflow (+30m to +3h)
        </button>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <div key="loading" className="flex h-[50vh] w-full items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <RefreshCw className="h-10 w-10 animate-spin text-tv-primary" />
              <span className="text-sm font-medium text-tv-muted">Computing model forecast trends…</span>
            </div>
          </div>
        ) : activeTab === 'hourly' && forecastData ? (
          /* Hourly 24h Prediction Panel */
          <motion.div
            key="hourly-content"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <motion.div variants={cardVariants} className="tv-glass p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-tv-muted uppercase tracking-wider">Peak Congestion</p>
                  <h3 className="text-2xl font-bold mt-1 text-tv-text">{forecastData.max_congestion}%</h3>
                  <p className="text-xs text-tv-muted mt-1">Expected at {forecastData.peak_hour}</p>
                </div>
                <div className={`p-3.5 rounded-xl border ${getCongestionBg(forecastData.max_congestion)}`}>
                  <TrendingUp className="h-6 w-6" />
                </div>
              </motion.div>

              <motion.div variants={cardVariants} className="tv-glass p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-tv-muted uppercase tracking-wider">Estimated Max Delay</p>
                  <h3 className="text-2xl font-bold mt-1 text-tv-text">{forecastData.estimated_delay_minutes} min</h3>
                  <p className="text-xs text-tv-muted mt-1">Average road delay prediction</p>
                </div>
                <div className="p-3.5 rounded-xl bg-tv-orange/10 text-tv-orange border border-tv-orange/20">
                  <Clock className="h-6 w-6" />
                </div>
              </motion.div>

              <motion.div variants={cardVariants} className="tv-glass p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-tv-muted uppercase tracking-wider">Expected Avg Speed</p>
                  <h3 className="text-2xl font-bold mt-1 text-tv-text">
                    {forecastData.forecast[selectedHour]?.average_speed || 35} km/h
                  </h3>
                  <p className="text-xs text-tv-muted mt-1">At selected hour {String(selectedHour).padStart(2, '0')}:00</p>
                </div>
                <div className="p-3.5 rounded-xl bg-tv-emerald/10 text-tv-emerald border border-tv-emerald/20">
                  <Gauge className="h-6 w-6" />
                </div>
              </motion.div>

              <motion.div variants={cardVariants} className="tv-glass p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-tv-muted uppercase tracking-wider">Model Confidence</p>
                  <h3 className="text-2xl font-bold mt-1 text-tv-text">{Math.round(forecastData.confidence * 100)}%</h3>
                  <p className="text-xs text-tv-muted mt-1">R² score validation rate</p>
                </div>
                <div className="p-3.5 rounded-xl bg-tv-primary/10 text-tv-primary border border-tv-primary/20">
                  <Sparkles className="h-6 w-6" />
                </div>
              </motion.div>
            </div>

            {/* Main Interactive Forecast & Visualization Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              
              {/* Left Panel: 24h Forecast Trend Chart */}
              <motion.div
                variants={cardVariants}
                className="lg:col-span-2 tv-glass p-6 rounded-2xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-tv-text">24-Hour Forecast Flow & Congestion</h3>
                      <p className="text-xs text-tv-muted">Click or hover to inspect specific hourly breakdown</p>
                    </div>
                    <div className="flex gap-4 text-xs font-semibold">
                      <span className="flex items-center gap-1.5 text-tv-primary">
                        <span className="h-2.5 w-2.5 rounded-full bg-tv-primary"></span>
                        Volume (vehicles/hr)
                      </span>
                      <span className="flex items-center gap-1.5 text-tv-orange">
                        <span className="h-2.5 w-2.5 rounded-full bg-tv-orange"></span>
                        Congestion Level (%)
                      </span>
                    </div>
                  </div>

                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={forecastData.forecast}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        onClick={(state) => {
                          if (state && typeof state.activeTooltipIndex === 'number') {
                            setSelectedHour(state.activeTooltipIndex)
                          }
                        }}
                      >
                        <defs>
                          <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ff5b00" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#ff5b00" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="colorCongestion" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis
                          dataKey="time"
                          stroke="var(--color-tv-muted)"
                          fontSize={11}
                          tickLine={false}
                        />
                        <YAxis
                          yAxisId="left"
                          stroke="var(--color-tv-muted)"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          stroke="var(--color-tv-muted)"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          domain={[0, 100]}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(30, 41, 59, 0.95)',
                            borderColor: 'rgba(255, 255, 255, 0.08)',
                            borderRadius: '12px',
                            color: '#f8fafc',
                            fontSize: '12px'
                          }}
                          labelFormatter={(label) => `Time: ${label}`}
                        />
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="predicted_volume"
                          stroke="#ff5b00"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#colorVolume)"
                        />
                        <Area
                          yAxisId="right"
                          type="monotone"
                          dataKey="congestion_index"
                          stroke="#f59e0b"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#colorCongestion)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Hour Slider Control */}
                <div className="mt-6 border-t border-tv-border pt-5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-tv-text">
                      Inspect Hour: <span className="text-tv-primary font-bold">{String(selectedHour).padStart(2, '0')}:00</span>
                    </span>
                    <span className="text-xs text-tv-muted">Slide to adjust prediction hour</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="23"
                    value={selectedHour}
                    onChange={(e) => setSelectedHour(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-black/[0.04] rounded-lg appearance-none cursor-pointer accent-tv-primary focus:outline-none"
                  />
                </div>
              </motion.div>

              {/* Right Panel: Embedded Map & Road Details */}
              <div className="space-y-6">
                
                {/* Embedded Map Card */}
                <motion.div variants={cardVariants} className="tv-glass p-5 rounded-2xl h-[240px] flex flex-col justify-between overflow-hidden relative">
                  <div className="z-10 bg-tv-surface/90 border border-tv-border p-3 rounded-xl absolute top-3 left-3 shadow-lg max-w-[220px]">
                    <h4 className="text-xs font-bold text-tv-text flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-tv-primary" />
                      {forecastData.road_name} ({forecastData.road_type} Road)
                    </h4>
                    <p className="text-[10px] text-tv-muted mt-0.5">
                      Coordinates: {forecastData.latitude.toFixed(4)}, {forecastData.longitude.toFixed(4)}
                    </p>
                  </div>

                  <div className="absolute inset-0 z-0 h-full w-full">
                    <MapContainer
                      center={[forecastData.latitude, forecastData.longitude]}
                      zoom={13}
                      zoomControl={false}
                      className="h-full w-full"
                    >
                      <TileLayer
                        url="https://mt1.google.com/vt/lyrs=m,traffic&x={x}&y={y}&z={z}"
                        attribution='&copy; Google Maps'
                      />
                      <Circle
                        center={[forecastData.latitude, forecastData.longitude]}
                        radius={400}
                        pathOptions={{
                          fillColor: getCongestionColor(activeForecast?.congestion_index || 0),
                          fillOpacity: 0.4,
                          color: getCongestionColor(activeForecast?.congestion_index || 0),
                          weight: 2
                        }}
                      >
                        <Popup>
                          <div className="text-xs font-sans text-slate-900">
                            <strong>{forecastData.road_name}</strong><br />
                            Congestion Level: {activeForecast?.congestion_index}% ({activeForecast?.congestion_status})<br />
                            Speed: {activeForecast?.average_speed} km/h
                          </div>
                        </Popup>
                      </Circle>
                      <RecenterMap center={[forecastData.latitude, forecastData.longitude]} />
                    </MapContainer>
                  </div>
                </motion.div>

                {/* Live Info Card */}
                <motion.div variants={cardVariants} className="tv-glass p-5 rounded-2xl">
                  <h4 className="text-sm font-bold text-tv-text flex items-center gap-1.5 border-b border-tv-border pb-3 mb-3">
                    <Info className="h-4 w-4 text-tv-orange" />
                    Hourly Prediction Summary
                  </h4>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-tv-muted">Observation Time:</span>
                      <span className="font-semibold text-tv-text">{String(selectedHour).padStart(2, '0')}:00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tv-muted">Expected Volume:</span>
                      <span className="font-semibold text-tv-text">{(activeForecast?.predicted_volume || 0).toLocaleString()} vehicles/hr</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tv-muted">Expected Capacity:</span>
                      <span className="font-semibold text-tv-text">{(forecastData?.capacity || 0).toLocaleString()} vehicles/hr</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tv-muted">Congestion Status:</span>
                      <span className={`font-semibold px-2 py-0.5 rounded border text-[10px] ${getCongestionBg(activeForecast?.congestion_index || 0)}`}>
                        {activeForecast?.congestion_status} ({activeForecast?.congestion_index}%)
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Vehicle Breakdown Chart */}
            <motion.div variants={cardVariants} className="tv-glass p-6 rounded-2xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-tv-text">Predicted Vehicle Distribution breakdown</h3>
                  <p className="text-xs text-tv-muted">Vehicle categorization forecast for {String(selectedHour).padStart(2, '0')}:00</p>
                </div>
                <div className="text-xs bg-black/[0.03] border border-tv-border px-3.5 py-1.5 rounded-xl font-medium text-tv-text">
                  Total Predicted Flow: <span className="text-tv-primary font-bold">{(activeForecast?.predicted_volume || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* Breakdown Bar Chart */}
                <div className="md:col-span-2 h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={breakdownData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid stroke="rgba(0,0,0,0.05)" horizontal={false} />
                      <XAxis type="number" stroke="var(--color-tv-muted)" fontSize={10} tickLine={false} />
                      <YAxis dataKey="name" type="category" stroke="var(--color-tv-muted)" fontSize={11} tickLine={false} width={100} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(30, 41, 59, 0.95)',
                          borderColor: 'rgba(255, 255, 255, 0.08)',
                          borderRadius: '12px',
                          color: '#f8fafc',
                          fontSize: '11px'
                        }}
                      />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={16}>
                        {breakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Breakdown List Cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-1">
                  {breakdownData.map((item, index) => {
                    const IconComp = item.icon
                    const percentage = activeForecast?.predicted_volume
                      ? ((item.count / activeForecast.predicted_volume) * 100).toFixed(1)
                      : '0.0'
                    return (
                      <div
                        key={index}
                        className="bg-black/[0.02] border border-tv-border p-3 rounded-xl flex items-center gap-3"
                      >
                        <div
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: `${item.color}15`, color: item.color }}
                        >
                          <IconComp className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[10px] text-tv-muted uppercase font-medium">{item.name}</p>
                          <div className="flex items-baseline gap-1.5 mt-0.5">
                            <span className="text-sm font-bold text-tv-text">{item.count.toLocaleString()}</span>
                            <span className="text-[10px] text-tv-muted">({percentage}%)</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : activeTab === 'workflow' ? (
          /* Congestion Forecasting Workflow Timeline Panel */
          loadingWorkflow ? (
            <div className="flex h-[40vh] w-full items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <RefreshCw className="h-9 w-9 animate-spin text-tv-primary" />
                <span className="text-sm font-medium text-tv-muted">Simulating upcoming hours...</span>
              </div>
            </div>
          ) : workflowData ? (
            <motion.div
              key="workflow-content"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-6"
            >
              {/* Aggregated Details Cards */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <div className="tv-glass p-5 rounded-2xl md:col-span-2">
                  <h3 className="text-base font-bold text-tv-text flex items-center gap-2">
                    <Clock className="h-5 w-5 text-tv-primary" />
                    Progression Forecasting Workflow
                  </h3>
                  <p className="text-xs text-tv-muted mt-1">
                    Projects traffic volume progression and potential road bottlenecks. 
                    Uses real-time model interpolation at +30m, +1h, +2h, and +3h increments from the current hour.
                  </p>
                </div>
                <div className="tv-glass p-5 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-tv-muted uppercase tracking-wider">Timeline Confidence</p>
                    <h3 className="text-2xl font-bold mt-1 text-tv-text">
                      {Math.round(workflowData.timeline[0]?.confidence_score * 100)}%
                    </h3>
                    <p className="text-xs text-tv-muted mt-1">Forecasting decay factor applied</p>
                  </div>
                  <div className="p-3 bg-tv-primary/10 text-tv-primary border border-tv-primary/20 rounded-xl">
                    <Sparkles className="h-6 w-6" />
                  </div>
                </div>
              </div>

              {/* timeline intervals grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {workflowData.timeline.map((interval: any, idx: number) => {
                  const isUp = interval.trend === 'UP'
                  const isDown = interval.trend === 'DOWN'
                  const trendColor = isUp
                    ? 'text-red-400 border-red-500/20 bg-red-500/10'
                    : isDown
                    ? 'text-tv-emerald border-tv-emerald/20 bg-tv-emerald/10'
                    : 'text-tv-muted border-tv-border bg-black/[0.02]'
                  
                  const statusBg = getCongestionBg(interval.congestion_index)
                  const progressColor = getCongestionColor(interval.congestion_index)

                  return (
                    <motion.div
                      key={idx}
                      variants={cardVariants}
                      className="tv-glass p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden"
                    >
                      {/* Highlight color bar */}
                      <div
                        className="absolute top-0 left-0 right-0 h-1"
                        style={{ backgroundColor: progressColor }}
                      />

                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-xs font-bold text-tv-muted uppercase tracking-wider">{interval.label}</h4>
                            <span className="text-lg font-bold text-tv-text block mt-1">{interval.time}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded border text-[9px] font-bold ${trendColor} flex items-center gap-0.5`}>
                            {isUp ? <ArrowUp className="h-3 w-3" /> : isDown ? <ArrowDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                            {interval.trend}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-tv-muted">Congestion:</span>
                            <span className="font-bold text-tv-text">{interval.congestion_index}%</span>
                          </div>
                          <div className="w-full bg-black/[0.04] h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${interval.congestion_index}%`,
                                backgroundColor: progressColor
                              }}
                            />
                          </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-tv-border text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-tv-muted">Status:</span>
                            <span className={`font-bold text-[9px] px-1.5 py-0.5 rounded border ${statusBg}`}>
                              {interval.congestion_status}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-tv-muted">Predicted Flow:</span>
                            <span className="font-bold text-tv-text">{interval.predicted_volume.toLocaleString()} /hr</span>
                          </div>
                          <td className="flex justify-between">
                            <span className="text-tv-muted">Expected Speed:</span>
                            <span className="font-bold text-tv-text">{interval.average_speed} km/h</span>
                          </td>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Progress visualizer chart */}
              <motion.div variants={cardVariants} className="tv-glass p-6 rounded-2xl">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-tv-text">Predicted Congestion Progression</h3>
                    <p className="text-xs text-tv-muted">Immediate upcoming congestion progression timeline</p>
                  </div>
                  <div className="flex gap-4 text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-tv-orange">
                      <span className="h-2.5 w-2.5 rounded-full bg-tv-orange"></span>
                      Congestion Index (%)
                    </span>
                  </div>
                </div>

                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={workflowData.timeline} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="workflowCongGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(0,0,0,0.05)" vertical={false} />
                      <XAxis dataKey="time" stroke="var(--color-tv-muted)" fontSize={11} tickLine={false} />
                      <YAxis stroke="var(--color-tv-muted)" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(30, 41, 59, 0.95)',
                          borderColor: 'rgba(255, 255, 255, 0.08)',
                          borderRadius: '12px',
                          color: '#f8fafc',
                          fontSize: '12px'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="congestion_index"
                        name="Congestion Level (%)"
                        stroke="#f59e0b"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#workflowCongGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <div key="empty" className="tv-glass p-8 text-center text-tv-muted">
              Select a road to generate the forecasting timeline.
            </div>
          )
        ) : (
          <div key="error" className="tv-glass p-8 rounded-2xl text-center">
            <p className="text-tv-muted">No forecast prediction data found. Please try another road or date.</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default TrafficPredictionPage
