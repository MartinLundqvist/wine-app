import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import App from "./App";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function renderApp(initialEntries: string[] = ["/"]) {
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={initialEntries}>
          <App />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe("App", () => {
  it("renders landing and shows Wine App branding", async () => {
    renderApp(["/"]);
    const branding = await screen.findAllByText(/Wine App/i);
    expect(branding.length).toBeGreaterThanOrEqual(1);
  });

  it("renders explore route", async () => {
    renderApp(["/explore"]);
    const heading = await screen.findByText(/Explore Wines/i);
    expect(heading).toBeInTheDocument();
  });

  it("shows 404 for unknown route", async () => {
    renderApp(["/unknown-path"]);
    expect(await screen.findByText(/404/i)).toBeInTheDocument();
    expect(screen.getByText(/doesn't exist/i)).toBeInTheDocument();
  });
});
