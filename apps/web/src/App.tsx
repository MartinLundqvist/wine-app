import { lazy, Suspense } from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { MainLayout } from "./components/MainLayout";
import { ProtectedRoute, AdminRoute } from "./components/ProtectedRoute";
import { LoadingSpinner } from "./components/LoadingSpinner";

const LoginPage = lazy(() => import("./pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const LandingPage = lazy(() => import("./pages/LandingPage").then((m) => ({ default: m.LandingPage })));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })));
const ExploreLandingPage = lazy(() => import("./pages/explore/ExploreLandingPage").then((m) => ({ default: m.ExploreLandingPage })));
const ExploreStylesPage = lazy(() => import("./pages/explore/ExploreStylesPage").then((m) => ({ default: m.ExploreStylesPage })));
const WineStyleDetailPage = lazy(() => import("./pages/explore/WineStyleDetailPage").then((m) => ({ default: m.WineStyleDetailPage })));
const ExploreGrapesPage = lazy(() => import("./pages/explore/ExploreGrapesPage").then((m) => ({ default: m.ExploreGrapesPage })));
const GrapeDetailPage = lazy(() => import("./pages/explore/GrapeDetailPage").then((m) => ({ default: m.GrapeDetailPage })));
const ExploreRegionsPage = lazy(() => import("./pages/explore/ExploreRegionsPage").then((m) => ({ default: m.ExploreRegionsPage })));
const ExploreAromasPage = lazy(() => import("./pages/explore/ExploreAromasPage").then((m) => ({ default: m.ExploreAromasPage })));
const VisualizeLandingPage = lazy(() => import("./pages/visualize/VisualizeLandingPage").then((m) => ({ default: m.VisualizeLandingPage })));
const StructureRadarPage = lazy(() => import("./pages/visualize/StructureRadarPage").then((m) => ({ default: m.StructureRadarPage })));
const FlavorMapPage = lazy(() => import("./pages/visualize/FlavorMapPage").then((m) => ({ default: m.FlavorMapPage })));
const ClimateExplorerPage = lazy(() => import("./pages/visualize/ClimateExplorerPage").then((m) => ({ default: m.ClimateExplorerPage })));
const ConfusionZonePage = lazy(() => import("./pages/visualize/ConfusionZonePage").then((m) => ({ default: m.ConfusionZonePage })));
const AgingSimulatorPage = lazy(() => import("./pages/visualize/AgingSimulatorPage").then((m) => ({ default: m.AgingSimulatorPage })));
const WineStylesListPage = lazy(() => import("./pages/admin/WineStylesListPage").then((m) => ({ default: m.WineStylesListPage })));
const WineStyleCreatePage = lazy(() => import("./pages/admin/WineStyleCreatePage").then((m) => ({ default: m.WineStyleCreatePage })));
const WineStyleEditPage = lazy(() => import("./pages/admin/WineStyleEditPage").then((m) => ({ default: m.WineStyleEditPage })));

export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<MainLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="explore" element={<ExploreLandingPage />} />
          <Route path="explore/styles" element={<ExploreStylesPage />} />
          <Route path="explore/styles/:id" element={<WineStyleDetailPage />} />
          <Route path="explore/grapes" element={<ExploreGrapesPage />} />
          <Route path="explore/grapes/:id" element={<GrapeDetailPage />} />
          <Route path="visualize" element={<VisualizeLandingPage />} />
          <Route path="visualize/structure" element={<StructureRadarPage />} />
          <Route path="visualize/flavor-map" element={<FlavorMapPage />} />
          <Route path="visualize/climate" element={<ClimateExplorerPage />} />
          <Route path="visualize/confusion" element={<ConfusionZonePage />} />
          <Route path="visualize/aging" element={<AgingSimulatorPage />} />
        <Route
          path="explore/regions"
          element={
            <ErrorBoundary>
              <ExploreRegionsPage />
            </ErrorBoundary>
          }
        />
        <Route
          path="explore/aromas"
          element={
            <ErrorBoundary>
              <ExploreAromasPage />
            </ErrorBoundary>
          }
        />
        <Route
          path="me"
          element={
            <ProtectedRoute>
              <div className="p-6">
                <h2 className="font-serif text-2xl text-foreground">Protected</h2>
                <p className="text-muted-foreground">You are logged in.</p>
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="admin"
          element={<AdminRoute><Outlet /></AdminRoute>}
        >
          <Route path="wine-styles" element={<WineStylesListPage />} />
          <Route path="wine-styles/new" element={<WineStyleCreatePage />} />
          <Route path="wine-styles/:id/edit" element={<WineStyleEditPage />} />
        </Route>
      </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
