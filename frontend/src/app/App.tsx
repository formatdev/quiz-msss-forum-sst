import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { PinPadDialog } from '../components/PinPadDialog';
import { UtilityControls } from '../components/UtilityControls';
import {
  loadAdminSettings,
  normalizeAdminSettings,
  saveAdminSettings,
  type AdminSettings
} from '../features/settings/adminSettings';
import { FinalPage } from '../pages/FinalPage';
import { AdminPage } from '../pages/AdminPage';
import { NicknamePage } from '../pages/NicknamePage';
import { QuestionPage } from '../pages/QuestionPage';
import { WelcomePage } from '../pages/WelcomePage';
import {
  getCsvExportUrl,
  fetchLeaderboardSummary,
  fetchResult,
  fetchNextQuestion,
  initializeDatabase,
  startSession,
  submitAnswer,
  type LeaderboardSummaryResponse,
  type LanguageCode,
  type QuestionView,
  type SessionResultResponse,
  type SubmitAnswerResponse
} from '../services/api/sessionClient';
import { clearSession, getResumeCandidate, saveSession, touchSession } from '../features/session/sessionStore';
import '../styles/kiosk.css';

const IDLE_TICK_MS = 200;
const ADMIN_PIN_CODE = '3166';
const ADMIN_PIN_LENGTH = 4;

