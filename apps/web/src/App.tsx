import { Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { LauncherPage } from "./pages/LauncherPage";
import { ProgressPage } from "./pages/ProgressPage";
import { MapPage } from "./pages/MapPage";
import { DrillsPage } from "./pages/DrillsPage";
import { DrillDetailPage } from "./pages/DrillDetailPage";

function MapListPlaceholder() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-h1 text-linen-100">Maps</h1>
      <p className="text-cork-400">Choose a map from the launcher.</p>
    </div>
  );
}


function TastingPlaceholder() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-h1 text-linen-100">Tasting Mode</h1>
      <p className="text-cork-400">Tasting input — Phase 7.</p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <AppShell>
            <LauncherPage />
          </AppShell>
        }
      />
      <Route
        path="/maps"
        element={
          <AppShell>
            <MapListPlaceholder />
          </AppShell>
        }
      />
      <Route
        path="/maps/:id"
        element={
          <AppShell>
            <MapPage />
          </AppShell>
        }
      />
      <Route
        path="/drills"
        element={
          <AppShell>
            <DrillsPage />
          </AppShell>
        }
      />
      <Route
        path="/drills/:templateId"
        element={
          <AppShell>
            <DrillDetailPage />
          </AppShell>
        }
      />
      <Route
        path="/progress"
        element={
          <AppShell>
            <ProgressPage />
          </AppShell>
        }
      />
      <Route
        path="/tasting"
        element={
          <AppShell>
            <TastingPlaceholder />
          </AppShell>
        }
      />
      <Route
        path="/me"
        element={
          <ProtectedRoute>
            <AppShell>
              <div className="p-6">
                <h2 className="font-display text-h2 text-linen-100">Protected</h2>
                <p className="text-cork-400">You are logged in.</p>
              </div>
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
