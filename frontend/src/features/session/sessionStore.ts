import type { LanguageCode } from '../../services/api/sessionClient';

const STORAGE_KEY = 'quiz-session-v1';
const RESUME_TIMEOUT_MS = 120_000;

export type StoredSession = {
  sessionId: string;
  lang: LanguageCode;
  startedAt: string;
  lastActivityAt: string;
  totalQuestions: number;
};

export function loadSession(): StoredSession | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

export function saveSession(session: StoredSession): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function touchSession(): void {
  const current = loadSession();
  if (!current) {
    return;
  }
  saveSession({ ...current, lastActivityAt: new Date().toISOString() });
}

export function getResumeCandidate(lang: LanguageCode): string | null {
  const current = loadSession();
  if (!current || current.lang !== lang) {
    return null;
  }
  const ageMs = Date.now() - new Date(current.lastActivityAt).getTime();
  if (ageMs > RESUME_TIMEOUT_MS) {
    clearSession();
    return null;
  }
  return current.sessionId;
}
