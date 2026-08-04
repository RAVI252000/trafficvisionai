import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle, CheckCircle2, ShieldAlert, FileText, Search, Filter,
  RefreshCw, X, PlusCircle, AlertCircle, MapPin, Eye, Trash2, Check,
  Shield, User, Database
} from 'lucide-react'
import { alertService } from '../../services/alertService'
import { predictionService } from '../../services/predictionService'
import { useAuth } from '../../hooks/useAuth'

// Constants for Alert options matching DB structure
const ALERT_TYPES = [
  'Heavy Traffic',
  'Severe Congestion',
  'Accident Alert',
  'Road Closure',
  'Weather Impact',
  'High Traffic Volume',
  'AI Congestion Prediction Warning'
]

const SEVERITIES = ['Low', 'Medium', 'High', 'Critical']
const STATUSES = ['Active', 'Acknowledged', 'Resolved']

export function AlertsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  // Page States
  const [alerts, setAlerts] = useState<any[]>([])
  const [roads, setRoads] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters State
  const [search, setSearch] = useState('')
  const [filterSeverity, setFilterSeverity] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterLocation, setFilterLocation] = useState('')

  // Modal / Detail States
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  // Create Form State
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    road_name: '',
    location: '',
    alert_type: 'Heavy Traffic',
    severity: 'Medium',
    prediction_score: '',
    traffic_volume: ''
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [formSubmitting, setFormSubmitting] = useState(false)

  // Fetch alerts from service
  const fetchAlerts = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      // Build query parameters
      const params: any = {}
      if (filterStatus) params.status = filterStatus
      if (filterSeverity) params.severity = filterSeverity
      if (filterType) params.alert_type = filterType

      const data = await alertService.getAlerts(params)
      setAlerts(data)
    } catch (err: any) {
      console.error('Failed to load alerts:', err)
      setError(err?.response?.data?.detail || 'Failed to fetch alerts from server.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Fetch available roads for manual creation prefill
  const fetchRoadMetadata = async () => {
    try {
      const availableRoads = await predictionService.getAvailableRoads()
      setRoads(availableRoads)
    } catch (err) {
      console.error('Failed to load road names:', err)
    }
  }

  useEffect(() => {
    fetchAlerts()
    fetchRoadMetadata()
  }, [filterStatus, filterSeverity, filterType])

  // Auto-set location coordinate mock when road is chosen
  const handleRoadSelect = (roadName: string) => {
    setCreateForm(prev => {
      let mockCoords = '51.5074, -0.1278' // default
      // Deterministic coords based on road name
      if (roadName === 'A1') mockCoords = '53.6270, -1.1020'
      else if (roadName === 'A3112') mockCoords = '53.6080, -1.0920'
      else if (roadName === 'A638') mockCoords = '53.6420, -1.1150'
      else if (roadName === 'A19') mockCoords = '53.6550, -1.0850'
      
      return {
        ...prev,
        road_name: roadName,
        location: mockCoords
      }
    })
  }

  // Summary Metrics calculations
  const stats = useMemo(() => {
    const total = alerts.length
    const active = alerts.filter(a => a.status === 'Active').length
    const critical = alerts.filter(a => a.severity === 'Critical' && a.status === 'Active').length
    const resolved = alerts.filter(a => a.status === 'Resolved').length

    return { total, active, critical, resolved }
  }, [alerts])

  // Client-side search and location filtering
  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      const matchSearch =
        alert.title.toLowerCase().includes(search.toLowerCase()) ||
        alert.road_name.toLowerCase().includes(search.toLowerCase()) ||
        alert.description.toLowerCase().includes(search.toLowerCase())
      
      const matchLocation =
        !filterLocation ||
        alert.location.toLowerCase().includes(filterLocation.toLowerCase())

      return matchSearch && matchLocation
    })
  }, [alerts, search, filterLocation])

  // Acknowledge Alert Handler
  const handleAcknowledge = async (id: number) => {
    try {
      const updated = await alertService.acknowledgeAlert(id)
      setAlerts(prev => prev.map(a => a.id === id ? updated : a))
      // Update selected alert view if open
      if (selectedAlert && selectedAlert.id === id) {
        setSelectedAlert(updated)
      }
    } catch (err) {
      alert('Failed to acknowledge alert.')
    }
  }

  // Resolve Alert Handler
  const handleResolve = async (id: number) => {
    try {
      const updated = await alertService.resolveAlert(id)
      setAlerts(prev => prev.map(a => a.id === id ? updated : a))
      if (selectedAlert && selectedAlert.id === id) {
        setSelectedAlert(updated)
      }
    } catch (err) {
      alert('Failed to resolve alert.')
    }
  }

  // Delete Alert Handler
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to permanently delete this alert?')) return
    try {
      await alertService.deleteAlert(id)
      setAlerts(prev => prev.filter(a => a.id !== id))
      setIsDetailOpen(false)
      setSelectedAlert(null)
    } catch (err) {
      alert('Failed to delete alert.')
    }
  }

  // Manual Alert Creation Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    // Validation
    if (!createForm.title.trim()) return setFormError('Title is required.')
    if (!createForm.description.trim()) return setFormError('Description is required.')
    if (!createForm.road_name.trim()) return setFormError('Road Name is required.')
    if (!createForm.location.trim()) return setFormError('Coordinates/Location are required.')

    setFormSubmitting(true)
    try {
      const payload = {
        title: createForm.title,
        description: createForm.description,
        road_name: createForm.road_name,
        location: createForm.location,
        alert_type: createForm.alert_type,
        severity: createForm.severity,
        prediction_score: createForm.prediction_score ? parseFloat(createForm.prediction_score) : null,
        traffic_volume: createForm.traffic_volume ? parseInt(createForm.traffic_volume) : null
      }

      const newAlert = await alertService.createAlert(payload)
      setAlerts(prev => [newAlert, ...prev])
      setIsCreateOpen(false)
      // Reset form
      setCreateForm({
        title: '',
        description: '',
        road_name: '',
        location: '',
        alert_type: 'Heavy Traffic',
        severity: 'Medium',
        prediction_score: '',
        traffic_volume: ''
      })
    } catch (err: any) {
      setFormError(err?.response?.data?.detail || 'Failed to create manual alert.')
    } finally {
      setFormSubmitting(false)
    }
  }

  // Severity color maps
  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-500/10 text-red-400 border border-red-500/20'
      case 'High':
        return 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
      case 'Medium':
        return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
      case 'Low':
      default:
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
    }
  }

  // Status color maps
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-red-500/10 text-red-500 border border-red-500/20'
      case 'Acknowledged':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
      case 'Resolved':
        return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
      default:
        return 'bg-white/10 text-tv-muted border border-white/[0.08]'
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Title Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-tv-text">Alerts &amp; Incidents</h1>
          <p className="text-sm text-tv-muted mt-1">Real-time traffic hazard logs, prediction warnings, and manual operator overrides</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchAlerts(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-tv-text transition-all hover:bg-white/[0.08] disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 text-tv-primary ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Sync Logs'}</span>
          </button>
          
          {isAdmin && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-tv-primary px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-blue-600 shadow-lg shadow-blue-500/10 cursor-pointer"
            >
              <PlusCircle className="h-4.5 w-4.5" />
              <span>Create Alert</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Alerts */}
        <div className="tv-glass rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-tv-muted">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-tv-muted">Total Alerts Logged</span>
            <span className="text-2xl font-bold text-tv-text mt-0.5">{stats.total}</span>
          </div>
        </div>

        {/* Card 2: Active Alerts */}
        <div className="tv-glass rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            <AlertTriangle className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-tv-muted">Active Anomalies</span>
            <span className="text-2xl font-bold text-red-400 mt-0.5">{stats.active}</span>
          </div>
        </div>

        {/* Card 3: Critical active Alerts */}
        <div className="tv-glass rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-tv-muted">Critical Hazards</span>
            <span className="text-2xl font-bold text-orange-400 mt-0.5">{stats.critical}</span>
          </div>
        </div>

        {/* Card 4: Resolved Alerts */}
        <div className="tv-glass rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-tv-emerald">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-tv-muted">Resolved Issues</span>
            <span className="text-2xl font-bold text-tv-emerald mt-0.5">{stats.resolved}</span>
          </div>
        </div>
      </div>

      {/* Advanced Filtering Control Panel */}
      <div className="tv-glass rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-white/[0.04] pb-3">
          <Filter className="h-4 w-4 text-tv-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-tv-text">Alert Filtering &amp; Search</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-5">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute top-3 left-3 h-4 w-4 text-tv-muted" />
            <input
              type="text"
              placeholder="Search title, road..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] py-2.5 pl-9 pr-4 text-xs font-semibold text-tv-text placeholder-tv-muted outline-none transition-all focus:border-tv-primary focus:bg-white/[0.04]"
            />
          </div>

          {/* Severity filter */}
          <div>
            <select
              value={filterSeverity}
              onChange={e => setFilterSeverity(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-[#1E293B] py-2.5 px-3.5 text-xs font-semibold text-tv-text outline-none transition-all focus:border-tv-primary"
            >
              <option value="">All Severities</option>
              {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Alert Type filter */}
          <div>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-[#1E293B] py-2.5 px-3.5 text-xs font-semibold text-tv-text outline-none transition-all focus:border-tv-primary"
            >
              <option value="">All Categories</option>
              {ALERT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-[#1E293B] py-2.5 px-3.5 text-xs font-semibold text-tv-text outline-none transition-all focus:border-tv-primary"
            >
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Location filter */}
          <div className="relative">
            <MapPin className="absolute top-3 left-3 h-4 w-4 text-tv-muted" />
            <input
              type="text"
              placeholder="Filter by coordinates..."
              value={filterLocation}
              onChange={e => setFilterLocation(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] py-2.5 pl-9 pr-4 text-xs font-semibold text-tv-text placeholder-tv-muted outline-none transition-all focus:border-tv-primary focus:bg-white/[0.04]"
            />
          </div>
        </div>
      </div>

      {/* Main Alerts Table */}
      <div className="tv-glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex h-64 w-full items-center justify-center text-tv-muted">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-tv-primary" />
              <span className="text-xs font-semibold">Connecting to live incidents database...</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400 space-y-2">
            <AlertCircle className="h-10 w-10 mx-auto" />
            <p className="text-sm font-semibold">{error}</p>
            <button onClick={() => fetchAlerts()} className="text-xs font-bold text-tv-primary hover:underline">Try Again</button>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="p-12 text-center text-tv-muted space-y-2">
            <CheckCircle2 className="h-12 w-12 mx-auto text-tv-emerald opacity-60" />
            <p className="text-sm font-bold text-tv-text">All Systems Clear</p>
            <p className="text-xs">No active traffic alerts or predicted bottlenecks match your filters.</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.01] text-[10px] font-bold uppercase tracking-wider text-tv-muted">
                  <th className="px-5 py-3">Severity</th>
                  <th className="px-5 py-3">Title / Category</th>
                  <th className="px-5 py-3">Location</th>
                  <th className="px-5 py-3">Road</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Created Time</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredAlerts.map(alert => (
                  <tr
                    key={alert.id}
                    className="hover:bg-white/[0.01] transition-colors text-xs font-medium text-tv-text"
                  >
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex rounded-lg px-2.5 py-0.5 text-[10px] font-bold ${getSeverityBadgeClass(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div>
                        <span className="block font-semibold text-tv-text">{alert.title}</span>
                        <span className="block text-[10px] text-tv-muted mt-0.5">{alert.alert_type}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-tv-muted font-mono">{alert.location}</td>
                    <td className="px-5 py-4 whitespace-nowrap font-bold text-tv-primary">{alert.road_name}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold ${getStatusBadgeClass(alert.status)}`}>
                        {alert.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-tv-muted">
                      {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &middot; {new Date(alert.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right space-x-1.5">
                      {/* View details */}
                      <button
                        onClick={() => {
                          setSelectedAlert(alert)
                          setIsDetailOpen(true)
                        }}
                        className="p-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] text-tv-muted hover:text-tv-text transition-colors cursor-pointer"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {/* Operator / Admin Acknowledge */}
                      {alert.status === 'Active' && (
                        <button
                          onClick={() => handleAcknowledge(alert.id)}
                          className="p-1.5 rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-400 hover:text-white hover:bg-blue-600 transition-colors cursor-pointer"
                          title="Acknowledge Alert"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}

                      {/* Admin Only Actions */}
                      {isAdmin && (
                        <>
                          {alert.status !== 'Resolved' && (
                            <button
                              onClick={() => handleResolve(alert.id)}
                              className="p-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-tv-emerald hover:text-white hover:bg-tv-emerald transition-colors cursor-pointer"
                              title="Mark as Resolved"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(alert.id)}
                            className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:text-white hover:bg-red-500 transition-colors cursor-pointer"
                            title="Delete Alert"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Alert Details Slide-out / Modal */}
      <AnimatePresence>
        {isDetailOpen && selectedAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            {/* Side drawer content */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-white/[0.08] bg-[#1E293B] p-6 shadow-2xl focus:outline-none"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                <div>
                  <span className={`inline-flex rounded-lg px-2 py-0.5 text-[9px] font-bold ${getSeverityBadgeClass(selectedAlert.severity)}`}>
                    {selectedAlert.severity} Severity
                  </span>
                  <h3 className="text-lg font-bold text-tv-text mt-1.5">{selectedAlert.title}</h3>
                </div>
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="rounded-lg p-1.5 text-tv-muted hover:bg-white/[0.04] hover:text-tv-text"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body details list */}
              <div className="flex-1 overflow-y-auto py-5 space-y-5 text-xs text-tv-muted">
                {/* Description */}
                <div>
                  <h5 className="font-bold text-tv-text uppercase tracking-wider text-[10px] mb-1">Description</h5>
                  <p className="bg-white/[0.01] border border-white/[0.04] p-3 rounded-xl leading-relaxed text-tv-text font-medium">
                    {selectedAlert.description}
                  </p>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/[0.01] border border-white/[0.04] p-3 rounded-xl">
                    <span className="block text-[10px] font-bold text-tv-muted uppercase">Roadway Segment</span>
                    <span className="block text-sm font-bold text-tv-primary mt-1">{selectedAlert.road_name}</span>
                  </div>
                  <div className="bg-white/[0.01] border border-white/[0.04] p-3 rounded-xl">
                    <span className="block text-[10px] font-bold text-tv-muted uppercase">Coordinates</span>
                    <span className="block text-xs font-mono text-tv-text mt-1 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-tv-muted" />
                      {selectedAlert.location}
                    </span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/[0.01] border border-white/[0.04] p-3 rounded-xl">
                    <span className="block text-[10px] font-bold text-tv-muted uppercase">AI Prediction Score</span>
                    <span className="block text-sm font-bold text-tv-text mt-1">
                      {selectedAlert.prediction_score !== null 
                        ? `${Math.round(selectedAlert.prediction_score * 100)}%`
                        : 'N/A (Simulated)'
                      }
                    </span>
                  </div>
                  <div className="bg-white/[0.01] border border-white/[0.04] p-3 rounded-xl">
                    <span className="block text-[10px] font-bold text-tv-muted uppercase">Traffic Volume</span>
                    <span className="block text-sm font-bold text-tv-text mt-1">
                      {selectedAlert.traffic_volume !== null 
                        ? `${selectedAlert.traffic_volume} /hr`
                        : 'N/A'
                      }
                    </span>
                  </div>
                </div>

                {/* Status and dates */}
                <div className="space-y-3 bg-white/[0.01] border border-white/[0.04] p-4 rounded-xl">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-tv-text uppercase text-[10px]">Status</span>
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-bold ${getStatusBadgeClass(selectedAlert.status)}`}>
                      {selectedAlert.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Generated Time</span>
                    <span className="text-tv-text">
                      {new Date(selectedAlert.created_at).toLocaleTimeString()} &bull; {new Date(selectedAlert.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Updated</span>
                    <span className="text-tv-text">
                      {new Date(selectedAlert.updated_at).toLocaleTimeString()} &bull; {new Date(selectedAlert.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Created By</span>
                    <span className="text-tv-text flex items-center gap-1 font-semibold">
                      {selectedAlert.created_by ? (
                        <>
                          <User className="h-3 w-3 text-tv-primary" /> User ID: {selectedAlert.created_by}
                        </>
                      ) : (
                        <>
                          <Database className="h-3 w-3 text-tv-emerald" /> AI Predictive System
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="border-t border-white/[0.06] pt-4 space-y-2">
                {selectedAlert.status === 'Active' && (
                  <button
                    onClick={() => handleAcknowledge(selectedAlert.id)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500/10 border border-blue-500/20 py-2.5 text-xs font-bold text-blue-400 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
                  >
                    <Check className="h-4 w-4" />
                    <span>Acknowledge Alert</span>
                  </button>
                )}

                {isAdmin && (
                  <>
                    {selectedAlert.status !== 'Resolved' && (
                      <button
                        onClick={() => handleResolve(selectedAlert.id)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 py-2.5 text-xs font-bold text-tv-emerald hover:bg-tv-emerald hover:text-white transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Resolve Incident</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(selectedAlert.id)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete Log Entry</span>
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manual Alert Creator Modal */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#1E293B] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
                <span className="text-sm font-bold text-tv-text flex items-center gap-2">
                  <Shield className="h-5 w-5 text-tv-primary" />
                  Manual Traffic Advisory Creation
                </span>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-lg p-1.5 text-tv-muted hover:bg-white/[0.04] hover:text-tv-text"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
                {formError && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-semibold text-red-400">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Form fields */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Roadway selection */}
                  <div>
                    <label className="block text-[10px] font-bold text-tv-muted uppercase mb-1.5">Monitored Road *</label>
                    <select
                      value={createForm.road_name}
                      onChange={e => handleRoadSelect(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.08] bg-[#0F172A] py-2.5 px-3 text-xs font-semibold text-tv-text outline-none focus:border-tv-primary"
                    >
                      <option value="">Select Monitored Road</option>
                      {roads.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>

                  {/* Coords */}
                  <div>
                    <label className="block text-[10px] font-bold text-tv-muted uppercase mb-1.5">Location / Coords *</label>
                    <input
                      type="text"
                      placeholder="e.g. 53.627, -1.102"
                      value={createForm.location}
                      onChange={e => setCreateForm(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] py-2.5 px-3.5 text-xs font-semibold text-tv-text outline-none focus:border-tv-primary focus:bg-white/[0.04]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Alert Category */}
                  <div>
                    <label className="block text-[10px] font-bold text-tv-muted uppercase mb-1.5">Category *</label>
                    <select
                      value={createForm.alert_type}
                      onChange={e => setCreateForm(prev => ({ ...prev, alert_type: e.target.value }))}
                      className="w-full rounded-xl border border-white/[0.08] bg-[#0F172A] py-2.5 px-3 text-xs font-semibold text-tv-text outline-none focus:border-tv-primary"
                    >
                      {ALERT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  {/* Severity */}
                  <div>
                    <label className="block text-[10px] font-bold text-tv-muted uppercase mb-1.5">Advisory Severity *</label>
                    <select
                      value={createForm.severity}
                      onChange={e => setCreateForm(prev => ({ ...prev, severity: e.target.value }))}
                      className="w-full rounded-xl border border-white/[0.08] bg-[#0F172A] py-2.5 px-3 text-xs font-semibold text-tv-text outline-none focus:border-tv-primary"
                    >
                      {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-[10px] font-bold text-tv-muted uppercase mb-1.5">Advisory Title *</label>
                  <input
                    type="text"
                    placeholder="Short summary of incident"
                    value={createForm.title}
                    onChange={e => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] py-2.5 px-3.5 text-xs font-semibold text-tv-text outline-none focus:border-tv-primary focus:bg-white/[0.04]"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-bold text-tv-muted uppercase mb-1.5">Incident Details / Description *</label>
                  <textarea
                    rows={3}
                    placeholder="Provide full description of delay, hazard, detours, speed restrictions..."
                    value={createForm.description}
                    onChange={e => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] py-2.5 px-3.5 text-xs font-semibold text-tv-text outline-none focus:border-tv-primary focus:bg-white/[0.04]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Prediction score */}
                  <div>
                    <label className="block text-[10px] font-bold text-tv-muted uppercase mb-1.5">Prediction Score (Optional)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      placeholder="e.g. 0.85"
                      value={createForm.prediction_score}
                      onChange={e => setCreateForm(prev => ({ ...prev, prediction_score: e.target.value }))}
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] py-2.5 px-3.5 text-xs font-semibold text-tv-text outline-none focus:border-tv-primary focus:bg-white/[0.04]"
                    />
                  </div>

                  {/* Volume */}
                  <div>
                    <label className="block text-[10px] font-bold text-tv-muted uppercase mb-1.5">Traffic Volume /hr (Optional)</label>
                    <input
                      type="number"
                      placeholder="e.g. 1400"
                      value={createForm.traffic_volume}
                      onChange={e => setCreateForm(prev => ({ ...prev, traffic_volume: e.target.value }))}
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] py-2.5 px-3.5 text-xs font-semibold text-tv-text outline-none focus:border-tv-primary focus:bg-white/[0.04]"
                    />
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-white/[0.06] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="rounded-xl border border-white/[0.08] bg-transparent px-4 py-2.5 text-xs font-bold text-tv-text transition-colors hover:bg-white/[0.04] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="flex items-center gap-2 rounded-xl bg-tv-primary px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-blue-600 disabled:opacity-50 cursor-pointer"
                  >
                    {formSubmitting ? 'Publishing...' : 'Publish Advisory'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AlertsPage
