type Props = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel
}: Props) {
  return (
    <div className="overlay-dialog" role="dialog" aria-modal="true" aria-label={title}>
      <div className="overlay-card">
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="overlay-actions">
          <button type="button" className="kiosk-button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="kiosk-button primary" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
