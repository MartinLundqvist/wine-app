import type {
  AromaSourceWithClusters,
  AppearanceDimensionWithScale,
  GrapeWithWineStyleIds,
  Region,
  RegionCreate,
  RegionsMapConfigResponse,
  CountryMapConfig,
  CountryMapConfigUpsert,
  BoundaryMappingsUpsert,
  GeoFeaturesResponse,
  GeoSuggestions,
  StructureDimensionWithScale,
  WineStyleFull,
  WineStyleCreate,
  WineStylePatch,
  ConfusionGroupResponse,
  ConfusionDifficulty,
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

/** TopoJSON returned by /regions/geo/:slug (objects.regions.geometries). */
export type RegionTopoJson = {
  objects?: {
    regions?: {
      geometries?: Array<{ properties?: { name?: string } }>;
    };
  };
};

export const api = {
  async getGrapes(): Promise<GrapeWithWineStyleIds[]> {
    return fetchJson(`${base()}/grapes`);
  },
  async getRegions(): Promise<Region[]> {
    return fetchJson(`${base()}/regions`);
  },
  async getRegionsMapConfig(): Promise<RegionsMapConfigResponse> {
    return fetchJson(`${base()}/regions/map-config`);
  },
  async getRegionGeo(geoSlug: string): Promise<RegionTopoJson> {
    return fetchJson(`${base()}/regions/geo/${encodeURIComponent(geoSlug)}`);
  },
  async getGeoFeatures(geoSlug: string): Promise<GeoFeaturesResponse> {
    return fetchJson(`${base()}/regions/geo/${encodeURIComponent(geoSlug)}/features`);
  },
  async getGeoSuggestions(adminName: string): Promise<{ suggestions: GeoSuggestions | null }> {
    const params = new URLSearchParams({ adminName });
    return fetchJson(`${base()}/regions/geo/suggestions?${params}`);
  },
  async getBoundaryMappings(regionId: string): Promise<{ featureNames: string[] }> {
    return fetchJson(`${base()}/regions/${encodeURIComponent(regionId)}/boundary-mappings`);
  },
  async getStructureDimensions(): Promise<StructureDimensionWithScale[]> {
    return fetchJson(`${base()}/structure-dimensions`);
  },
  async getAppearanceDimensions(): Promise<AppearanceDimensionWithScale[]> {
    return fetchJson(`${base()}/appearance-dimensions`);
  },
  async getAromaTaxonomy(): Promise<AromaSourceWithClusters[]> {
    return fetchJson(`${base()}/aroma-taxonomy`);
  },
  async getOrdinalScales(): Promise<{ id: string; displayName: string; labels: string[] }[]> {
    return fetchJson(`${base()}/ordinal-scales`);
  },
  async getStyleTargets(): Promise<WineStyleFull[]> {
    return fetchJson(`${base()}/style-targets`);
  },
  async getStyleTarget(id: string): Promise<WineStyleFull> {
    return fetchJson(`${base()}/style-targets/${encodeURIComponent(id)}`, {
      notFoundMessage: "Style target not found",
    });
  },
  async getConfusionGroup(
    id: string,
    difficulty: ConfusionDifficulty = "medium"
  ): Promise<ConfusionGroupResponse> {
    const params = new URLSearchParams({ difficulty });
    return fetchJson(
      `${base()}/style-targets/${encodeURIComponent(id)}/confusion-group?${params}`,
      { notFoundMessage: "Style target not found" }
    );
  },
  // Admin: same shape as style-targets
  async getWineStyles(): Promise<WineStyleFull[]> {
    return fetchJson(`${base()}/wine-styles`);
  },
  async getWineStyle(id: string): Promise<WineStyleFull> {
    return fetchJson(`${base()}/wine-styles/${encodeURIComponent(id)}`, {
      notFoundMessage: "Wine style not found",
    });
  },
};

export type AuthUser = { userId: string; email: string; displayName?: string; role?: string };

export const adminApi = {
  async createWineStyle(
    accessToken: string,
    body: WineStyleCreate
  ): Promise<WineStyleFull> {
    const res = await fetch(`${base()}/wine-styles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      let err: { message?: string; error?: string } = {};
      try {
        err = text ? JSON.parse(text) : {};
      } catch {
        err = { message: text || res.statusText };
      }
      throw new Error(err.message ?? err.error ?? res.statusText);
    }
    const text = await res.text();
    if (!text) throw new Error("Empty response");
    return JSON.parse(text);
  },
  async updateWineStyle(
    accessToken: string,
    id: string,
    body: WineStylePatch
  ): Promise<WineStyleFull> {
    const res = await fetch(`${base()}/wine-styles/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message ?? (err as { error?: string }).error ?? res.statusText);
    }
    return res.json();
  },
  async deleteWineStyle(accessToken: string, id: string): Promise<void> {
    const res = await fetch(`${base()}/wine-styles/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message ?? (err as { error?: string }).error ?? res.statusText);
    }
  },
  async createRegion(
    accessToken: string,
    body: RegionCreate
  ): Promise<Region> {
    const res = await fetch(`${base()}/regions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      let err: { message?: string; error?: string } = {};
      try {
        err = text ? JSON.parse(text) : {};
      } catch {
        err = { message: text || res.statusText };
      }
      throw new Error(err.message ?? err.error ?? res.statusText);
    }
    return res.json();
  },
  async updateRegion(
    accessToken: string,
    id: string,
    body: Partial<Omit<RegionCreate, "id">>
  ): Promise<Region> {
    const res = await fetch(`${base()}/regions/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      let err: { message?: string; error?: string } = {};
      try {
        err = text ? JSON.parse(text) : {};
      } catch {
        err = { message: text || res.statusText };
      }
      throw new Error(err.message ?? err.error ?? res.statusText);
    }
    return res.json();
  },
  async deleteRegion(
    accessToken: string,
    id: string
  ): Promise<void> {
    const res = await fetch(`${base()}/regions/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok && res.status !== 204) {
      const text = await res.text();
      let err: { message?: string; error?: string } = {};
      try {
        err = text ? JSON.parse(text) : {};
      } catch {
        err = { message: text || res.statusText };
      }
      throw new Error(err.message ?? err.error ?? res.statusText);
    }
  },
  async upsertMapConfig(
    accessToken: string,
    regionId: string,
    body: CountryMapConfigUpsert
  ): Promise<CountryMapConfig> {
    const res = await fetch(
      `${base()}/regions/${encodeURIComponent(regionId)}/map-config`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      }
    );
    if (!res.ok) {
      const text = await res.text();
      let err: { message?: string; error?: string } = {};
      try {
        err = text ? JSON.parse(text) : {};
      } catch {
        err = { message: text || res.statusText };
      }
      throw new Error(err.message ?? err.error ?? res.statusText);
    }
    return res.json();
  },
  async deleteMapConfig(accessToken: string, regionId: string): Promise<void> {
    const res = await fetch(
      `${base()}/regions/${encodeURIComponent(regionId)}/map-config`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (!res.ok && res.status !== 204) {
      const text = await res.text();
      let err: { message?: string; error?: string } = {};
      try {
        err = text ? JSON.parse(text) : {};
      } catch {
        err = { message: text || res.statusText };
      }
      throw new Error(err.message ?? err.error ?? res.statusText);
    }
  },
  async upsertBoundaryMappings(
    accessToken: string,
    regionId: string,
    body: BoundaryMappingsUpsert
  ): Promise<{ featureNames: string[] }> {
    const res = await fetch(
      `${base()}/regions/${encodeURIComponent(regionId)}/boundary-mappings`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      }
    );
    if (!res.ok) {
      const text = await res.text();
      let err: { message?: string; error?: string } = {};
      try {
        err = text ? JSON.parse(text) : {};
      } catch {
        err = { message: text || res.statusText };
      }
      throw new Error(err.message ?? err.error ?? res.statusText);
    }
    return res.json();
  },
};

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
