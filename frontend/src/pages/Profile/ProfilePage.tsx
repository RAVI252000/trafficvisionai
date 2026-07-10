export function ProfilePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-tv-text">User Profile</h1>
        <p className="text-tv-muted">Manage your account details and notification preferences.</p>
      </div>
      <div className="rounded-2xl border border-white/[0.08] bg-tv-surface/50 p-8 text-center backdrop-blur-sm">
        <p className="text-tv-muted">Profile preferences, settings, and credentials forms will be built here.</p>
      </div>
    </div>
  )
}
export default ProfilePage
