import { Send } from 'lucide-react';

type Props = {
  studentName: string;
  submitted: boolean;
  busy: boolean;
  mode?: 'content' | 'task';
  score?: { correct: number; total: number; percent: number } | null;
  inlineNameInput?: boolean;
  onNameChange: (name: string) => void;
  onSubmit: () => void;
};

export function StudentShareSubmitBar({
  studentName,
  submitted,
  busy,
  mode = 'content',
  score = null,
  inlineNameInput = true,
  onNameChange,
  onSubmit,
}: Props) {
  const idleLabel = mode === 'task' ? 'Odevzdat úkol' : 'Odevzdat';
  return (
    <div className="student-share-submit-bar" aria-label="Odevzdání sdílené nástěnky">
      {inlineNameInput ? (
        <input
          value={studentName}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="Tvoje jméno"
          maxLength={80}
          disabled={submitted || busy}
        />
      ) : (
        <span className="student-share-submit-bar__name">{studentName}</span>
      )}
      <button type="button" disabled={submitted || busy || !studentName.trim()} onClick={onSubmit}>
        <Send size={15} strokeWidth={2.2} aria-hidden />
        {submitted ? 'Odevzdáno' : busy ? 'Odesílám…' : idleLabel}
      </button>
      {inlineNameInput && submitted && mode === 'task' && score ? (
        <span className="student-share-submit-bar__score">
          Skóre {score.correct} / {score.total} ({score.percent} %)
        </span>
      ) : null}
    </div>
  );
}
