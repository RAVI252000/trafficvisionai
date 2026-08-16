import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapContainer, TileLayer, Circle, Polyline, Popup, useMap } from 'react-leaflet'
import {
  Navigation, MapPin, Clock, Route,
  Info, Compass, RefreshCw, Gauge, Leaf, Sparkles
} from 'lucide-react'
import { predictionService } from '../../services/predictionService'
import 'leaflet/dist/leaflet.css'

// Helper component to adjust map bounds to show all path polylines
function FitRouteBounds({ path1, path2, path3 }: { path1?: any[], path2?: any[], path3?: any[] }) {
  const map = useMap()
  useEffect(() => {
    const allCoords = [...(path1 || []), ...(path2 || []), ...(path3 || [])]
    if (allCoords.length > 0) {
      const latitudes = allCoords.map(c => c[0])
      const longitudes = allCoords.map(c => c[1])
      
      const minLat = Math.min(...latitudes)
      const maxLat = Math.max(...latitudes)
      const minLng = Math.min(...longitudes)
      const maxLng = Math.max(...longitudes)

      map.fitBounds([
        [minLat, minLng],
        [maxLat, maxLng]
      ], { padding: [40, 40] })
    }
  }, [path1, path2, path3, map])
  return null
}

export function RouteAnalysisPage() {
  const [roads, setRoads] = useState<string[]>([])
  const [sourceRoad, setSourceRoad] = useState<string>('')
  const [destRoad, setDestRoad] = useState<string>('')
  const [routes, setRoutes] = useState<any[]>([])
  const [activeRouteId, setActiveRouteId] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(false)

  // Route calculation filters
  const [preference, setPreference] = useState<string>('Fastest')
  const [weather, setWeather] = useState<string>('Clear')
  const [roadCondition, setRoadCondition] = useState<string>('Excellent')

  // Travel Time Calculator State (Estimation Module)
  const [calcDistance, setCalcDistance] = useState<number>(15)
  const [calcCongestion, setCalcCongestion] = useState<number>(45)
  const [calcRoadType, setCalcRoadType] = useState<string>('Major')
  const [calcWeather, setCalcWeather] = useState<string>('Clear')
  const [calcRoadCondition, setCalcRoadCondition] = useState<string>('Excellent')
  const [calcResults, setCalcResults] = useState<any>(null)
  const [loadingCalc, setLoadingCalc] = useState<boolean>(false)

  // Load available roads on mount
  useEffect(() => {
    const fetchRoads = async () => {
      try {
        const roadsList = await predictionService.getAvailableRoads()
        setRoads(roadsList)
        if (roadsList.length > 1) {
          setSourceRoad(roadsList.includes('A1') ? 'A1' : roadsList[0])
          setDestRoad(roadsList.includes('A3112') ? 'A3112' : roadsList[1])
        }
      } catch (error) {
        console.error('Failed to load roads in RouteAnalysis:', error)
      }
    }
    fetchRoads()
  }, [])

  // Calculate Routes Recommendation
  const handleCalculateRoutes = async () => {
    if (!sourceRoad || !destRoad) return
    setLoading(true)
    try {
      const data = await predictionService.recommendRoutes(
        sourceRoad,
        destRoad,
        preference,
        weather,
        roadCondition
      )
      setRoutes(data)
      // Pick the first route as active (since backend sorts them by preference)
      if (data.length > 0) {
        setActiveRouteId(data[0].id)
      }
    } catch (error) {
      console.error('Failed to compute route recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate Travel Time Estimation dynamically
  const handleEstimateTravelTime = async () => {
    setLoadingCalc(true)
    try {
      const data = await predictionService.estimateTravelTime(
        calcDistance,
        calcCongestion,
        calcRoadType,
        calcWeather,
        calcRoadCondition
      )
      setCalcResults(data)
    } catch (error) {
      console.error('Failed to estimate travel time:', error)
    } finally {
      setLoadingCalc(false)
    }
  }

  // Run initial route recommendations and travel time estimations once roads load
  useEffect(() => {
    if (sourceRoad && destRoad) {
      handleCalculateRoutes()
    }
  }, [sourceRoad, destRoad, preference, weather, roadCondition])

  useEffect(() => {
    handleEstimateTravelTime()
  }, [calcDistance, calcCongestion, calcRoadType, calcWeather, calcRoadCondition])

  const activeRoute = routes.find(r => r.id === activeRouteId)

  // Color mapping

  const getDelayBadgeClass = (level: string) => {
    if (level === 'LOW') return 'bg-tv-emerald/10 text-tv-emerald border-tv-emerald/20'
    if (level === 'MEDIUM') return 'bg-tv-orange/10 text-tv-orange border-tv-orange/20'
    return 'bg-red-500/10 text-red-400 border-red-500/20'
  }

  const routeColors = ['#3B82F6', '#F59E0B', '#8B5CF6'] // Blue, Orange, Purple

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-tv-text flex items-center gap-2">
          <Route className="h-7 w-7 text-tv-primary" />
          Alternate Route Recommendation & Time Estimation
        </h1>
        <p className="text-tv-muted mt-1">
          Perform pathfinding analysis, compare travel times, and view congestion bypass recommendations.
        </p>
      </div>

      {/* Select Source/Destination & Conditions Panel */}
      <div className="bg-tv-surface/40 border border-tv-border p-5 rounded-2xl backdrop-blur-md space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center justify-between border-b border-tv-border pb-3">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-tv-primary animate-pulse" />
            <h4 className="text-xs font-bold text-tv-text uppercase tracking-wider">Route Optimization Settings</h4>
          </div>
          
          {/* Preferences tabs selector */}
          <div className="flex bg-tv-surface border border-tv-border p-1 rounded-xl gap-1">
            {['Fastest', 'Shortest', 'Eco'].map((pref) => {
              const isActive = preference === pref
              const label = pref === 'Eco' ? 'Eco-Friendly 🍃' : (pref === 'Shortest' ? 'Shortest 📏' : 'Fastest ⚡')
              return (
                <button
                  key={pref}
                  type="button"
                  onClick={() => setPreference(pref)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-tv-primary text-tv-text shadow-md' 
                      : 'text-tv-muted hover:text-tv-text hover:bg-black/[0.02]'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <label className="text-xs text-tv-muted flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-tv-emerald" />
              Source Checkpoint
            </label>
            <select
              value={sourceRoad}
              onChange={(e) => setSourceRoad(e.target.value)}
              className="w-full bg-tv-surface border border-tv-border rounded-xl px-3 py-2 text-xs text-tv-text focus:outline-none focus:border-tv-primary cursor-pointer font-semibold"
            >
              {roads.map(r => (
                <option key={`src-${r}`} value={r} disabled={r === destRoad}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-tv-muted flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-red-400" />
              Destination Checkpoint
            </label>
            <select
              value={destRoad}
              onChange={(e) => setDestRoad(e.target.value)}
              className="w-full bg-tv-surface border border-tv-border rounded-xl px-3 py-2 text-xs text-tv-text focus:outline-none focus:border-tv-primary cursor-pointer font-semibold"
            >
              {roads.map(r => (
                <option key={`dest-${r}`} value={r} disabled={r === sourceRoad}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-tv-muted flex items-center gap-1">
              <RefreshCw className="h-3.5 w-3.5 text-tv-primary" />
              Current Weather
            </label>
            <select
              value={weather}
              onChange={(e) => setWeather(e.target.value)}
              className="w-full bg-tv-surface border border-tv-border rounded-xl px-3 py-2 text-xs text-tv-text focus:outline-none focus:border-tv-primary cursor-pointer"
            >
              <option value="Clear">Sunny / Clear</option>
              <option value="Rain">Rainy (Traffic Speed -15%)</option>
              <option value="Snow">Snowy / Icy (Traffic Speed -35%)</option>
              <option value="Fog">Heavy Fog (Traffic Speed -25%)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-tv-muted flex items-center gap-1">
              <Info className="h-3.5 w-3.5 text-tv-orange" />
              Roadway Condition
            </label>
            <select
              value={roadCondition}
              onChange={(e) => setRoadCondition(e.target.value)}
              className="w-full bg-tv-surface border border-tv-border rounded-xl px-3 py-2 text-xs text-tv-text focus:outline-none focus:border-tv-primary cursor-pointer"
            >
              <option value="Excellent">Normal / Excellent</option>
              <option value="Good">Good</option>
              <option value="Maintenance">Maintenance Zones (-25% Capacity)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleCalculateRoutes}
            disabled={loading}
            className="rounded-xl bg-tv-primary px-5 py-2.5 text-xs font-bold text-tv-text transition-all hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            <Compass className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Recalculate Optimal Paths</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <div key="loading" className="flex h-[45vh] w-full items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="h-9 w-9 animate-spin text-tv-primary" />
              <span className="text-sm font-medium text-tv-muted">Analysing OSRM routes & estimating traffic delays...</span>
            </div>
          </div>
        ) : (
          <motion.div
            key="content"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            {/* Split Map and Route Cards layout */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              
              {/* Left 2 Columns: Map Display */}
              <motion.div variants={itemVariants} className="lg:col-span-2 tv-glass rounded-2xl h-[450px] overflow-hidden relative">
                {routes.length > 0 && activeRoute ? (
                  <MapContainer
                    center={activeRoute.path[0]}
                    zoom={12}
                    className="h-full w-full z-0"
                  >
                    <TileLayer
                      url="https://mt1.google.com/vt/lyrs=m,traffic&x={x}&y={y}&z={z}"
                      attribution='&copy; Google Maps'
                    />
                    
                    {/* Render all routes with different colors */}
                    {routes.map((rt, idx) => {
                      const isSelected = activeRouteId === rt.id
                      return (
                        <Polyline
                          key={rt.id}
                          positions={rt.path}
                          pathOptions={{
                            color: routeColors[idx % 3],
                            weight: isSelected ? 5.5 : 2.5,
                            opacity: isSelected ? 0.95 : 0.4,
                            lineCap: 'round',
                            lineJoin: 'round'
                          }}
                          eventHandlers={{
                            click: () => setActiveRouteId(rt.id)
                          }}
                        >
                          <Popup>
                            <div className="text-xs font-sans text-slate-900">
                              <strong>{rt.name}</strong><br />
                              Distance: {rt.distance_km} km<br />
                              Time: {rt.estimated_time} min ({rt.traffic_status})
                            </div>
                          </Popup>
                        </Polyline>
                      )
                    })}

                    {/* Source & Destination markers */}
                    <Circle
                      center={routes[0].path[0]}
                      radius={350}
                      pathOptions={{ fillColor: '#10B981', fillOpacity: 0.8, color: '#10B981', weight: 2 }}
                    >
                      <Popup>
                        <div className="text-xs font-sans text-slate-900">
                          <strong>Source:</strong> {sourceRoad}
                        </div>
                      </Popup>
                    </Circle>

                    <Circle
                      center={routes[0].path[routes[0].path.length - 1]}
                      radius={350}
                      pathOptions={{ fillColor: '#EF4444', fillOpacity: 0.8, color: '#EF4444', weight: 2 }}
                    >
                      <Popup>
                        <div className="text-xs font-sans text-slate-900">
                          <strong>Destination:</strong> {destRoad}
                        </div>
                      </Popup>
                    </Circle>

                    <FitRouteBounds
                      path1={routes[0]?.path}
                      path2={routes[1]?.path}
                      path3={routes[2]?.path}
                    />
                  </MapContainer>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-tv-muted bg-tv-surface/30">
                    Map visualization will display once roads are selected.
                  </div>
                )}
              </motion.div>

              {/* Right Column: Interactive Route List */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-tv-text uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Navigation className="h-4 w-4 text-tv-primary" />
                  Recommended Routes
                </h3>
                {routes.map((rt, idx) => {
                  const isSelected = activeRouteId === rt.id

                  
                  // Set border color matching route color
                  const rColor = routeColors[idx % 3]

                  return (
                    <motion.div
                      key={rt.id}
                      onClick={() => setActiveRouteId(rt.id)}
                      className={`p-4 rounded-xl border bg-black/[0.01] hover:bg-black/[0.03] transition-all cursor-pointer ${
                        isSelected ? 'bg-tv-primary/5 text-tv-text' : 'text-tv-muted'
                      }`}
                      style={{
                        borderLeftColor: isSelected ? rColor : undefined,
                        borderLeftWidth: isSelected ? '4px' : undefined
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-bold text-tv-text flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: rColor }}></span>
                            {rt.name}
                          </h4>
                          <p className="text-[10px] text-tv-muted mt-1">
                            Condition: <span className="font-semibold text-tv-text">{rt.road_condition}</span>
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded border text-[9px] font-bold ${getDelayBadgeClass(rt.delay_level)}`}>
                          {rt.traffic_status}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                        <div className="bg-black/[0.02] border border-tv-border p-1.5 rounded-lg">
                          <p className="text-[8px] text-tv-muted uppercase font-medium">Distance</p>
                          <p className="text-xs font-bold text-tv-text mt-0.5">{rt.distance_km} km</p>
                        </div>
                        <div className="bg-black/[0.02] border border-tv-border p-1.5 rounded-lg">
                          <p className="text-[8px] text-tv-muted uppercase font-medium">Time</p>
                          <p className="text-xs font-bold text-tv-text mt-0.5">{rt.estimated_time} min</p>
                        </div>
                        <div className="bg-black/[0.02] border border-tv-border p-1.5 rounded-lg">
                          <p className="text-[8px] text-tv-muted uppercase font-medium">Delay</p>
                          <p className="text-xs font-bold text-red-400 mt-0.5">+{rt.delay} min</p>
                        </div>
                      </div>

                      {/* Eco Emission Metrics */}
                      <div className="mt-2 flex justify-between items-center text-[10px] text-tv-muted bg-black/[0.01] px-2.5 py-1.5 rounded-lg border border-tv-border">
                        <span className="flex items-center gap-1">
                          <Leaf className="h-3.5 w-3.5 text-tv-emerald" />
                          Eco Footprint:
                        </span>
                        <span className="font-bold text-tv-text">
                          {rt.co2_kg} kg CO₂ &bull; {rt.fuel_liters}L
                        </span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* Travel Time Estimation Module Widget */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Estimator Input Form */}
              <motion.div variants={itemVariants} className="tv-glass p-5 rounded-2xl md:col-span-1 space-y-4">
                <h4 className="text-sm font-bold text-tv-text flex items-center gap-1.5 border-b border-tv-border pb-3">
                  <Gauge className="h-4.5 w-4.5 text-tv-primary" />
                  Travel Time Estimation Simulator
                </h4>

                {/* Distance slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-tv-muted">Trip Distance:</span>
                    <span className="font-bold text-tv-text">{calcDistance} km</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={calcDistance}
                    onChange={(e) => setCalcDistance(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-black/[0.04] rounded-lg appearance-none cursor-pointer accent-tv-primary"
                  />
                </div>

                {/* Congestion slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-tv-muted">Traffic Congestion Index:</span>
                    <span className="font-bold text-tv-text">{calcCongestion}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={calcCongestion}
                    onChange={(e) => setCalcCongestion(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-black/[0.04] rounded-lg appearance-none cursor-pointer accent-tv-orange"
                  />
                </div>

                {/* Road category */}
                <div className="space-y-1.5">
                  <label className="text-xs text-tv-muted">Road Speed Class</label>
                  <select
                    value={calcRoadType}
                    onChange={(e) => setCalcRoadType(e.target.value)}
                    className="w-full bg-tv-surface border border-tv-border rounded-xl px-3 py-2 text-xs text-tv-text focus:outline-none focus:border-tv-primary cursor-pointer font-semibold"
                  >
                    <option value="Major">Major Arterial (60 km/h baseline)</option>
                    <option value="Minor">Minor Collector (40 km/h baseline)</option>
                  </select>
                </div>

                {/* Simulator Weather conditions */}
                <div className="space-y-1.5">
                  <label className="text-xs text-tv-muted">Weather Conditions</label>
                  <select
                    value={calcWeather}
                    onChange={(e) => setCalcWeather(e.target.value)}
                    className="w-full bg-tv-surface border border-tv-border rounded-xl px-3 py-2 text-xs text-tv-text focus:outline-none focus:border-tv-primary cursor-pointer"
                  >
                    <option value="Clear">Sunny / Clear</option>
                    <option value="Rain">Rainy (Adds Congestion Delay)</option>
                    <option value="Snow">Snowy (Adds Heavy Congestion Delay)</option>
                    <option value="Fog">Heavy Fog (Adds Visibility Delay)</option>
                  </select>
                </div>

                {/* Simulator Road conditions */}
                <div className="space-y-1.5">
                  <label className="text-xs text-tv-muted">Roadway Conditions</label>
                  <select
                    value={calcRoadCondition}
                    onChange={(e) => setCalcRoadCondition(e.target.value)}
                    className="w-full bg-tv-surface border border-tv-border rounded-xl px-3 py-2 text-xs text-tv-text focus:outline-none focus:border-tv-primary cursor-pointer"
                  >
                    <option value="Excellent">Normal / Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Maintenance">Road Maintenance (-25% Speed limit)</option>
                  </select>
                </div>
              </motion.div>

              {/* Estimation Results Panel */}
              <motion.div variants={itemVariants} className="md:col-span-2 tv-glass p-5 rounded-2xl flex flex-col justify-between">
                <h4 className="text-sm font-bold text-tv-text flex items-center gap-1.5 border-b border-tv-border pb-3 mb-4">
                  <Clock className="h-4.5 w-4.5 text-tv-emerald" />
                  Estimated Time Calculations
                </h4>

                {loadingCalc ? (
                  <div className="flex-1 flex items-center justify-center py-6">
                    <RefreshCw className="h-6 w-6 animate-spin text-tv-primary" />
                  </div>
                ) : calcResults ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div className="bg-black/[0.01] border border-tv-border p-4 rounded-xl text-center">
                        <p className="text-[10px] text-tv-muted uppercase font-semibold">Normal Time</p>
                        <p className="text-xl font-bold text-tv-text mt-1">{calcResults.normal_time} min</p>
                        <span className="text-[9px] text-tv-muted">No traffic delay</span>
                      </div>
                      
                      <div className="bg-black/[0.01] border border-tv-border p-4 rounded-xl text-center">
                        <p className="text-[10px] text-tv-muted uppercase font-semibold">Traffic Delay</p>
                        <p className="text-xl font-bold text-red-400 mt-1">+{calcResults.delay} min</p>
                        <span className="text-[9px] text-tv-muted">Queueing lag</span>
                      </div>

                      <div className="bg-black/[0.01] border border-tv-border p-4 rounded-xl text-center">
                        <p className="text-[10px] text-tv-muted uppercase font-semibold">Total Est. Time</p>
                        <p className="text-xl font-bold text-tv-primary mt-1">{calcResults.estimated_time} min</p>
                        <span className="text-[9px] text-tv-muted">Sum trip time</span>
                      </div>

                      <div className="bg-black/[0.01] border border-tv-border p-4 rounded-xl text-center flex flex-col justify-between items-center">
                        <p className="text-[10px] text-tv-muted uppercase font-semibold">Delay Impact</p>
                        <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold mt-1.5 ${getDelayBadgeClass(calcResults.delay_level)}`}>
                          {calcResults.delay_level} DELAY
                        </span>
                        <span className="text-[9px] text-tv-muted mt-1">+{calcResults.traffic_impact}% time add</span>
                      </div>
                    </div>

                    {/* Eco & Weather details banner */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                      <div className="bg-tv-emerald/5 border border-tv-emerald/10 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-tv-muted">
                        <Leaf className="h-4.5 w-4.5 text-tv-emerald flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-tv-emerald">Estimated Trip Emissions</p>
                          <p className="text-[11px] mt-0.5">
                            This trip will produce approx <strong className="text-tv-text">{calcResults.co2_kg} kg</strong> of CO₂ and consume <strong className="text-tv-text">{calcResults.fuel_liters} Liters</strong> of fuel. Driving during high congestion increases emissions due to idling.
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-tv-primary/5 border border-tv-border p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-tv-muted">
                        <Info className="h-4.5 w-4.5 text-tv-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-tv-text">Speed & Condition Adjustments</p>
                          <p className="text-[11px] mt-0.5">
                            Baseline free-flow speed is {calcRoadType === 'Major' ? '60' : '40'} km/h. 
                            {calcWeather !== 'Clear' && ` Weather (${calcWeather}) and`} 
                            {calcRoadCondition === 'Maintenance' ? ' active Road Maintenance' : ' road conditions'} adjusted base capacity. 
                            Congestion index ({calcCongestion}%) introduces {calcResults.traffic_impact}% delay.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-xs text-tv-muted py-6">
                    Enter variables to run travel time calculations.
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default RouteAnalysisPage
