import type { CSSProperties } from 'react';

type Props = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  idleRemainingMs: number;
  idleTimeoutMs: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function TimedContinueButton({
  label,
  onClick,
  disabled = false,
  className = '',
  idleRemainingMs,
  idleTimeoutMs
}: Props) {
  const safeTimeout = Math.max(idleTimeoutMs, 1);
  const remaining = clamp(idleRemainingMs, 0, safeTimeout);
  const progress = remaining / safeTimeout;
  const secondsLeft = Math.ceil(remaining / 1000);
  const shouldBlink = remaining <= 10_000;
  const timerStyle = {
    '--pacman-angle': `${Math.round(progress * 360)}deg`,
    '--pacman-progress': progress.toFixed(3)
  } as CSSProperties;

  return (
    <button
      className={`kiosk-button primary timed-continue ${shouldBlink ? 'urgent-blink' : ''} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="timed-continue-label">{label}</span>
      <span className="pacman-timer" style={timerStyle} aria-label={`Idle timeout: ${secondsLeft}s`}>
        <span className="pacman-ring">
          <span className="pacman-face" />
        </span>
        <span className="pacman-seconds">{secondsLeft}</span>
      </span>
    </button>
  );
}
