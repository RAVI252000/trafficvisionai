import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import {
  Map, MapPin, Layers, Sliders, RefreshCw,
  Search
} from 'lucide-react'
import { analyticsService } from '../../services/analyticsService'
import 'leaflet/dist/leaflet.css'

// Custom DivIcon for Leaflet markers that avoids bundler asset bugs and supports dynamic glowing colors
const createCustomIcon = (congestionLevel: string) => {
  const color = 
    congestionLevel === 'Low' ? '#10B981' : 
    congestionLevel === 'Moderate' ? '#F59E0B' : 
    congestionLevel === 'High' ? '#F97316' : '#EF4444'

  return L.divIcon({
    html: `<div style="
      background-color: ${color}; 
      width: 14px; 
      height: 14px; 
      border-radius: 50%; 
      border: 2px solid #ffffff; 
      box-shadow: 0 0 10px ${color}, 0 0 3px ${color};
    "></div>`,
    className: 'custom-leaflet-glow-dot',
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  })
}

// Map helper to center dynamically
function ChangeMapView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])
  return null
}

const REGIONS = [
  'All', 'London', 'South East', 'South West', 'North West', 'East of England',
  'West Midlands', 'East Midlands', 'Yorkshire and The Humber', 'North East', 'Scotland', 'Wales'
]
const ROAD_TYPES = ['All', 'Major', 'Minor']
const CONGESTION_LEVELS = ['All', 'Low', 'Moderate', 'High', 'Severe']

