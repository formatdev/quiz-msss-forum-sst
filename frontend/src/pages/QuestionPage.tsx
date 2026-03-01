import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TimedContinueButton } from '../components/TimedContinueButton';
import type { QuestionView, SubmitAnswerResponse } from '../services/api/sessionClient';

const DEFAULT_QUESTION_IMAGE = '/media/questions/q-default.png';
const DEFAULT_MASCOT_IMAGE = '/media/mascot/mascot.png';
const FEEDBACK_TRANSITION_MS = 650;

type Props = {
  question: QuestionView;
  feedback: SubmitAnswerResponse | null;
  correctAnswersSoFar: number;
  feedbackFadeOpacityPercent: number;
  fireworksEnabled: boolean;
  starsPerCorrectAnswer: number;
  onSubmit: (selectedKeys: string[]) => void;
  onContinue: () => void;
  isSubmitting: boolean;
  isContinuing: boolean;
  idleRemainingMs: number;
  idleTimeoutMs: number;
};

export function QuestionPage({
  question,
  feedback,
  correctAnswersSoFar,
  feedbackFadeOpacityPercent,
  fireworksEnabled,
  starsPerCorrectAnswer,
  onSubmit,
  onContinue,
  isSubmitting,
  isContinuing,
  idleRemainingMs,
  idleTimeoutMs
}: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string[]>([]);
  const [feedbackReady, setFeedbackReady] = useState(false);
  const [fireworkBurstKey, setFireworkBurstKey] = useState(0);

  useEffect(() => {
    setSelected([]);
  }, [question.questionId]);

  useEffect(() => {
    if (!feedback) {
      setFeedbackReady(false);
      return;
    }
    setFeedbackReady(false);
    const timer = window.setTimeout(() => setFeedbackReady(true), FEEDBACK_TRANSITION_MS);
    return () => window.clearTimeout(timer);
  }, [feedback, question.questionId]);

  useEffect(() => {
    if (!feedback || (feedback.awardedPoints <= 0 && !feedback.correct)) {
      return;
    }
    setFireworkBurstKey((current) => current + 1);
  }, [feedback, question.questionId]);

  const isLocked = Boolean(feedback);
  const allAnswersCorrect = Boolean(
    feedback &&
      feedback.correctKeys.length === 1 &&
      feedback.correctKeys[0]?.trim().toLowerCase() === 'any'
  );
  const canSubmit = useMemo(
    () => selected.length > 0 && !isSubmitting && !isLocked,
    [selected.length, isSubmitting, isLocked]
  );

  function toggleChoice(key: string): void {
    if (isLocked) {
      return;
    }
    setSelected((current) => {
      if (question.type === 'multiple') {
        return current.includes(key) ? current.filter((choiceKey) => choiceKey !== key) : [...current, key];
      }
      return current[0] === key ? [] : [key];
    });
  }

  function getChoiceStateClass(choiceKey: string): string {
    const isSelected = selected.includes(choiceKey);
    if (!feedback) {
      return isSelected ? 'selected' : '';
    }
    if (allAnswersCorrect) {
      return isSelected ? 'selected' : '';
    }
    const isCorrect = feedback.correctKeys.includes(choiceKey);
    if (isCorrect && isSelected) {
      return 'result-correct-strong';
    }
    if (isCorrect && !isSelected) {
      return 'result-correct-soft';
    }
    if (!isCorrect && isSelected) {
      return 'result-wrong-strong';
    }
    return 'result-wrong-soft';
  }

  function isChoiceCorrect(choiceKey: string): boolean {
    if (!feedback) {
      return false;
    }
    if (allAnswersCorrect) {
      return true;
    }
    return feedback.correctKeys.includes(choiceKey);
  }

  const isPartial = Boolean(
    feedback && !feedback.correct && feedback.awardedPoints > 0 && feedback.awardedPoints < feedback.maxPoints
  );

  const resultTone = feedback
    ? feedback.correct
      ? 'correct'
      : isPartial
        ? 'partial'
        : 'wrong'
    : null;

  const resultIcon = feedback
    ? feedback.correct
      ? '✓'
      : isPartial
        ? '◐'
        : '✕'
    : '';

  const resultLabel = feedback
    ? feedback.correct
      ? t('answerCorrect')
      : isPartial
        ? t('answerPartial')
        : t('answerWrong')
    : '';
  const showResultStatus = Boolean(feedback && !allAnswersCorrect);
  const feedbackMascotSrc = feedback
    ? feedback.correct || isPartial
      ? '/media/mascot/mascot-correct.png'
      : '/media/mascot/mascot-wrong.png'
    : DEFAULT_MASCOT_IMAGE;
  const questionImageSrc = question.imageKey
    ? `/media/questions/${question.imageKey}`
    : DEFAULT_QUESTION_IMAGE;
  const celebrate = Boolean(fireworksEnabled && feedback && (feedback.correct || feedback.awardedPoints > 0));
  const fireworkStarCount = Math.max(
    starsPerCorrectAnswer,
    Math.min(240, Math.max(1, correctAnswersSoFar) * starsPerCorrectAnswer)
  );
  const fireworkStars = useMemo(() => {
    if (!celebrate || fireworkStarCount === 0) {
      return [];
    }
    return Array.from({ length: fireworkStarCount }, (_, index) => {
      const ratio = (index % 36) / 36;
      const angle = ratio * Math.PI * 2;
      const distance = 90 + (index % 6) * 34;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance - 45;
      const delayMs = (index % 12) * 80;
      const sizePx = 14 + (index % 3) * 4;
      const xPct = 18 + ((index * 37) % 64);
      const yPct = 14 + ((index * 53) % 58);
      return {
        id: `${fireworkBurstKey}-${index}`,
        style: {
          '--star-dx': `${dx.toFixed(2)}px`,
          '--star-dy': `${dy.toFixed(2)}px`,
          '--star-delay': `${delayMs}ms`,
          '--star-size': `${sizePx}px`,
          '--star-x': `${xPct}%`,
          '--star-y': `${yPct}%`
        } as CSSProperties
      };
    });
  }, [celebrate, fireworkBurstKey, fireworkStarCount]);

  return (
    <>
      <main className="kiosk-shell">
        <div className="quiz-split">
          <section className="quiz-panel quiz-panel-left">
          <h1>
            {t('questionProgressTitle', {
              current: question.progress.current,
              total: question.progress.total
            })}
          </h1>
          <div className="question-content">
            <h2>{question.prompt}</h2>
            <div className="choice-grid">
              {question.choices.map((choice) => (
                <button
                  key={choice.key}
                  className={`kiosk-button choice ${isLocked ? 'locked' : ''} ${getChoiceStateClass(choice.key)}`}
                  onClick={() => toggleChoice(choice.key)}
                  aria-pressed={selected.includes(choice.key)}
                  disabled={isLocked}
                >
                  <span className="choice-inner">
                    <span>{choice.label}</span>
                    {feedback && !allAnswersCorrect ? (
                      <span className={`choice-marker ${isChoiceCorrect(choice.key) ? 'correct' : 'wrong'}`}>
                        {isChoiceCorrect(choice.key) ? '✓' : '✕'}
                      </span>
                    ) : null}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="left-action-slot">
            {!feedback ? (
              <TimedContinueButton
                label={isSubmitting ? t('validating') : t('continue')}
                onClick={() => onSubmit(selected)}
                disabled={!canSubmit}
                idleRemainingMs={idleRemainingMs}
                idleTimeoutMs={idleTimeoutMs}
              />
            ) : null}
          </div>
          </section>

          <section className="quiz-panel quiz-panel-right">
            <div className={`visual-slot ${feedback ? 'visual-slot-feedback' : 'visual-slot-placeholder'}`}>
              {!feedback ? (
                <img
                  key={question.questionId}
                  className="question-illustration"
                  src={questionImageSrc}
                  alt={t('imagePlaceholder')}
                  onError={(event) => {
                    const img = event.currentTarget;
                    if (img.dataset.fallbackApplied === 'true') {
                      return;
                    }
                    img.dataset.fallbackApplied = 'true';
                    img.src = DEFAULT_QUESTION_IMAGE;
                  }}
                />
              ) : (
                <div
                  className={`feedback-stage ${feedbackReady ? 'ready' : ''}`}
                  style={
                    {
                      '--feedback-transition-ms': `${FEEDBACK_TRANSITION_MS}ms`,
                      '--feedback-fade-opacity': `${Math.max(0, Math.min(feedbackFadeOpacityPercent, 100)) / 100}`
                    } as CSSProperties
                  }
                >
                  <img
                    className="feedback-mascot"
                    src={feedbackMascotSrc}
                    alt={resultLabel}
                    onError={(event) => {
                      const img = event.currentTarget;
                      if (img.dataset.fallbackApplied === 'true') {
                        return;
                      }
                      img.dataset.fallbackApplied = 'true';
                      img.src = DEFAULT_MASCOT_IMAGE;
                    }}
                  />
                  {feedbackReady ? (
                    <div className="feedback-overlay">
                      <div className={`feedback-content ${feedbackReady ? 'ready' : ''}`}>
                        {showResultStatus ? (
                          <p className={`result-status ${resultTone}`}>
                            <span className="result-status-icon">{resultIcon}</span>
                            <span>{resultLabel}</span>
                          </p>
                        ) : null}
                        <div className="feedback-main">
                          <p className="explanation-text">{feedback.explanation}</p>
                        </div>
                        <div className="feedback-action">
                          <TimedContinueButton
                            label={isContinuing ? t('loading') : t('continue')}
                            onClick={onContinue}
                            disabled={isContinuing}
                            idleRemainingMs={idleRemainingMs}
                            idleTimeoutMs={idleTimeoutMs}
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
      {celebrate && fireworkStars.length > 0 ? (
        <div className="global-fireworks" aria-hidden="true">
          {fireworkStars.map((star) => (
            <span key={star.id} className="firework-star" style={star.style}>
              ★
            </span>
          ))}
        </div>
      ) : null}
    </>
  );
}