export function App() {
  const { i18n, t } = useTranslation();
  const [settings, setSettings] = useState<AdminSettings>(() => loadAdminSettings());
  const idleTimeoutMs = settings.idleTimeoutSeconds * 1000;
  const [step, setStep] = useState<'welcome' | 'nickname' | 'question' | 'final' | 'highscore'>('welcome');
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('fr');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState<QuestionView | null>(null);
  const [feedback, setFeedback] = useState<SubmitAnswerResponse | null>(null);
  const [result, setResult] = useState<SessionResultResponse | null>(null);
  const [leaderboardSummary, setLeaderboardSummary] = useState<LeaderboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [highscoreLoading, setHighscoreLoading] = useState(false);
  const [answerLoading, setAnswerLoading] = useState(false);
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idleDeadlineTs, setIdleDeadlineTs] = useState<number | null>(null);
  const [idleRemainingMs, setIdleRemainingMs] = useState(idleTimeoutMs);
  const [correctAnswersSoFar, setCorrectAnswersSoFar] = useState(0);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [showAdminPage, setShowAdminPage] = useState(false);

  useEffect(() => {
    setSelectedLanguage((i18n.language as LanguageCode) || 'fr');
  }, [i18n.language]);

  const restartQuiz = useCallback((): void => {
    clearSession();
    setSessionId(null);
    setQuestion(null);
    setFeedback(null);
    setResult(null);
    setLeaderboardSummary(null);
    setError(null);
    setCorrectAnswersSoFar(0);
    setShowAdminPage(false);
    setStep('welcome');
  }, []);

  const idleActive = step !== 'welcome';

  const resetIdleTimer = useCallback(() => {
    if (!idleActive) {
      return;
    }
    setIdleDeadlineTs(Date.now() + idleTimeoutMs);
    setIdleRemainingMs(idleTimeoutMs);
  }, [idleActive, idleTimeoutMs]);

  useEffect(() => {
    if (!idleActive) {
      setIdleDeadlineTs(null);
      setIdleRemainingMs(idleTimeoutMs);
      return;
    }
    resetIdleTimer();
  }, [idleActive, idleTimeoutMs, resetIdleTimer]);

  useEffect(() => {
    if (!idleActive) {
      return;
    }
    const handleActivity = () => {
      resetIdleTimer();
    };
    window.addEventListener('pointerdown', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity);
    return () => {
      window.removeEventListener('pointerdown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, [idleActive, resetIdleTimer]);

  useEffect(() => {
    if (!idleActive || idleDeadlineTs === null) {
      return;
    }
    const tick = () => {
      const remaining = Math.max(0, idleDeadlineTs - Date.now());
      setIdleRemainingMs(remaining);
      if (remaining <= 0) {
        setIdleDeadlineTs(null);
        restartQuiz();
      }
    };
    tick();
    const timerId = window.setInterval(tick, IDLE_TICK_MS);
    return () => window.clearInterval(timerId);
  }, [idleActive, idleDeadlineTs, restartQuiz]);

  const canStart = useMemo(() => !loading, [loading]);

  async function beginSession(nickname?: string): Promise<void> {
    setLoading(true);
    setError(null);
    setCorrectAnswersSoFar(0);
    try {
      const resumeSessionId = getResumeCandidate(selectedLanguage) ?? undefined;
      const session = await startSession({
        lang: selectedLanguage,
        nickname,
        resumeSessionId
      });
      saveSession({
        sessionId: session.sessionId,
        lang: selectedLanguage,
        startedAt: session.startedAt,
        totalQuestions: session.totalQuestions,
        lastActivityAt: new Date().toISOString()
      });
      setSessionId(session.sessionId);

      const nextQuestion = await fetchNextQuestion(session.sessionId);
      if (!nextQuestion) {
        clearSession();
        setError('No active questions available yet.');
        setStep('welcome');
        return;
      }
      touchSession();
      setQuestion(nextQuestion);
      setFeedback(null);
      setLeaderboardSummary(null);
      setStep('question');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      setStep('welcome');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitAnswer(selectedKeys: string[]): Promise<void> {
    if (!sessionId || !question) {
      return;
    }
    setAnswerLoading(true);
    setError(null);
    try {
      const response = await submitAnswer(sessionId, {
        questionId: question.questionId,
        selectedKeys
      });
      if (response.correct) {
        setCorrectAnswersSoFar((current) => current + 1);
      }
      touchSession();
      setFeedback(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setAnswerLoading(false);
    }
  }

  async function goToNextStepAfterExplanation(): Promise<void> {
    if (!sessionId) {
      return;
    }
    setTransitionLoading(true);
    setError(null);
    try {
      if (feedback?.hasMoreQuestions === false) {
        const finalResult = await fetchResult(sessionId);
        setResult(finalResult);
        setLeaderboardSummary(null);
        clearSession();
        setFeedback(null);
        setQuestion(null);
        setStep('final');
        return;
      }

      const nextQuestion = await fetchNextQuestion(sessionId);
      if (nextQuestion) {
        touchSession();
        setQuestion(nextQuestion);
        setFeedback(null);
        setStep('question');
        return;
      }

      const finalResult = await fetchResult(sessionId);
      setResult(finalResult);
      setLeaderboardSummary(null);
      clearSession();
      setFeedback(null);
      setQuestion(null);
      setStep('final');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      setStep('welcome');
    } finally {
      setTransitionLoading(false);
    }
  }

  function handleRequestAdminAccess(): void {
    setPinError(null);
    setShowPinDialog(true);
  }

  function handleSubmitAdminPin(pin: string): void {
    if (pin === ADMIN_PIN_CODE) {
      setPinError(null);
      setShowPinDialog(false);
      setShowAdminPage(true);
      return;
    }
    setPinError('Invalid PIN');
  }

  function handleSaveAdminSettings(nextSettings: AdminSettings): void {
    const normalized = normalizeAdminSettings(nextSettings);
    setSettings(normalized);
    saveAdminSettings(normalized);
    setShowAdminPage(false);
    setPinError(null);
    resetIdleTimer();
  }

  async function handleOpenHighscore(): Promise<void> {
    if (highscoreLoading) {
      return;
    }
    setHighscoreLoading(true);
    setError(null);
    try {
      const summary = await fetchLeaderboardSummary(selectedLanguage);
      clearSession();
      setSessionId(null);
      setQuestion(null);
      setFeedback(null);
      setResult(null);
      setCorrectAnswersSoFar(0);
      setLeaderboardSummary(summary);
      setStep('highscore');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setHighscoreLoading(false);
    }
  }

  async function handleInitializeDatabase(): Promise<{
    dumpPath: string;
    dumpFile: string;
    csvDumpPath: string;
    csvDumpFile: string;
    seedPath: string;
    seededQuestions: number;
    clearedSessions: number;
  }> {
    setError(null);
    const result = await initializeDatabase();
    clearSession();
    setSessionId(null);
    setQuestion(null);
    setFeedback(null);
    setResult(null);
    setLeaderboardSummary(null);
    setCorrectAnswersSoFar(0);
    setStep('welcome');
    return result;
  }

  let page: ReactNode = null;

  if (step === 'question' && question) {
    page = (
      <>
        <QuestionPage
          question={question}
          feedback={feedback}
          correctAnswersSoFar={correctAnswersSoFar}
          feedbackFadeOpacityPercent={settings.feedbackFadeOpacityPercent}
          fireworksEnabled={settings.fireworksEnabled}
          starsPerCorrectAnswer={settings.starsPerCorrectAnswer}
          onSubmit={(keys) => void handleSubmitAnswer(keys)}
          onContinue={() => void goToNextStepAfterExplanation()}
          isSubmitting={answerLoading}
          isContinuing={transitionLoading}
          idleRemainingMs={idleRemainingMs}
          idleTimeoutMs={idleTimeoutMs}
        />
        {error ? <p className="status-line error">{error}</p> : null}
      </>
    );
  }
  if (step === 'final' && result) {
    page = (
      <FinalPage
        result={result}
        highlightSessionId={sessionId}
        onRestart={restartQuiz}
        idleRemainingMs={idleRemainingMs}
        idleTimeoutMs={idleTimeoutMs}
      />
    );
  }
  if (step === 'highscore' && leaderboardSummary) {
    const highscoreResult: SessionResultResponse = {
      score: 0,
      maxScore: leaderboardSummary.maxScore,
      percentage: 0,
      scoreDistribution: leaderboardSummary.scoreDistribution,
      questionResults: leaderboardSummary.questionResults,
      leaderboard: leaderboardSummary.leaderboard
    };
    page = (
      <FinalPage
        result={highscoreResult}
        showSummary={false}
        highlightScore={null}
        highlightSessionId={null}
        onRestart={restartQuiz}
        idleRemainingMs={idleRemainingMs}
        idleTimeoutMs={idleTimeoutMs}
      />
    );
  }
  if (step === 'nickname') {
    page = (
      <NicknamePage
        onContinue={(nickname) => void beginSession(nickname)}
        idleRemainingMs={idleRemainingMs}
        idleTimeoutMs={idleTimeoutMs}
      />
    );
  }
  if (!page) {
    page = (
      <>
        <WelcomePage
          selectedLanguage={selectedLanguage}
          onLanguageSelect={(lang) => setSelectedLanguage(lang)}
          onStart={() => {
            if (canStart) {
              setStep('nickname');
            }
          }}
        />
        {loading ? <p className="status-line">Loading session...</p> : null}
        {error ? <p className="status-line error">{error}</p> : null}
      </>
    );
  }

  return (
    <>
      {page}
      <UtilityControls
        onRestart={() => setShowRestartConfirm(true)}
        onHighscore={() => void handleOpenHighscore()}
        onAdmin={handleRequestAdminAccess}
        showWelcomeOnlyActions={step === 'welcome'}
        hidden={showAdminPage || showPinDialog || showRestartConfirm}
      />
      {showRestartConfirm ? (
        <ConfirmDialog
          title={t('restartConfirmTitle')}
          message={t('restartConfirmMessage')}
          confirmLabel={t('restartConfirmButton')}
          cancelLabel={t('cancel')}
          onCancel={() => setShowRestartConfirm(false)}
          onConfirm={() => {
            setShowRestartConfirm(false);
            restartQuiz();
          }}
        />
      ) : null}
      {showPinDialog ? (
        <PinPadDialog
          title="Admin Access"
          pinLength={ADMIN_PIN_LENGTH}
          onSubmit={handleSubmitAdminPin}
          onCancel={() => {
            setShowPinDialog(false);
            setPinError(null);
          }}
          error={pinError}
        />
      ) : null}
      {showAdminPage ? (
        <AdminPage
          settings={settings}
          csvUrl={getCsvExportUrl()}
          onClose={() => setShowAdminPage(false)}
          onSave={handleSaveAdminSettings}
          onInitialize={handleInitializeDatabase}
        />
      ) : null}
    </>
  );
}
