export type LanguageCode = 'fr' | 'de' | 'en';

export type StartSessionPayload = {
  lang: LanguageCode;
  nickname?: string;
  resumeSessionId?: string;
};

export type StartSessionResponse = {
  sessionId: string;
  totalQuestions: number;
  startedAt: string;
  resumed: boolean;
};

export type QuestionView = {
  questionId: string;
  type: 'single' | 'multiple';
  prompt: string;
  choices: Array<{ key: string; label: string }>;
  imageKey: string | null;
  progress: {
    current: number;
    total: number;
  };
};

export type SubmitAnswerPayload = {
  questionId: string;
  selectedKeys: string[];
};

export type SubmitAnswerResponse = {
  correct: boolean;
  awardedPoints: number;
  maxPoints: number;
  hasMoreQuestions: boolean;
  correctKeys: string[];
  explanation: string;
  friendlyFeedback: string;
};

export type LeaderboardEntry = {
  sessionId: string;
  rank: number;
  nickname: string;
  score: number;
  maxScore: number;
  percentage: number;
};

export type SessionResultResponse = {
  score: number;
  maxScore: number;
  percentage: number;
  scoreDistribution: Array<{
    correctCount: number;
    users: number;
  }>;
  questionResults: Array<{
    questionId: string;
    questionNumber: number;
    questionText: string;
    totalPoints: number;
  }>;
  leaderboard: LeaderboardEntry[];
};

export type LeaderboardSummaryResponse = {
  leaderboard: LeaderboardEntry[];
  maxScore: number;
  scoreDistribution: Array<{
    correctCount: number;
    users: number;
  }>;
  questionResults: Array<{
    questionId: string;
    questionNumber: number;
    questionText: string;
    totalPoints: number;
  }>;
};

export type AdminInitializeResponse = {
  dumpPath: string;
  dumpFile: string;
  csvDumpPath: string;
  csvDumpFile: string;
  seedPath: string;
  seededQuestions: number;
  clearedSessions: number;
};

const RAW_API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');
const API_ROOT = RAW_API_BASE
  ? RAW_API_BASE.endsWith('/api')
    ? RAW_API_BASE
    : `${RAW_API_BASE}/api`
  : '/api';

function apiUrl(path: string): string {
  return `${API_ROOT}${path.startsWith('/') ? path : `/${path}`}`;
}

export function getCsvExportUrl(): string {
  return apiUrl('/admin/export.csv');
}

export async function initializeDatabase(): Promise<AdminInitializeResponse> {
  const url = apiUrl('/admin/initialize');
  const res = await fetch(url, {
    method: 'POST'
  });
  if (!res.ok) {
    return throwHttpError('POST', url, res);
  }
  return (await res.json()) as AdminInitializeResponse;
}

async function readBodySafe(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return '';
  }
}

async function throwHttpError(method: string, url: string, res: Response): Promise<never> {
  const body = await readBodySafe(res);
  const tail = body ? `, body=${body}` : '';
  throw new Error(`${method} ${url} failed (${res.status})${tail}`);
}

export async function startSession(payload: StartSessionPayload): Promise<StartSessionResponse> {
  const url = apiUrl('/sessions');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    return throwHttpError('POST', url, res);
  }
  return (await res.json()) as StartSessionResponse;
}

export async function fetchNextQuestion(sessionId: string): Promise<QuestionView | null> {
  const url = apiUrl(`/sessions/${sessionId}/question`);
  const res = await fetch(url);
  if (res.status === 204) {
    return null;
  }
  if (!res.ok) {
    return throwHttpError('GET', url, res);
  }
  return (await res.json()) as QuestionView;
}

export async function submitAnswer(
  sessionId: string,
  payload: SubmitAnswerPayload
): Promise<SubmitAnswerResponse> {
  const url = apiUrl(`/sessions/${sessionId}/answers`);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    return throwHttpError('POST', url, res);
  }
  return (await res.json()) as SubmitAnswerResponse;
}

export async function fetchResult(sessionId: string): Promise<SessionResultResponse> {
  const url = apiUrl(`/sessions/${sessionId}/result`);
  const res = await fetch(url);
  if (!res.ok) {
    return throwHttpError('GET', url, res);
  }
  return (await res.json()) as SessionResultResponse;
}

export async function fetchLeaderboardSummary(lang?: LanguageCode): Promise<LeaderboardSummaryResponse> {
  const query = lang ? `?lang=${encodeURIComponent(lang)}` : '';
  const url = apiUrl(`/leaderboard${query}`);
  const res = await fetch(url);
  if (!res.ok) {
    return throwHttpError('GET', url, res);
  }
  const body = (await res.json()) as {
    entries?: LeaderboardEntry[];
    maxScore?: number;
    scoreDistribution?: Array<{ correctCount: number; users: number }>;
    questionResults?: Array<{
      questionId: string;
      questionNumber: number;
      questionText: string;
      totalPoints: number;
    }>;
  };
  return {
    leaderboard: body.entries ?? [],
    maxScore: Number(body.maxScore ?? 0),
    scoreDistribution: body.scoreDistribution ?? [],
    questionResults: body.questionResults ?? []
  };
}
