import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TimedContinueButton } from '../components/TimedContinueButton';

type Props = {
  onContinue: (nickname?: string) => void;
  idleRemainingMs: number;
  idleTimeoutMs: number;
};

export function NicknamePage({ onContinue, idleRemainingMs, idleTimeoutMs }: Props) {
  const { t } = useTranslation();
  const [nickname, setNickname] = useState('');
  const letterKeys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const numberKeys = '0123456789'.split('');

  function appendKey(key: string): void {
    setNickname((current) => (current.length >= 32 ? current : `${current}${key}`));
  }

  function backspace(): void {
    setNickname((current) => current.slice(0, -1));
  }

  function clearAll(): void {
    setNickname('');
  }

  return (
    <main className="kiosk-shell">
      <div className="quiz-split">
        <section className="quiz-panel quiz-panel-left nickname-left">
          <h1>{t('nicknameTitle')}</h1>
          <div className="nickname-controls">
            <input
              className="nickname-input"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={32}
              placeholder={t('nicknamePlaceholder')}
            />

            <div className="nickname-keypad">
              {letterKeys.map((key) => (
                <button
                  key={key}
                  type="button"
                  className="kiosk-button nickname-key"
                  onClick={() => appendKey(key)}
                >
                  {key}
                </button>
              ))}
              {numberKeys.map((key) => (
                <button
                  key={key}
                  type="button"
                  className="kiosk-button nickname-key"
                  onClick={() => appendKey(key)}
                >
                  {key}
                </button>
              ))}
              <button
                type="button"
                className="kiosk-button nickname-key action"
                onClick={() => appendKey(' ')}
              >
                {t('nicknameSpace')}
              </button>
              <button
                type="button"
                className="kiosk-button nickname-key"
                onClick={() => appendKey('-')}
              >
                -
              </button>
              <button type="button" className="kiosk-button nickname-key action" onClick={backspace}>
                {t('nicknameBackspace')}
              </button>
              <button type="button" className="kiosk-button nickname-key action" onClick={clearAll}>
                {t('nicknameClear')}
              </button>
            </div>

            <TimedContinueButton
              className="nickname-continue"
              label={t('continue')}
              onClick={() => onContinue(nickname.trim() || undefined)}
              idleRemainingMs={idleRemainingMs}
              idleTimeoutMs={idleTimeoutMs}
            />
          </div>
        </section>

        <section className="quiz-panel quiz-panel-right nickname-right">
          <div className="visual-slot visual-slot-feedback welcome-visual">
            <img className="welcome-mascot" src="/media/mascot/mascot-nickname.png" alt="Mascot" />
          </div>
        </section>
      </div>
    </main>
  );
}
