import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TimedContinueButton } from '../components/TimedContinueButton';
import type { SessionResultResponse } from '../services/api/sessionClient';

type Props = {
  result: SessionResultResponse;
  onRestart: () => void;
  idleRemainingMs: number;
  idleTimeoutMs: number;
  showSummary?: boolean;
  highlightScore?: number | null;
  highlightSessionId?: string | null;
};

type ChartTooltipState = {
  text: string;
  x: number;
  y: number;
};

export function FinalPage({
  result,
  onRestart,
  idleRemainingMs,
  idleTimeoutMs,
  showSummary = true,
  highlightScore,
  highlightSessionId = null
}: Props) {
  const { t, i18n } = useTranslation();
  const [chartTooltip, setChartTooltip] = useState<ChartTooltipState | null>(null);
  const maxUsers = result.scoreDistribution.reduce((currentMax, item) => Math.max(currentMax, item.users), 0);
  const maxQuestionPoints = result.questionResults.reduce(
    (currentMax, item) => Math.max(currentMax, item.totalPoints),
    0
  );
  const highlightedScore = highlightScore ?? (showSummary ? result.score : null);
  const percentageRounded = Math.round(result.percentage);
  const finalTitle = percentageRounded >= 50 ? t('finalTitlePass') : t('finalTitleThanks');
  const formatRankScore = (value: number): string =>
    value.toLocaleString(i18n.language, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    });

  useEffect(() => {
    const handleOutsidePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) {
        setChartTooltip(null);
        return;
      }
      if (target.closest('.distribution-bar') || target.closest('.chart-click-tooltip')) {
        return;
      }
      setChartTooltip(null);
    };

    window.addEventListener('pointerdown', handleOutsidePointerDown);
    return () => {
      window.removeEventListener('pointerdown', handleOutsidePointerDown);
    };
  }, []);

  return (
    <main className="kiosk-shell">
      <div className="quiz-split">
        <section className="quiz-panel quiz-panel-left final-left">
          {showSummary ? (
            <>
              <h1>{finalTitle}</h1>
              <p className="score-line">
                {t('finalSummary', {
                  score: result.score,
                  maxScore: result.maxScore,
                  percentage: percentageRounded
                })}
              </p>
            </>
          ) : null}
          <div className="final-charts">
            <div className="distribution-section">
              <h2 className="distribution-title">{t('scoreDistributionTitle')}</h2>
              <div className="distribution-chart-wrapper">
                <div className="distribution-axis-y">
                  <span>{t('scoreDistributionYAxis')}</span>
                </div>
                <div
                  className="distribution-chart"
                  role="img"
                  aria-label={t('scoreDistributionTitle')}
                  style={{ gridTemplateColumns: `repeat(${Math.max(result.scoreDistribution.length, 1)}, minmax(0, 1fr))` }}
                >
                  {result.scoreDistribution.map((bucket) => {
                    const height = maxUsers > 0 ? (bucket.users / maxUsers) * 100 : 0;
                    const isUserBucket = highlightedScore !== null && bucket.correctCount === highlightedScore;
                    const showIntegerTick = Number.isInteger(bucket.correctCount);
                    return (
                    <div key={bucket.correctCount} className="distribution-bar-group">
                      <span
                        className={`distribution-bar ${isUserBucket ? 'user' : ''}`}
                        style={{ height: `${Math.max(height, bucket.users > 0 ? 4 : 0)}%` }}
                        title={String(bucket.users)}
                        onPointerDown={(event) => {
                          event.stopPropagation();
                          const rect = event.currentTarget.getBoundingClientRect();
                          setChartTooltip({
                            text: String(bucket.users),
                            x: rect.left + rect.width / 2,
                            y: rect.top - 8
                          });
                        }}
                      />
                        <span
                          className={`distribution-x-label ${showIntegerTick ? '' : 'distribution-x-label-placeholder'}`}
                          aria-hidden={!showIntegerTick}
                        >
                          {showIntegerTick ? bucket.correctCount : '0'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <p className="distribution-axis-label distribution-axis-x">{t('scoreDistributionXAxis')}</p>
            </div>

            <div className="distribution-section">
              <h2 className="distribution-title">{t('questionResultsTitle')}</h2>
              <div className="distribution-chart-wrapper">
                <div className="distribution-axis-y">
                  <span>{t('questionResultsYAxis')}</span>
                </div>
                <div
                  className="distribution-chart question-results-chart"
                  role="img"
                  aria-label={t('questionResultsTitle')}
                  style={{ gridTemplateColumns: `repeat(${Math.max(result.questionResults.length, 1)}, minmax(0, 1fr))` }}
                >
                  {result.questionResults.map((question) => {
                    const height = maxQuestionPoints > 0 ? (question.totalPoints / maxQuestionPoints) * 100 : 0;
                    return (
                      <div key={question.questionId} className="distribution-bar-group">
                        <span
                          className="distribution-bar question-results-bar"
                          style={{ height: `${Math.max(height, question.totalPoints > 0 ? 4 : 0)}%` }}
                          title={question.questionText}
                          onPointerDown={(event) => {
                            event.stopPropagation();
                            const rect = event.currentTarget.getBoundingClientRect();
                            setChartTooltip({
                              text: question.questionText,
                              x: rect.left + rect.width / 2,
                              y: rect.top - 8
                            });
                          }}
                        />
                        <span className="distribution-x-label">{question.questionNumber}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <p className="distribution-axis-label distribution-axis-x">{t('questionResultsXAxis')}</p>
            </div>
          </div>

          <TimedContinueButton
            label={t('restart')}
            onClick={onRestart}
            idleRemainingMs={idleRemainingMs}
            idleTimeoutMs={idleTimeoutMs}
          />
        </section>

        <section className="quiz-panel quiz-panel-right final-right">
          <h2>{t('leaderboard')}</h2>
          <ol className="leaderboard-list">
            {result.leaderboard.map((entry) => {
              const isCurrentParticipant =
                highlightSessionId !== null && entry.sessionId === highlightSessionId;
              return (
                <li key={entry.sessionId} className={isCurrentParticipant ? 'current' : undefined}>
                  <span>
                    #{entry.rank} {entry.nickname}
                  </span>
                  <span>
                    {formatRankScore(entry.score)} ({Math.round(entry.percentage)}%)
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
      {chartTooltip ? (
        <div
          className="chart-click-tooltip"
          style={{
            left: `${chartTooltip.x}px`,
            top: `${chartTooltip.y}px`
          }}
          role="tooltip"
        >
          {chartTooltip.text}
        </div>
      ) : null}
    </main>
  );
}
