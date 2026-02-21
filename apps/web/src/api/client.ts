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

async function fetchJson<T>(
  url: string,
  options?: RequestInit & { notFoundMessage?: string }
): Promise<T> {
  const { notFoundMessage, ...init } = options ?? {};
  const res = await fetch(url, init);
  if (res.status === 404 && notFoundMessage) throw new Error(notFoundMessage);
  if (!res.ok) throw new Error(`${url}: ${res.statusText}`);
  return res.json();
}

const base = () => `${getBaseUrl()}${apiPrefix()}`;

export const api = {
  async getGrapes(): Promise<GrapeWithStyleTargets[]> {
    return fetchJson(`${base()}/grapes`);
  },
  async getRegions(): Promise<Region[]> {
    return fetchJson(`${base()}/regions`);
  },
  async getRegionsMapConfig(): Promise<RegionsMapConfigResponse> {
    return fetchJson(`${base()}/regions/map-config`);
  },
  async getStructureDimensions(): Promise<StructureDimension[]> {
    return fetchJson(`${base()}/structure-dimensions`);
  },
  async getAromaTerms(): Promise<AromaTerm[]> {
    return fetchJson(`${base()}/aroma-terms`);
  },
  async getThermalBands(): Promise<ThermalBand[]> {
    return fetchJson(`${base()}/thermal-bands`);
  },
  async getStyleTargets(): Promise<StyleTargetFull[]> {
    return fetchJson(`${base()}/style-targets`);
  },
  async getStyleTarget(id: string): Promise<StyleTargetFull> {
    return fetchJson(`${base()}/style-targets/${encodeURIComponent(id)}`, {
      notFoundMessage: "Style target not found",
    });
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
