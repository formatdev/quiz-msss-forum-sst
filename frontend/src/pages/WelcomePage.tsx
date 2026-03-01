import { useTranslation } from 'react-i18next';
import type { LanguageCode } from '../services/api/sessionClient';

const LANGUAGES = [
  { code: 'fr', label: 'Francais' },
  { code: 'de', label: 'Deutsch' },
  { code: 'en', label: 'English' }
] as const;

type Props = {
  selectedLanguage: LanguageCode;
  onLanguageSelect: (lang: LanguageCode) => void;
  onStart: () => void;
};

export function WelcomePage({ selectedLanguage, onLanguageSelect, onStart }: Props) {
  const { t, i18n } = useTranslation();

  return (
    <main className="kiosk-shell">
      <div className="quiz-split">
        <section className="quiz-panel quiz-panel-left welcome-left">
          <h1 className="welcome-title">
            <span>{t('titleLine1')}</span>
            <span>{t('titleLine2')}</span>
          </h1>
          <div className="welcome-controls">
            <div className="welcome-language-grid">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  className="kiosk-button language-button"
                  onClick={() => {
                    void i18n.changeLanguage(lang.code);
                    onLanguageSelect(lang.code);
                  }}
                  aria-pressed={selectedLanguage === lang.code}
                >
                  {lang.label}
                </button>
              ))}
            </div>
            <button className="kiosk-button primary" onClick={onStart}>
              {t('start')}
            </button>
          </div>
        </section>

        <section className="quiz-panel quiz-panel-right welcome-right">
          <div className="visual-slot visual-slot-feedback welcome-visual">
            <img
              className="welcome-mascot"
              src="/media/mascot/mascot-language.png"
              alt="Mascot"
            />
          </div>
        </section>
      </div>
    </main>
  );
}