export function HeatmapPage() {
  // Filters State
  const [filters, setFilters] = useState({
    region: 'All',
    roadType: 'All',
    time: '17:00', // Default peak hour
    congestionLevel: 'All'
  })

  // Map Controls State
  const [showHeatmapLayer, setShowHeatmapLayer] = useState<boolean>(true)
  const [showMarkersLayer, setShowMarkersLayer] = useState<boolean>(false)
  
  // Data State
  const [loading, setLoading] = useState<boolean>(true)
  const [points, setPoints] = useState<any[]>([])
  const [mapCenter, setMapCenter] = useState<[number, number]>([51.5074, -0.1278]) // London default
  const [selectedPoint, setSelectedPoint] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')

  const fetchHeatmapData = async () => {
    setLoading(true)
    try {
      const apiParams = {
        region: filters.region,
        road_type: filters.roadType,
        time: filters.time,
        congestion_level: filters.congestionLevel
      }
      const data = await analyticsService.getHeatmapData(apiParams)
      setPoints(data)

      // Center map on average coordinate of filtered results
      if (data.length > 0) {
        const avgLat = data.reduce((sum: number, p: any) => sum + p.latitude, 0) / data.length
        const avgLng = data.reduce((sum: number, p: any) => sum + p.longitude, 0) / data.length
        setMapCenter([avgLat, avgLng])
      }
    } catch (error) {
      console.error('Failed to load heatmap metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHeatmapData()
  }, [filters])

  // Filter list by search query (road name)
  const filteredPoints = points.filter(p => 
    p.road_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelectPoint = (point: any) => {
    setSelectedPoint(point)
    setMapCenter([point.latitude, point.longitude])
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-tv-primary">
            <Map className="h-4 w-4" />
            Geospatial Visualizer
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-tv-text">Interactive Congestion Heatmap</h1>
          <p className="mt-1 text-sm text-tv-muted">
            Monitor real-time vehicle density hotspots, busy intersections, and predicted traffic concentrations.
          </p>
        </div>

        <button
          onClick={fetchHeatmapData}
          className="flex items-center gap-2 rounded-xl border border-tv-border bg-tv-surface px-4 py-2.5 text-xs font-semibold text-tv-text transition-all hover:bg-black/[0.03] cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Map
        </button>
      </div>

      {/* Primary Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Side Filters & Searchable Checklist */}
        <div className="flex flex-col gap-6 lg:col-span-3">
          {/* Controls Panel */}
          <div className="rounded-2xl border border-tv-border bg-tv-surface p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-tv-text">
              <Sliders className="h-4 w-4 text-tv-primary" />
              Hotspot Filters
            </h3>

            <div className="flex flex-col gap-4">
              {/* Search */}
              <div>
                <label className="block text-xs font-semibold text-tv-muted uppercase tracking-wider mb-1.5">Search Road</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-tv-muted" />
                  <input
                    type="text"
                    placeholder="Search e.g. A1, M25..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-tv-border bg-tv-bg pl-9 pr-4 py-2 text-xs text-tv-text placeholder-tv-muted focus:border-tv-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Region */}
              <div>
                <label className="block text-xs font-semibold text-tv-muted uppercase tracking-wider mb-1.5">Region</label>
                <select
                  value={filters.region}
                  onChange={(e) => setFilters(prev => ({ ...prev, region: e.target.value }))}
                  className="w-full rounded-xl border border-tv-border bg-tv-bg px-3 py-2 text-xs text-tv-text focus:outline-none"
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
                  className="w-full rounded-xl border border-tv-border bg-tv-bg px-3 py-2 text-xs text-tv-text focus:outline-none"
                >
                  {ROAD_TYPES.map(rt => (
                    <option key={rt} value={rt}>{rt}</option>
                  ))}
                </select>
              </div>

              {/* Time Period */}
              <div>
                <label className="block text-xs font-semibold text-tv-muted uppercase tracking-wider mb-1.5 flex justify-between">
                  Target Time
                  <span className="text-[10px] text-tv-primary lowercase font-mono">{filters.time}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="23"
                  value={filters.time.split(':')[0]}
                  onChange={(e) => setFilters(prev => ({ ...prev, time: `${intValToHour(parseInt(e.target.value))}` }))}
                  className="w-full h-1 bg-tv-border rounded-lg appearance-none cursor-pointer accent-tv-primary mt-1"
                />
              </div>

              {/* Congestion Level */}
              <div>
                <label className="block text-xs font-semibold text-tv-muted uppercase tracking-wider mb-1.5">Congestion Level</label>
                <select
                  value={filters.congestionLevel}
                  onChange={(e) => setFilters(prev => ({ ...prev, congestionLevel: e.target.value }))}
                  className="w-full rounded-xl border border-tv-border bg-tv-bg px-3 py-2 text-xs text-tv-text focus:outline-none"
                >
                  {CONGESTION_LEVELS.map(cl => (
                    <option key={cl} value={cl}>{cl}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Quick List Checklist of Hotspots */}
          <div className="flex-1 rounded-2xl border border-tv-border bg-tv-surface p-4.5 shadow-sm max-h-[300px] overflow-y-auto scrollbar-thin">
            <h4 className="mb-3 text-xs font-bold text-tv-text uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-tv-primary" />
              Hotspots List ({filteredPoints.length})
            </h4>
            <div className="flex flex-col gap-2">
              {filteredPoints.map((p, idx) => {
                const color = 
                  p.congestion_level === 'Low' ? 'text-green-600 border-green-500/20 bg-green-500/5' : 
                  p.congestion_level === 'Moderate' ? 'text-amber-600 border-amber-500/20 bg-amber-500/5' : 
                  p.congestion_level === 'High' ? 'text-orange-600 border-orange-500/20 bg-orange-500/5' : 
                  'text-red-650 border-red-500/20 bg-red-500/5'
                return (
                  <div
                    key={idx}
                    onClick={() => handleSelectPoint(p)}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-tv-border bg-black/[0.01] hover:bg-black/[0.03] transition cursor-pointer"
                  >
                    <div>
                      <span className="text-xs font-bold text-tv-text block">{p.road_name}</span>
                      <span className="text-[10px] text-tv-muted">{p.location}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${color}`}>
                      {p.congestion_score}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Leaflet Map Container & Control Panels */}
        <div className="flex flex-col gap-4 lg:col-span-9">
          {/* Map wrapper */}
          <div className="h-[600px] w-full rounded-3xl border border-tv-border bg-tv-surface relative overflow-hidden shadow-xs">
            {/* Overlay Map Settings Toggles */}
            <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
              {/* Heatmap Layer Toggle */}
              <button
                onClick={() => setShowHeatmapLayer(prev => !prev)}
                className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-md border transition ${
                  showHeatmapLayer 
                    ? 'bg-tv-primary border-tv-primary text-tv-text' 
                    : 'bg-tv-surface border-tv-border text-tv-muted hover:text-tv-text'
                }`}
                title="Toggle Heatmap Layer"
              >
                <Layers className="h-5 w-5" />
              </button>

              {/* Markers Layer Toggle */}
              <button
                onClick={() => setShowMarkersLayer(prev => !prev)}
                className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-md border transition ${
                  showMarkersLayer 
                    ? 'bg-tv-primary border-tv-primary text-tv-text' 
                    : 'bg-tv-surface border-tv-border text-tv-muted hover:text-tv-text'
                }`}
                title="Toggle Marker Layer"
              >
                <MapPin className="h-5 w-5" />
              </button>
            </div>

            {/* Leaflet MapContainer */}
            <MapContainer
              center={mapCenter}
              zoom={11}
              className="h-full w-full z-0"
            >
              <ChangeMapView center={mapCenter} zoom={11} />

              <TileLayer
                url="https://mt1.google.com/vt/lyrs=m,traffic&x={x}&y={y}&z={z}"
                attribution='&copy; Google Maps'
              />

              {/* Heatmap overlay circles */}
              {showHeatmapLayer && filteredPoints.map((p, idx) => {
                const color = 
                  p.congestion_level === 'Low' ? '#10B981' : 
                  p.congestion_level === 'Moderate' ? '#F59E0B' : 
                  p.congestion_level === 'High' ? '#F97316' : '#EF4444'
                
                const isSelected = selectedPoint?.road_name === p.road_name

                return (
                  <Circle
                    key={`heat-${idx}`}
                    center={[p.latitude, p.longitude]}
                    radius={isSelected ? 750 : 500}
                    pathOptions={{
                      fillColor: color,
                      fillOpacity: isSelected ? 0.7 : 0.5,
                      color: color,
                      weight: isSelected ? 3.5 : 1.5,
                      dashArray: isSelected ? '4, 4' : undefined
                    }}
                  >
                    <Popup>
                      <div className="text-xs font-sans text-slate-900 max-w-[220px]">
                        <h4 className="font-bold text-slate-800 text-sm border-b pb-1 mb-1">
                          Roadway Hotspot: {p.road_name}
                        </h4>
                        <p className="m-0.5"><strong>Congestion:</strong> {p.congestion_score}% ({p.congestion_level})</p>
                        <p className="m-0.5"><strong>Predicted Count:</strong> {p.vehicle_count.toLocaleString()} /hr</p>
                        <p className="m-0.5"><strong>Density score:</strong> {p.vehicle_density}</p>
                        <p className="m-0.5"><strong>Prediction Index:</strong> {p.prediction_score}</p>
                        <p className="m-0.5"><strong>Coordinates:</strong> {p.location}</p>
                        <p className="m-0.5 border-t pt-1 mt-1 text-[10px] text-tv-muted">Updated: {p.last_updated}</p>
                      </div>
                    </Popup>
                  </Circle>
                )
              })}

              {/* Standard dot markers overlay */}
              {showMarkersLayer && filteredPoints.map((p, idx) => (
                <Marker
                  key={`mark-${idx}`}
                  position={[p.latitude, p.longitude]}
                  icon={createCustomIcon(p.congestion_level)}
                >
                  <Popup>
                    <div className="text-xs font-sans text-slate-900">
                      <h4 className="font-bold text-slate-800">{p.road_name} Node</h4>
                      <p className="m-0.5">Level: <strong>{p.congestion_level}</strong></p>
                      <p className="m-0.5">Score: {p.congestion_score}%</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* Quick Legend bar */}
          <div className="rounded-2xl border border-tv-border bg-tv-surface p-4 flex flex-wrap gap-4 items-center justify-between shadow-xs">
            <div className="flex items-center gap-1.5 text-xs text-tv-muted">
              <Sliders className="h-4 w-4 text-tv-muted" />
              Legend:
            </div>
            <div className="flex gap-4 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-tv-text">
                <div className="h-3 w-3 rounded-full bg-green-500 shadow-md shadow-green-500/25" />
                Low (&lt;30%)
              </div>
              <div className="flex items-center gap-1.5 text-xs text-tv-text">
                <div className="h-3 w-3 rounded-full bg-amber-500 shadow-md shadow-amber-500/25" />
                Moderate (30%-60%)
              </div>
              <div className="flex items-center gap-1.5 text-xs text-tv-text">
                <div className="h-3 w-3 rounded-full bg-orange-500 shadow-md shadow-orange-500/25" />
                High (60%-85%)
              </div>
              <div className="flex items-center gap-1.5 text-xs text-tv-text">
                <div className="h-3 w-3 rounded-full bg-red-500 shadow-md shadow-red-500/25" />
                Severe (&gt;85%)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function intValToHour(val: number): string {
  return `${val.toString().padStart(2, '0')}:00`
}

export default HeatmapPage
