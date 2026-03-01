import { useEffect, useState } from 'react';
import type { AdminSettings } from '../features/settings/adminSettings';
import type { AdminInitializeResponse } from '../services/api/sessionClient';

type Props = {
  settings: AdminSettings;
  csvUrl: string;
  onClose: () => void;
  onSave: (settings: AdminSettings) => void;
  onInitialize: () => Promise<AdminInitializeResponse>;
};

export function AdminPage({ settings, csvUrl, onClose, onSave, onInitialize }: Props) {
  const [draft, setDraft] = useState<AdminSettings>(settings);
  const [initializeLoading, setInitializeLoading] = useState(false);
  const [initializeMessage, setInitializeMessage] = useState<string | null>(null);
  const [initializeError, setInitializeError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  async function handleInitialize(): Promise<void> {
    const confirmed = window.confirm(
      'Initialize database?\nTimestamped SQLite and CSV dumps will be created first, then data will be cleared and reseeded.'
    );
    if (!confirmed) {
      return;
    }

    setInitializeLoading(true);
    setInitializeMessage(null);
    setInitializeError(null);
    try {
      const result = await onInitialize();
      setInitializeMessage(
        `Initialized. DB dump: ${result.dumpFile}. CSV dump: ${result.csvDumpFile}. Cleared sessions: ${result.clearedSessions}. Seeded questions: ${result.seededQuestions}.`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Initialization failed.';
      setInitializeError(message);
    } finally {
      setInitializeLoading(false);
    }
  }

  return (
    <div className="overlay-dialog" role="dialog" aria-modal="true" aria-label="Admin">
      <div className="overlay-card admin-card">
        <h2>Admin Settings</h2>
        <div className="admin-grid">
          <label className="admin-field">
            <span>Idle Timeout (seconds)</span>
            <input
              type="number"
              min={15}
              max={600}
              value={draft.idleTimeoutSeconds}
              onChange={(event) =>
                setDraft((current) => ({ ...current, idleTimeoutSeconds: Number(event.target.value || 0) }))
              }
            />
          </label>

          <label className="admin-field">
            <span>Feedback Fading (%)</span>
            <input
              type="number"
              min={0}
              max={100}
              value={draft.feedbackFadeOpacityPercent}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  feedbackFadeOpacityPercent: Number(event.target.value || 0)
                }))
              }
            />
          </label>

          <label className="admin-field admin-toggle">
            <input
              type="checkbox"
              checked={draft.fireworksEnabled}
              onChange={(event) => setDraft((current) => ({ ...current, fireworksEnabled: event.target.checked }))}
            />
            <span>Enable Fireworks</span>
          </label>

          <label className="admin-field">
            <span>Stars Per Correct Answer</span>
            <input
              type="number"
              min={1}
              max={30}
              value={draft.starsPerCorrectAnswer}
              onChange={(event) =>
                setDraft((current) => ({ ...current, starsPerCorrectAnswer: Number(event.target.value || 0) }))
              }
            />
          </label>
        </div>

        <div className="admin-download">
          <a className="kiosk-button" href={csvUrl} download>
            Download CSV
          </a>
        </div>

        <div className="admin-maintenance">
          <button
            type="button"
            className="kiosk-button"
            onClick={() => void handleInitialize()}
            disabled={initializeLoading}
          >
            {initializeLoading ? 'Initializing...' : 'Initialize Database'}
          </button>
          {initializeMessage ? <p className="status-line">{initializeMessage}</p> : null}
          {initializeError ? <p className="status-line error">{initializeError}</p> : null}
        </div>

        <div className="overlay-actions">
          <button type="button" className="kiosk-button" onClick={onClose}>
            Close
          </button>
          <button type="button" className="kiosk-button primary" onClick={() => onSave(draft)}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
