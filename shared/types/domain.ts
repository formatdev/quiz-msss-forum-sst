export type QuestionType = 'single' | 'multiple';

export interface Question {
  id: string;
  type: QuestionType;
  topicTag: string;
  imageKey?: string;
  correctAnswers: string[];
}

export interface QuizSession {
  id: string;
  lang: 'fr' | 'de' | 'en';
  nickname?: string;
  startedAt: string;
  completedAt?: string;
  totalScore?: number;
  maxScore?: number;
  percentageScore?: number;
}
