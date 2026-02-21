import { Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "./components/MainLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { LandingPage } from "./pages/LandingPage";
import { ExploreLandingPage } from "./pages/explore/ExploreLandingPage";
import { ExploreStylesPage } from "./pages/explore/ExploreStylesPage";
import { StyleTargetDetailPage } from "./pages/explore/StyleTargetDetailPage";
import { ExploreGrapesPage } from "./pages/explore/ExploreGrapesPage";
import { GrapeDetailPage } from "./pages/explore/GrapeDetailPage";
import { ExploreRegionsPage } from "./pages/explore/ExploreRegionsPage";
import { ExploreAromasPage } from "./pages/explore/ExploreAromasPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<MainLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="explore" element={<ExploreLandingPage />} />
        <Route path="explore/styles" element={<ExploreStylesPage />} />
        <Route path="explore/styles/:id" element={<StyleTargetDetailPage />} />
        <Route path="explore/grapes" element={<ExploreGrapesPage />} />
        <Route path="explore/grapes/:id" element={<GrapeDetailPage />} />
        <Route path="explore/regions" element={<ExploreRegionsPage />} />
        <Route path="explore/aromas" element={<ExploreAromasPage />} />
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
