import { useTranslation } from 'react-i18next';

type Props = {
  onRestart: () => void;
  onAdmin: () => void;
  onHighscore: () => void;
  hidden?: boolean;
  showWelcomeOnlyActions?: boolean;
};

export function UtilityControls({
  onRestart,
  onAdmin,
  onHighscore,
  hidden = false,
  showWelcomeOnlyActions = true
}: Props) {
  const { t } = useTranslation();

  if (hidden) {
    return null;
  }

  return (
    <div className="utility-controls" aria-label="Utility controls">
      <button type="button" className="utility-button" onClick={onRestart}>
        {t('utilityRestart')}
      </button>
      {showWelcomeOnlyActions ? (
        <>
          <button type="button" className="utility-button utility-button-primary" onClick={onHighscore}>
            {t('utilityResults')}
          </button>
          <button type="button" className="utility-button" onClick={onAdmin}>
            {t('utilityAdmin')}
          </button>
        </>
      ) : null}
    </div>
  );
}
