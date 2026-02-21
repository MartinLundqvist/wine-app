import type {
  GrapeWithStyleTargets,
  Region,
  RegionsMapConfigResponse,
  StructureDimension,
  AromaTerm,
  ThermalBand,
  StyleTargetFull,
} from "@wine-app/shared";

const getBaseUrl = () => {
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_API_URL ?? ""; // use Vite proxy at /api
  }
  return window.location.origin;
};

const apiPrefix = () =>
  import.meta.env.DEV && !import.meta.env.VITE_API_URL ? "/api" : "";

export const api = {
  async getGrapes(): Promise<GrapeWithStyleTargets[]> {
    const res = await fetch(`${getBaseUrl()}${apiPrefix()}/grapes`);
    if (!res.ok) throw new Error(`Failed to fetch grapes: ${res.statusText}`);
    return res.json();
  },
  async getRegions(): Promise<Region[]> {
    const res = await fetch(`${getBaseUrl()}${apiPrefix()}/regions`);
    if (!res.ok) throw new Error(`Failed to fetch regions: ${res.statusText}`);
    return res.json();
  },
  async getRegionsMapConfig(): Promise<RegionsMapConfigResponse> {
    const res = await fetch(`${getBaseUrl()}${apiPrefix()}/regions/map-config`);
    if (!res.ok)
      throw new Error(`Failed to fetch regions map config: ${res.statusText}`);
    return res.json();
  },
  async getStructureDimensions(): Promise<StructureDimension[]> {
    const res = await fetch(`${getBaseUrl()}${apiPrefix()}/structure-dimensions`);
    if (!res.ok)
      throw new Error(`Failed to fetch structure dimensions: ${res.statusText}`);
    return res.json();
  },
  async getAromaTerms(): Promise<AromaTerm[]> {
    const res = await fetch(`${getBaseUrl()}${apiPrefix()}/aroma-terms`);
    if (!res.ok)
      throw new Error(`Failed to fetch aroma terms: ${res.statusText}`);
    return res.json();
  },
  async getThermalBands(): Promise<ThermalBand[]> {
    const res = await fetch(`${getBaseUrl()}${apiPrefix()}/thermal-bands`);
    if (!res.ok)
      throw new Error(`Failed to fetch thermal bands: ${res.statusText}`);
    return res.json();
  },
  async getStyleTargets(): Promise<StyleTargetFull[]> {
    const res = await fetch(`${getBaseUrl()}${apiPrefix()}/style-targets`);
    if (!res.ok)
      throw new Error(`Failed to fetch style targets: ${res.statusText}`);
    return res.json();
  },
  async getStyleTarget(id: string): Promise<StyleTargetFull> {
    const res = await fetch(`${getBaseUrl()}${apiPrefix()}/style-targets/${encodeURIComponent(id)}`);
    if (!res.ok) {
      if (res.status === 404) throw new Error("Style target not found");
      throw new Error(`Failed to fetch style target: ${res.statusText}`);
    }
    return res.json();
  },
};

export type AuthUser = { userId: string; email: string; displayName?: string };

export const authApi = {
  async register(
    email: string,
    password: string,
    displayName?: string,
  ): Promise<{ accessToken: string; user: AuthUser }> {
    const res = await fetch(`${getBaseUrl()}${apiPrefix()}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, displayName }),
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error ?? res.statusText);
    }
    return res.json();
  },
  async login(
    email: string,
    password: string,
  ): Promise<{ accessToken: string; user: AuthUser }> {
    const res = await fetch(`${getBaseUrl()}${apiPrefix()}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error ?? res.statusText);
    }
    return res.json();
  },
  async refresh(): Promise<{ accessToken: string; user?: AuthUser }> {
    const res = await fetch(`${getBaseUrl()}${apiPrefix()}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Refresh failed");
    return res.json();
  },
  async logout(): Promise<void> {
    await fetch(`${getBaseUrl()}${apiPrefix()}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  },
};
