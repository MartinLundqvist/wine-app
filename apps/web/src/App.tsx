import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { MainLayout } from "./components/MainLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoadingSpinner } from "./components/LoadingSpinner";

const LoginPage = lazy(() => import("./pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const LandingPage = lazy(() => import("./pages/LandingPage").then((m) => ({ default: m.LandingPage })));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })));
const ExploreLandingPage = lazy(() => import("./pages/explore/ExploreLandingPage").then((m) => ({ default: m.ExploreLandingPage })));
const ExploreStylesPage = lazy(() => import("./pages/explore/ExploreStylesPage").then((m) => ({ default: m.ExploreStylesPage })));
const StyleTargetDetailPage = lazy(() => import("./pages/explore/StyleTargetDetailPage").then((m) => ({ default: m.StyleTargetDetailPage })));
const ExploreGrapesPage = lazy(() => import("./pages/explore/ExploreGrapesPage").then((m) => ({ default: m.ExploreGrapesPage })));
const GrapeDetailPage = lazy(() => import("./pages/explore/GrapeDetailPage").then((m) => ({ default: m.GrapeDetailPage })));
const ExploreRegionsPage = lazy(() => import("./pages/explore/ExploreRegionsPage").then((m) => ({ default: m.ExploreRegionsPage })));
const ExploreAromasPage = lazy(() => import("./pages/explore/ExploreAromasPage").then((m) => ({ default: m.ExploreAromasPage })));

export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<MainLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="explore" element={<ExploreLandingPage />} />
          <Route path="explore/styles" element={<ExploreStylesPage />} />
          <Route path="explore/styles/:id" element={<StyleTargetDetailPage />} />
          <Route path="explore/grapes" element={<ExploreGrapesPage />} />
          <Route path="explore/grapes/:id" element={<GrapeDetailPage />} />
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
      </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
