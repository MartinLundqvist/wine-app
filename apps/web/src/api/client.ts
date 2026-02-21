import type {
  GrapeWithStyleTargets,
  Region,
  RegionsMapConfigResponse,
  StructureDimension,
  AromaTerm,
  ThermalBand,
  StyleTargetFull,
  ExerciseTemplate,
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
  async getExerciseTemplates(): Promise<ExerciseTemplate[]> {
    const res = await fetch(`${getBaseUrl()}${apiPrefix()}/exercise-templates`);
    if (!res.ok)
      throw new Error(`Failed to fetch exercise templates: ${res.statusText}`);
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

export type ExercisePayload = {
  mapId?: string;
  xAttr?: string;
  yAttr?: string;
  correctStyleTargetId?: string;
  correctName?: string;
  correctPosition?: { x: number; y: number };
  seed?: number;
  wineColor?: string;
  format?: string;
  descriptorClue?: { descriptorId: string; name: string };
  options?: { styleTargetId: string; name: string }[];
  structureClues?: Record<string, number>;
  styleTargets?: {
    styleTargetId: string;
    name: string;
    correctPosition: { x: number; y: number };
  }[];
};

export type ExerciseSubmitResult = {
  isCorrect: boolean;
  score: number;
  correctPosition: { x: number; y: number } | null;
  feedback: { structureMatch: string; [k: string]: unknown };
};

export type ProgressRow = {
  userId: string;
  exerciseFormat: string;
  wineColor: string;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  masteryState: string;
  lastAttemptedAt: string | null;
  updatedAt: string;
};

export const progressApi = {
  async getProgress(accessToken: string): Promise<ProgressRow[]> {
    const res = await fetch(`${getBaseUrl()}${apiPrefix()}/progress`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch progress");
    return res.json();
  },
};

export const exerciseApi = {
  async generate(
    accessToken: string,
    mapId: string,
    exclude?: string[],
  ): Promise<{
    payload: ExercisePayload;
    totalAvailable: number;
    templateId: string;
  }> {
    const res = await fetch(`${getBaseUrl()}${apiPrefix()}/exercise/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: "include",
      body: JSON.stringify({ mapId, exclude }),
    });
    if (!res.ok) throw new Error("Failed to generate exercise");
    return res.json();
  },
  async generateDrill(
    accessToken: string,
    templateId: string,
    exclude?: string[],
  ): Promise<{
    payload: ExercisePayload;
    totalAvailable: number;
    templateId: string;
  }> {
    const res = await fetch(`${getBaseUrl()}${apiPrefix()}/exercise/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: "include",
      body: JSON.stringify({ templateId, exclude }),
    });
    if (!res.ok) throw new Error("Failed to generate drill");
    return res.json();
  },
  async submit(
    accessToken: string,
    templateId: string,
    payload: ExercisePayload,
    userAnswer: Record<string, unknown>,
  ): Promise<ExerciseSubmitResult> {
    const res = await fetch(`${getBaseUrl()}${apiPrefix()}/exercise/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: "include",
      body: JSON.stringify({ templateId, payload, userAnswer }),
    });
    if (!res.ok) throw new Error("Failed to submit");
    return res.json();
  },
};
