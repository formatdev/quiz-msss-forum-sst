export type LanguageCode = 'fr' | 'de' | 'en';

export interface StartSessionRequest {
  lang: LanguageCode;
  nickname?: string;
  resumeSessionId?: string;
}

export interface StartSessionResponse {
  sessionId: string;
  totalQuestions: number;
  startedAt: string;
  resumed: boolean;
}

export interface QuestionView {
  questionId: string;
  type: 'single' | 'multiple';
  prompt: string;
  choices: Array<{ key: string; label: string }>;
  imageKey: string | null;
  progress: {
    current: number;
    total: number;
  };
}

export interface SubmitAnswerRequest {
  questionId: string;
  selectedKeys: string[];
}

export interface SubmitAnswerResponse {
  correct: boolean;
  awardedPoints: number;
  maxPoints: number;
  correctKeys: string[];
  explanation: string;
  friendlyFeedback: string;
}

export interface LeaderboardEntry {
  rank: number;
  nickname: string;
  score: number;
  maxScore: number;
  percentage: number;
}

export interface SessionResultResponse {
  score: number;
  maxScore: number;
  percentage: number;
  leaderboard: LeaderboardEntry[];
}

export interface HealthResponse {
  status: 'ok';
  time: string;
}
