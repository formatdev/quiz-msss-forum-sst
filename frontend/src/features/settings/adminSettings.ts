export type AdminSettings = {
  idleTimeoutSeconds: number;
  feedbackFadeOpacityPercent: number;
  fireworksEnabled: boolean;
  starsPerCorrectAnswer: number;
};

const STORAGE_KEY = 'quiz-admin-settings-v1';

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  idleTimeoutSeconds: 60,
  feedbackFadeOpacityPercent: 40,
  fireworksEnabled: true,
  starsPerCorrectAnswer: 6
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function normalizeAdminSettings(input: Partial<AdminSettings> | null | undefined): AdminSettings {
  const base = { ...DEFAULT_ADMIN_SETTINGS, ...(input ?? {}) };
  return {
    idleTimeoutSeconds: clamp(Math.round(base.idleTimeoutSeconds), 15, 600),
    feedbackFadeOpacityPercent: clamp(Math.round(base.feedbackFadeOpacityPercent), 0, 100),
    fireworksEnabled: Boolean(base.fireworksEnabled),
    starsPerCorrectAnswer: clamp(Math.round(base.starsPerCorrectAnswer), 1, 30)
  };
}

export function loadAdminSettings(): AdminSettings {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return DEFAULT_ADMIN_SETTINGS;
  }
  try {
    return normalizeAdminSettings(JSON.parse(raw) as Partial<AdminSettings>);
  } catch {
    return DEFAULT_ADMIN_SETTINGS;
  }
}

export function saveAdminSettings(settings: AdminSettings): void {
  const normalized = normalizeAdminSettings(settings);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
}
