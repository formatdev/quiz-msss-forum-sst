import { useMemo, useState } from 'react';

type Props = {
  title: string;
  pinLength: number;
  onSubmit: (pin: string) => void;
  onCancel: () => void;
  error?: string | null;
};

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

export function PinPadDialog({ title, pinLength, onSubmit, onCancel, error = null }: Props) {
  const [pin, setPin] = useState('');

  function appendDigit(digit: string): void {
    setPin((current) => (current.length >= pinLength ? current : `${current}${digit}`));
  }

  function backspace(): void {
    setPin((current) => current.slice(0, -1));
  }

  function clearAll(): void {
    setPin('');
  }

  const maskedPin = useMemo(() => {
    const filled = '●'.repeat(pin.length);
    const empty = '○'.repeat(Math.max(pinLength - pin.length, 0));
    return `${filled}${empty}`;
  }, [pin, pinLength]);

  return (
    <div className="overlay-dialog" role="dialog" aria-modal="true" aria-label={title}>
      <div className="overlay-card">
        <h2>{title}</h2>
        <p className="pin-display">{maskedPin}</p>
        {error ? <p className="status-line error">{error}</p> : null}
        <div className="pinpad-grid">
          {DIGITS.map((digit) => (
            <button key={digit} type="button" className="kiosk-button pinpad-key" onClick={() => appendDigit(digit)}>
              {digit}
            </button>
          ))}
        </div>
        <div className="overlay-actions">
          <button type="button" className="kiosk-button" onClick={clearAll}>
            Clear
          </button>
          <button type="button" className="kiosk-button" onClick={backspace}>
            Back
          </button>
          <button type="button" className="kiosk-button" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="kiosk-button primary"
            onClick={() => onSubmit(pin)}
            disabled={pin.length !== pinLength}
          >
            Enter
          </button>
        </div>
      </div>
    </div>
  );
}
