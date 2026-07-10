export function AlertsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-tv-text">Alerts & Incidents</h1>
        <p className="text-tv-muted">Manage active traffic anomalies, hazards, and emergency alerts.</p>
      </div>
      <div className="rounded-2xl border border-white/[0.08] bg-tv-surface/50 p-8 text-center backdrop-blur-sm">
        <p className="text-tv-muted">Live emergency alert cards and incident logs will be built here.</p>
      </div>
    </div>
  )
}
export default AlertsPage
