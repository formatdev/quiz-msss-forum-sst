import { useTranslation } from 'react-i18next';
import type { SubmitAnswerResponse } from '../services/api/sessionClient';

type Props = {
  feedback: SubmitAnswerResponse;
  onContinue: () => void;
  isLoadingNext: boolean;
};

export function ExplanationPage({ feedback, onContinue, isLoadingNext }: Props) {
  const { t } = useTranslation();

  return (
    <main className="kiosk-shell">
      <h1>{feedback.correct ? 'Bravo!' : 'Continue, tu progresses!'}</h1>
      <p className="status-line">{feedback.friendlyFeedback}</p>
      <p>
        Reponse(s) correcte(s): <strong>{feedback.correctKeys.join(', ')}</strong>
      </p>
      <h2>Explication</h2>
      <p>{feedback.explanation}</p>
      <button className="kiosk-button primary" onClick={onContinue} disabled={isLoadingNext}>
        {isLoadingNext ? t('loading') : t('nextQuestion')}
      </button>
    </main>
  );
}
