import { useState } from "react";

/** Start over with a new egg. Asks first, and can keep what the brain learned about you. */
export function ResetPanel({ petName, onReset, onCancel }: { petName: string; onReset: (keepBrain: boolean) => void; onCancel: () => void }) {
  const [keepBrain, setKeepBrain] = useState(false);
  return (
    <div className="card reset-confirm" role="alertdialog" aria-label="Start over">
      <h3>Say goodbye to {petName}?</h3>
      <p className="muted">You'll go back to picking a shell and an egg. Your username stays.</p>
      <label className="toggle">
        <input type="checkbox" checked={keepBrain} onChange={(e) => setKeepBrain(e.target.checked)} />
        <span>Keep what it learned about my habits and routine</span>
      </label>
      <div className="row-gap">
        <button type="button" className="btn btn-primary" onClick={() => onReset(keepBrain)}>
          Start over
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Keep {petName}
        </button>
      </div>
    </div>
  );
}
