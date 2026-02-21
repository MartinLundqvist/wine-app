import { Outlet, useLocation } from "react-router-dom";
import LandingNavbar from "./landing/Navbar";

export function MainLayout() {
  const location = useLocation();
  const isFullWidth =
    location.pathname === "/" || location.pathname.startsWith("/explore");

  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />
      <main className="pt-16">
        {isFullWidth ? (
          <Outlet />
        ) : (
          <div className="w-full max-w-6xl mx-auto p-6">
            <Outlet />
          </div>
        )}
      </main>
    </div>
  );
}
