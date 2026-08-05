import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AuthGuard } from './components/common/AuthGuard'
import { ShellLayout } from './layouts/ShellLayout'

// Page Imports
import { LoginPage } from './pages/Login/LoginPage'
import { DashboardPage } from './pages/Dashboard/DashboardPage'
import { TrafficMonitoringPage } from './pages/TrafficMonitoring/TrafficMonitoringPage'
import { TrafficPredictionPage } from './pages/TrafficPrediction/TrafficPredictionPage'
import { RouteAnalysisPage } from './pages/RouteAnalysis/RouteAnalysisPage'
import { AlertsPage } from './pages/Alerts/AlertsPage'
import { AnalyticsPage } from './pages/Analytics/AnalyticsPage'
import { HeatmapPage } from './pages/Heatmap/HeatmapPage'
import { TrendsPage } from './pages/Trends/TrendsPage'
import { RecommendationsPage } from './pages/Recommendations/RecommendationsPage'
import { ReportsPage } from './pages/Reports/ReportsPage'
import { ProfilePage } from './pages/Profile/ProfilePage'
import { AdminPage } from './pages/Admin/AdminPage'

import { ROUTES } from './utils/constants'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Route */}
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />

          {/* Secure Workspace Shell (Protected by AuthGuard and wrapped in ShellLayout) */}
          <Route element={<AuthGuard />}>
            <Route element={<ShellLayout />}>
              <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
              <Route path={ROUTES.TRAFFIC_MONITORING} element={<TrafficMonitoringPage />} />
              <Route path={ROUTES.TRAFFIC_PREDICTION} element={<TrafficPredictionPage />} />
              <Route path={ROUTES.ROUTE_ANALYSIS} element={<RouteAnalysisPage />} />
              <Route path={ROUTES.ALERTS} element={<AlertsPage />} />
              <Route path={ROUTES.ANALYTICS} element={<AnalyticsPage />} />
              <Route path={ROUTES.HEATMAP} element={<HeatmapPage />} />
              <Route path={ROUTES.TRENDS} element={<TrendsPage />} />
              <Route path={ROUTES.RECOMMENDATIONS} element={<RecommendationsPage />} />
              <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
              <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
              <Route path={ROUTES.ADMIN} element={<AdminPage />} />
            </Route>
          </Route>

          {/* Fallback Catch-All - Redirects to Dashboard (which will auto-redirect to Login if unauthenticated) */}
          <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
