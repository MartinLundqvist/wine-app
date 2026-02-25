import { Outlet, useLocation } from "react-router-dom";
import LandingNavbar from "./landing/Navbar";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

const TITLES: Record<string, string> = {
  "/": "Home",
  "/explore": "Explore",
  "/explore/styles": "Wine Styles",
  "/explore/grapes": "Grape Varieties",
  "/explore/regions": "Wine Regions",
  "/explore/aromas": "Aromas",
  "/visualize": "Visualize",
  "/visualize/structure": "Structure Radar",
  "/visualize/flavor-map": "Flavor Map",
  "/visualize/climate": "Climate Explorer",
  "/visualize/confusion": "Confusion Zone",
  "/visualize/aging": "Aging Simulator",
  "/me": "My Account",
  "/admin/wine-styles": "Admin – Wine Styles",
  "/admin/wine-styles/new": "Admin – New Wine Style",
};

export function MainLayout() {
  const location = useLocation();
  const isFullWidth =
    location.pathname === "/" ||
    location.pathname.startsWith("/explore") ||
    location.pathname.startsWith("/visualize");

  const title = location.pathname.startsWith("/explore/styles/")
    ? "Style"
    : location.pathname.startsWith("/explore/grapes/")
      ? "Grape"
      : location.pathname.startsWith("/admin/wine-styles/") && location.pathname.endsWith("/edit")
        ? "Edit wine style"
        : TITLES[location.pathname] ?? "Wine App";
  useDocumentTitle(title);

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
