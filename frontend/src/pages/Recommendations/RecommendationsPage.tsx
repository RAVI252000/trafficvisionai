import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lightbulb, Sliders, RefreshCw, Sparkles, AlertCircle,
  CheckCircle2, Shield, Search, BadgeCheck, Check, X, BookmarkCheck
} from 'lucide-react'
import { recommendationService } from '../../services/recommendationService'
import { useAuth } from '../../hooks/useAuth'

const CATEGORIES = [
  'All', 'Traffic Management', 'Route Optimization', 'Traffic Signal Optimization',
  'Emergency Response', 'Infrastructure Improvement', 'Public Advisory', 'Safety Recommendation'
]
const PRIORITIES = ['All', 'Low', 'Medium', 'High', 'Critical']
const STATUSES = ['All', 'Pending', 'Accepted', 'Implemented', 'Dismissed']
const REGIONS = [
  'All', 'London', 'South East', 'South West', 'North West', 'East of England',
  'West Midlands', 'East Midlands', 'Yorkshire and The Humber', 'North East', 'Scotland', 'Wales'
]

export function RecommendationsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  // State
  const [loading, setLoading] = useState<boolean>(true)
  const [summary, setSummary] = useState<any>(null)
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [selectedRec, setSelectedRec] = useState<any>(null)
  const [generating, setGenerating] = useState<boolean>(false)
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false)

  // Filters State
  const [filters, setFilters] = useState({
    priority: 'All',
    category: 'All',
    status: 'All',
    region: 'All',
    roadName: '',
    search: ''
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const apiParams = {
        priority: filters.priority,
        category: filters.category,
        status: filters.status,
        region: filters.region,
        road_name: filters.roadName || undefined,
        search: filters.search || undefined
      }
      const [listData, summaryData] = await Promise.all([
        recommendationService.getRecommendations(apiParams),
        recommendationService.getSummary()
      ])
      setRecommendations(listData)
      setSummary(summaryData)
    } catch (error) {
      console.error('Failed to load recommendation data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [filters])

  const handleGenerate = async () => {
    if (!isAdmin) return
    setGenerating(true)
    try {
      await recommendationService.generateRecommendations()
      await loadData()
      alert('Recommendations compiled successfully based on XGBoost telemetry!')
    } catch (error) {
      console.error('Failed to run recommendation engine:', error)
    } finally {
      setGenerating(false)
    }
  }

  const handleUpdateStatus = async (statusVal: string) => {
    if (!selectedRec) return
    setUpdatingStatus(true)
    try {
      const updated = await recommendationService.updateStatus(selectedRec.id, statusVal)
      setSelectedRec(updated)
      await loadData()
    } catch (error) {
      console.error('Failed to update recommendation status:', error)
    } finally {
      setUpdatingStatus(false)
    }
  }

  // Badge stylers
  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-500/10 border-red-500/30 text-red-400'
      case 'High': return 'bg-orange-500/10 border-orange-500/30 text-orange-400'
      case 'Medium': return 'bg-amber-500/10 border-amber-500/30 text-amber-400'
      default: return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
    }
  }

  const getStatusBadgeClass = (statusVal: string) => {
    switch (statusVal) {
      case 'Implemented': return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
      case 'Accepted': return 'bg-tv-primary/10 border-blue-500/30 text-tv-primary'
      case 'Dismissed': return 'bg-slate-500/10 border-tv-border text-tv-muted'
      default: return 'bg-amber-500/10 border-amber-500/30 text-amber-400' // Pending
    }
  }

  return (
    <div className="min-h-screen bg-tv-bg p-6 text-tv-text">
      {/* Header Banner */}
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-tv-border pb-6 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-tv-primary">
            <Lightbulb className="h-4 w-4" />
            Decision Intelligence Portal
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-tv-text">AI Recommendations Dashboard</h1>
          <p className="mt-1 text-sm text-tv-muted">
            Intelligent advisory recommendations mapping live predictive saturation models to urban traffic interventions.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-2 rounded-xl border border-tv-border bg-black/[0.02] px-4 py-2.5 text-sm font-medium text-tv-text transition hover:bg-black/[0.03] hover:text-tv-text"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Sync Portal
          </button>

          {isAdmin ? (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 rounded-xl bg-tv-primary px-4 py-2.5 text-sm font-semibold text-tv-text shadow-lg shadow-tv-primary/20 transition hover:bg-blue-500 hover:shadow-tv-primary/30"
            >
              <Sparkles className="h-4 w-4" />
              {generating ? 'Compiling AI Logic...' : 'Trigger AI Engine'}
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-tv-border bg-black/[0.02] px-3.5 py-2 text-xs text-tv-muted">
              <Shield className="h-4 w-4 text-tv-muted" />
              Operator Mode
            </div>
          )}
        </div>
      </div>

      {/* AI Insights Warning / Info cards */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-blue-500/10 bg-blue-500/5 p-4.5 flex gap-3.5 items-start">
          <div className="p-2 rounded-lg bg-tv-primary/10 text-tv-primary mt-0.5">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-xs text-tv-text block">Evening Flow Capacity</span>
            <p className="text-xs text-tv-text mt-1">Congestion is expected to increase by 23% during evening rush hours on link corridors.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-4.5 flex gap-3.5 items-start">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-xs text-tv-text block">Bypass Optimization</span>
            <p className="text-xs text-tv-text mt-1">Route B alternative diversion can reduce commuter travel times by 18%.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-500/10 bg-amber-500/5 p-4.5 flex gap-3.5 items-start">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 mt-0.5">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-xs text-tv-text block">Adaptive Intersections</span>
            <p className="text-xs text-tv-text mt-1">Traffic signal optimization at Junction A can reduce baseline queuing indices.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-red-500/10 bg-red-500/5 p-4.5 flex gap-3.5 items-start">
          <div className="p-2 rounded-lg bg-red-500/10 text-red-400 mt-0.5">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-xs text-tv-text block">Critical Enforcement</span>
            <p className="text-xs text-tv-text mt-1">Road X requires additional CCTV/speed monitoring due to recurrent congestion spikes.</p>
          </div>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-tv-border bg-tv-surface/40 p-4.5">
          <span className="text-xs font-semibold text-tv-muted uppercase tracking-wider">Total Advisory Alerts</span>
          <div className="mt-2 text-2xl font-bold text-tv-text">{summary?.total_count || 0}</div>
        </div>
        <div className="rounded-2xl border border-tv-border bg-tv-surface/40 p-4.5">
          <span className="text-xs font-semibold text-tv-muted uppercase tracking-wider text-red-400">Critical Priority</span>
          <div className="mt-2 text-2xl font-bold text-red-500">{summary?.critical_count || 0}</div>
        </div>
        <div className="rounded-2xl border border-tv-border bg-tv-surface/40 p-4.5">
          <span className="text-xs font-semibold text-tv-muted uppercase tracking-wider text-amber-400">Pending Review</span>
          <div className="mt-2 text-2xl font-bold text-amber-500">{summary?.pending_count || 0}</div>
        </div>
        <div className="rounded-2xl border border-tv-border bg-tv-surface/40 p-4.5">
          <span className="text-xs font-semibold text-tv-muted uppercase tracking-wider text-emerald-400">Implemented Actions</span>
          <div className="mt-2 text-2xl font-bold text-emerald-500">{summary?.implemented_count || 0}</div>
        </div>
      </div>

      {/* Primary Layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        {/* Left Column: Filters */}
        <div className="rounded-2xl border border-tv-border bg-tv-surface p-5 shadow-xl xl:col-span-1 h-fit">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-tv-text">
            <Sliders className="h-4 w-4 text-tv-primary" />
            Advisory Filters
          </h3>

          <div className="flex flex-col gap-4">
            {/* Search */}
            <div>
              <label className="block text-xs font-semibold text-tv-muted uppercase tracking-wider mb-1.5">Keyword Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-tv-muted" />
                <input
                  type="text"
                  placeholder="Title, description..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full rounded-xl border border-tv-border bg-tv-surface pl-9 pr-4 py-2 text-sm text-tv-text focus:outline-none"
                />
              </div>
            </div>

            {/* Road Name */}
            <div>
              <label className="block text-xs font-semibold text-tv-muted uppercase tracking-wider mb-1.5">Road Name</label>
              <input
                type="text"
                placeholder="e.g. A1, M25"
                value={filters.roadName}
                onChange={(e) => setFilters(prev => ({ ...prev, roadName: e.target.value }))}
                className="w-full rounded-xl border border-tv-border bg-tv-surface px-3.5 py-2 text-sm text-tv-text focus:outline-none"
              />
            </div>

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

            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold text-tv-muted uppercase tracking-wider mb-1.5">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full rounded-xl border border-tv-border bg-tv-surface px-3 py-2 text-sm text-tv-text focus:outline-none"
              >
                {PRIORITIES.map(pr => (
                  <option key={pr} value={pr}>{pr}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-tv-muted uppercase tracking-wider mb-1.5">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full rounded-xl border border-tv-border bg-tv-surface px-3 py-2 text-sm text-tv-text focus:outline-none"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-tv-muted uppercase tracking-wider mb-1.5">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full rounded-xl border border-tv-border bg-tv-surface px-3 py-2 text-sm text-tv-text focus:outline-none"
              >
                {STATUSES.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: Recommendations List Table */}
        <div className="rounded-2xl border border-tv-border bg-tv-surface p-5 shadow-xl xl:col-span-3">
          {loading && recommendations.length === 0 ? (
            <div className="flex h-96 flex-col items-center justify-center gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-tv-primary" />
              <span className="text-sm font-medium text-tv-muted">Loading AI Recommendations...</span>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="flex h-96 flex-col items-center justify-center text-center">
              <AlertCircle className="h-10 w-10 text-tv-muted mb-3" />
              <h4 className="font-bold text-tv-text text-base">No Recommendations Found</h4>
              <p className="text-xs text-tv-muted mt-1 max-w-sm">
                No procedural advisories match your filter criteria. Click the "Trigger AI Engine" button above to scan predictions.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-tv-border text-xs font-semibold text-tv-muted uppercase">
                    <th className="pb-3 pr-4">Priority</th>
                    <th className="pb-3 pr-4">Category</th>
                    <th className="pb-3 pr-4">Road</th>
                    <th className="pb-3 pr-4">Recommendation</th>
                    <th className="pb-3 pr-4 text-center">Confidence</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 text-right">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-tv-text">
                  {recommendations.map(rec => (
                    <tr
                      key={rec.id}
                      onClick={() => setSelectedRec(rec)}
                      className="hover:bg-black/[0.02] cursor-pointer transition-colors"
                    >
                      <td className="py-4.5 pr-4 whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${getPriorityBadgeClass(rec.priority)}`}>
                          {rec.priority}
                        </span>
                      </td>
                      <td className="py-4.5 pr-4 whitespace-nowrap font-medium text-xs">
                        {rec.category}
                      </td>
                      <td className="py-4.5 pr-4 font-bold text-tv-text whitespace-nowrap">
                        {rec.affected_road}
                      </td>
                      <td className="py-4.5 pr-4 max-w-[240px] truncate font-medium text-tv-text/90">
                        {rec.title}
                      </td>
                      <td className="py-4.5 pr-4 text-center font-mono font-bold text-tv-primary">
                        {Math.round(rec.confidence_score * 100)}%
                      </td>
                      <td className="py-4.5 pr-4 whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusBadgeClass(rec.status)}`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-4.5 text-right text-xs text-tv-muted whitespace-nowrap font-mono">
                        {new Date(rec.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Side Detail Slideout Drawer */}
      <AnimatePresence>
        {selectedRec && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
            {/* Click outside to close */}
            <div className="absolute inset-0" onClick={() => setSelectedRec(null)} />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="relative h-full w-full max-w-lg border-l border-tv-border bg-tv-surface p-6 shadow-2xl overflow-y-auto flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="mb-6 flex items-center justify-between border-b border-tv-border pb-4">
                  <div>
                    <span className="text-[10px] font-bold text-tv-primary uppercase tracking-widest">{selectedRec.category}</span>
                    <h3 className="text-lg font-bold text-tv-text mt-1 leading-tight">{selectedRec.title}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedRec(null)}
                    className="rounded-lg p-1.5 text-tv-muted hover:bg-black/[0.03] hover:text-tv-text"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Body Content */}
                <div className="flex flex-col gap-5 text-sm text-tv-text">
                  <div>
                    <span className="block text-xs font-semibold text-tv-muted uppercase mb-1.5">Actionable Description</span>
                    <p className="rounded-xl border border-tv-border bg-black/[0.01] p-3 text-xs leading-relaxed text-tv-text">
                      {selectedRec.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-xs font-semibold text-tv-muted uppercase mb-1">Priority</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getPriorityBadgeClass(selectedRec.priority)}`}>
                        {selectedRec.priority}
                      </span>
                    </div>

                    <div>
                      <span className="block text-xs font-semibold text-tv-muted uppercase mb-1">Status</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getStatusBadgeClass(selectedRec.status)}`}>
                        {selectedRec.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-xs font-semibold text-tv-muted uppercase mb-1">Affected Roadway</span>
                      <span className="text-tv-text font-bold text-sm">{selectedRec.affected_road}</span>
                    </div>

                    <div>
                      <span className="block text-xs font-semibold text-tv-muted uppercase mb-1">Region Jurisdiction</span>
                      <span className="text-tv-text text-xs">{selectedRec.region}</span>
                    </div>
                  </div>

                  <div>
                    <span className="block text-xs font-semibold text-tv-muted uppercase mb-1">Confidence Score</span>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-slate-800">
                        <div className="h-full rounded-full bg-tv-primary" style={{ width: `${selectedRec.confidence_score * 100}%` }} />
                      </div>
                      <span className="text-sm font-bold text-tv-text font-mono">{Math.round(selectedRec.confidence_score * 100)}%</span>
                    </div>
                  </div>

                  <div>
                    <span className="block text-xs font-semibold text-tv-muted uppercase mb-1">Trigger Telemetry / Reason</span>
                    <p className="text-xs leading-relaxed text-tv-muted bg-tv-surface/50 p-3 rounded-xl border border-tv-border">
                      {selectedRec.reason}
                    </p>
                  </div>

                  <div>
                    <span className="block text-xs font-semibold text-tv-muted uppercase mb-1">Expected Capacity Impact</span>
                    <p className="text-xs leading-relaxed text-emerald-400 bg-emerald-950/20 p-3 rounded-xl border border-emerald-900/20 flex gap-2 items-center">
                      <BookmarkCheck className="h-4 w-4 shrink-0" />
                      {selectedRec.expected_impact}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Update Control Actions (Operators / Admins) */}
              <div className="mt-8 border-t border-tv-border pt-4.5">
                <span className="block text-xs font-semibold text-tv-muted uppercase tracking-wider mb-2.5">Update Status</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleUpdateStatus('Accepted')}
                    disabled={updatingStatus || selectedRec.status === 'Accepted'}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-tv-primary/20 bg-tv-primary/10 text-tv-primary py-2.5 text-xs font-semibold hover:bg-blue-500/20 transition disabled:opacity-40"
                  >
                    <Check className="h-4 w-4" /> Accept
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('Implemented')}
                    disabled={updatingStatus || selectedRec.status === 'Implemented'}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 py-2.5 text-xs font-semibold hover:bg-emerald-500/20 transition disabled:opacity-40"
                  >
                    <BadgeCheck className="h-4 w-4" /> Implement
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('Dismissed')}
                    disabled={updatingStatus || selectedRec.status === 'Dismissed'}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-tv-border bg-black/[0.02] text-tv-muted py-2.5 text-xs font-semibold hover:bg-black/[0.03] transition disabled:opacity-40 col-span-2 mt-1"
                  >
                    <X className="h-4 w-4" /> Dismiss / Archive
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
