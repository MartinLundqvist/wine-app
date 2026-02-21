import { Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "./components/MainLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { LandingPage } from "./pages/LandingPage";
import { LauncherPage } from "./pages/LauncherPage";
import { ProgressPage } from "./pages/ProgressPage";
import { MapPage } from "./pages/MapPage";
import { DrillsPage } from "./pages/DrillsPage";
import { DrillDetailPage } from "./pages/DrillDetailPage";
import { ExploreLandingPage } from "./pages/explore/ExploreLandingPage";
import { ExploreStylesPage } from "./pages/explore/ExploreStylesPage";
import { StyleTargetDetailPage } from "./pages/explore/StyleTargetDetailPage";
import { ExploreGrapesPage } from "./pages/explore/ExploreGrapesPage";
import { GrapeDetailPage } from "./pages/explore/GrapeDetailPage";
import { ExploreRegionsPage } from "./pages/explore/ExploreRegionsPage";
import { ExploreAromasPage } from "./pages/explore/ExploreAromasPage";

function MapListPlaceholder() {
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl text-foreground">Maps</h1>
      <p className="text-muted-foreground">Choose a map from the launcher.</p>
    </div>
  );
}

function TastingPlaceholder() {
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl text-foreground">Tasting Mode</h1>
      <p className="text-muted-foreground">Tasting input — Phase 7.</p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/app" element={<Navigate to="/learn" replace />} />
      <Route element={<MainLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="learn" element={<LauncherPage />} />
        <Route path="explore" element={<ExploreLandingPage />} />
        <Route path="explore/styles" element={<ExploreStylesPage />} />
        <Route path="explore/styles/:id" element={<StyleTargetDetailPage />} />
        <Route path="explore/grapes" element={<ExploreGrapesPage />} />
        <Route path="explore/grapes/:id" element={<GrapeDetailPage />} />
        <Route path="explore/regions" element={<ExploreRegionsPage />} />
        <Route path="explore/aromas" element={<ExploreAromasPage />} />
        <Route path="maps" element={<MapListPlaceholder />} />
        <Route path="maps/:id" element={<MapPage />} />
        <Route path="drills" element={<DrillsPage />} />
        <Route path="drills/:templateId" element={<DrillDetailPage />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="tasting" element={<TastingPlaceholder />} />
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
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
