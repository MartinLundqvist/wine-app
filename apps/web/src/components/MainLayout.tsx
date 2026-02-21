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
  "/me": "My Account",
};

export function MainLayout() {
  const location = useLocation();
  const isFullWidth =
    location.pathname === "/" || location.pathname.startsWith("/explore");

  const title = location.pathname.startsWith("/explore/styles/")
    ? "Style"
    : location.pathname.startsWith("/explore/grapes/")
      ? "Grape"
      : TITLES[location.pathname];
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
