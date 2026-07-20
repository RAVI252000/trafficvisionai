import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapContainer, TileLayer, Circle, Popup, useMap } from 'react-leaflet'
import {
  MapPin, Activity, Search, RefreshCw,
  Gauge, LayoutGrid, AlertTriangle, ArrowRight
} from 'lucide-react'
import { predictionService } from '../../services/predictionService'
import 'leaflet/dist/leaflet.css'

// Helper component to center and zoom Leaflet map dynamically
function FlyToLocation({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    if (center) {
      map.setView(center, 13)
    }
  }, [center, map])
  return null
}

export function TrafficMonitoringPage() {
  const [locations, setLocations] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  
  // Default map center (centered around average UK coords in dataset)
  const [mapCenter, setMapCenter] = useState<[number, number]>([52.5, -1.5])
  const [selectedRoadName, setSelectedRoadName] = useState<string>('')

  const fetchLocations = async () => {
    setLoading(true)
    try {
      const data = await predictionService.getMonitoringStatus()
      setLocations(data)
      if (data.length > 0) {
        // Average coordinates to center map
        const avgLat = data.reduce((sum: number, loc: any) => sum + loc.latitude, 0) / data.length
        const avgLng = data.reduce((sum: number, loc: any) => sum + loc.longitude, 0) / data.length
        setMapCenter([avgLat, avgLng])
      }
    } catch (error) {
      console.error('Failed to load traffic monitoring locations:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLocations()
  }, [])

  const handleSelectRoad = (loc: any) => {
    setSelectedRoadName(loc.road_name)
    setMapCenter([loc.latitude, loc.longitude])
  }

  const filteredLocations = locations.filter(loc =>
    loc.road_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Color mappings
  const getCongestionColor = (idx: number) => {
    if (idx < 30) return '#10B981' // Green
    if (idx < 60) return '#F59E0B' // Orange
    return '#EF4444' // Red
  }

  const getCongestionBg = (idx: number) => {
    if (idx < 30) return 'bg-tv-emerald/10 text-tv-emerald border-tv-emerald/20'
    if (idx < 60) return 'bg-tv-orange/10 text-tv-orange border-tv-orange/20'
    return 'bg-red-500/10 text-red-400 border-red-500/20'
  }

  // Aggregate stats
  const totalRoads = locations.length
  const hotspotsCount = locations.filter(l => l.congestion_index >= 60).length
  const avgCongestion = totalRoads > 0
    ? Math.round(locations.reduce((sum: number, l: any) => sum + l.congestion_index, 0) / totalRoads)
    : 0

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header section */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-tv-text flex items-center gap-2">
            <Activity className="h-7 w-7 text-tv-primary animate-pulse" />
            Live Traffic Monitoring Map
          </h1>
          <p className="text-tv-muted mt-1">
            Real-time geospatial tracking of congestion levels and vehicle volumes across city checkpoints.
          </p>
        </div>
        <button
          onClick={fetchLocations}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-tv-text transition-all hover:bg-white/[0.08] cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 text-tv-primary ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Checkpoints</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <div key="loading" className="flex h-[55vh] w-full items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="h-9 w-9 animate-spin text-tv-primary" />
              <span className="text-sm font-medium text-tv-muted">Assembling map checkpoints…</span>
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
            {/* KPI Widgets Panel */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <motion.div variants={itemVariants} className="tv-glass p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-tv-muted uppercase tracking-wider">Monitored Roads</p>
                  <h3 className="text-2xl font-bold mt-1 text-tv-text">{totalRoads} Checkpoints</h3>
                  <p className="text-xs text-tv-muted mt-0.5">Active sensor arrays</p>
                </div>
                <div className="p-3 bg-tv-primary/10 text-tv-primary border border-tv-primary/20 rounded-xl">
                  <LayoutGrid className="h-5 w-5" />
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="tv-glass p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-tv-muted uppercase tracking-wider">Congestion Hotspots</p>
                  <h3 className="text-2xl font-bold mt-1 text-red-400">{hotspotsCount} Critical</h3>
                  <p className="text-xs text-tv-muted mt-0.5">Congestion level &ge; 60%</p>
                </div>
                <div className="p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl">
                  <AlertTriangle className="h-5 w-5 animate-bounce" />
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="tv-glass p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-tv-muted uppercase tracking-wider">System Avg Congestion</p>
                  <h3 className="text-2xl font-bold mt-1 text-tv-text">{avgCongestion}%</h3>
                  <p className="text-xs text-tv-muted mt-0.5">Overall flow coefficient</p>
                </div>
                <div className="p-3 bg-tv-orange/10 text-tv-orange border border-tv-orange/20 rounded-xl">
                  <Gauge className="h-5 w-5" />
                </div>
              </motion.div>
            </div>

            {/* Split layout: Sidebar and Map */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
              
              {/* Left Column: Interactive Checkpoints list */}
              <motion.div variants={itemVariants} className="tv-glass p-5 rounded-2xl flex flex-col h-[500px]">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-tv-muted" />
                  <input
                    type="text"
                    placeholder="Search checkpoints..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-tv-surface border border-white/[0.08] rounded-xl pl-9 pr-4 py-2 text-xs text-tv-text focus:outline-none focus:border-tv-primary"
                  />
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                  {filteredLocations.length > 0 ? (
                    filteredLocations.map((loc, idx) => {
                      const isActive = selectedRoadName === loc.road_name
                      const statusBg = getCongestionBg(loc.congestion_index)
                      return (
                        <div
                          key={idx}
                          onClick={() => handleSelectRoad(loc)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            isActive
                              ? 'bg-tv-primary/10 border-tv-primary text-tv-text shadow-lg'
                              : 'bg-white/[0.01] border-white/[0.04] text-tv-muted hover:bg-white/[0.03] hover:text-tv-text'
                          }`}
                        >
                          <div>
                            <h4 className="text-xs font-bold text-tv-text flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-tv-primary" />
                              {loc.road_name}
                            </h4>
                            <p className="text-[10px] text-tv-muted mt-0.5">
                              {loc.road_type} Road &bull; Flow: {loc.predicted_volume} /hr
                            </p>
                          </div>
                          <span className={`px-2 py-0.5 rounded border text-[9px] font-bold ${statusBg}`}>
                            {loc.congestion_index}%
                          </span>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center text-xs text-tv-muted py-8">
                      No matching checkpoints found.
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Right Column: React Leaflet Map Container */}
              <motion.div variants={itemVariants} className="lg:col-span-3 tv-glass rounded-2xl h-[500px] overflow-hidden relative">
                <MapContainer
                  center={mapCenter}
                  zoom={11}
                  className="h-full w-full z-0"
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  {locations.map((loc, idx) => {
                    const color = getCongestionColor(loc.congestion_index)
                    const isSelected = selectedRoadName === loc.road_name
                    
                    return (
                      <Circle
                        key={idx}
                        center={[loc.latitude, loc.longitude]}
                        radius={isSelected ? 600 : 450}
                        pathOptions={{
                          fillColor: color,
                          fillOpacity: isSelected ? 0.6 : 0.45,
                          color: color,
                          weight: isSelected ? 3 : 1.5,
                          dashArray: isSelected ? '4, 4' : undefined
                        }}
                      >
                        <Popup>
                          <div className="text-xs font-sans text-slate-900 max-w-[200px]">
                            <h4 className="font-bold text-slate-800 text-sm border-b pb-1 mb-1">
                              Road: {loc.road_name}
                            </h4>
                            <p className="m-0.5"><strong>Road Category:</strong> {loc.road_type}</p>
                            <p className="m-0.5"><strong>Expected Count:</strong> {loc.predicted_volume.toLocaleString()} vehicles/hr</p>
                            <p className="m-0.5"><strong>Congestion:</strong> {loc.congestion_index}% ({loc.congestion_status})</p>
                            <p className="m-0.5"><strong>Confidence:</strong> {Math.round(loc.confidence * 100)}%</p>
                            {isSelected && (
                              <p className="mt-2 text-[10px] text-tv-primary font-semibold flex items-center gap-0.5">
                                Active inspection target <ArrowRight className="h-3 w-3" />
                              </p>
                            )}
                          </div>
                        </Popup>
                      </Circle>
                    )
                  })}
                  <FlyToLocation center={mapCenter} />
                </MapContainer>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default TrafficMonitoringPage
