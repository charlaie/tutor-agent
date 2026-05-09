"use client";

import { type FormEvent, useRef, useState } from "react";

export type MisconceptionTarget = {
  incorrectText: string;
  correction: string;
  explanation: string;
};

export type MisconceptionAttemptFeedback = {
  attemptNumber: number;
  selectedText: string;
  reason: string;
  isCorrect: boolean;
  feedback: string;
};

export type MisconceptionDetectiveActivity = {
  eventType: "activity-init" | "activity-update";
  type: "misconception-detective";
  activityId: string;
  title: string;
  instructions?: string;
  statement: string;
  targetMisconception: MisconceptionTarget;
  attemptNumber?: number;
  priorAttempts?: MisconceptionAttemptFeedback[];
};

export type MisconceptionDetectiveAttempt = {
  eventType: "activity-attempt";
  type: "misconception-detective";
  activityId: string;
  title: string;
  submittedAt: string;
  attemptNumber: number;
  selectedText: string;
  selectedTextStart: number | null;
  selectedTextEnd: number | null;
  reason: string;
};

type InteractiveMisconceptionDetectiveProps = {
  activity: MisconceptionDetectiveActivity;
  onSubmitAttempt: (attempt: MisconceptionDetectiveAttempt) => void;
};

function getSelectionWithinElement(element: HTMLElement, fullText: string) {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);

  if (
    selection.isCollapsed ||
    !element.contains(range.commonAncestorContainer)
  ) {
    return null;
  }

  const selectedText = selection.toString().trim();

  if (!selectedText) {
    return null;
  }

  const selectedTextStart = fullText.indexOf(selectedText);

  return {
    selectedText,
    selectedTextStart: selectedTextStart === -1 ? null : selectedTextStart,
    selectedTextEnd:
      selectedTextStart === -1 ? null : selectedTextStart + selectedText.length,
  };
}

export function InteractiveMisconceptionDetective({
  activity,
  onSubmitAttempt,
}: InteractiveMisconceptionDetectiveProps) {
  const statementRef = useRef<HTMLParagraphElement>(null);
  const [selectedText, setSelectedText] = useState("");
  const [selectedTextStart, setSelectedTextStart] = useState<number | null>(null);
  const [selectedTextEnd, setSelectedTextEnd] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const attemptNumber = activity.attemptNumber ?? 1;
  const canSubmit = selectedText.trim().length > 0 && reason.trim().length > 0;

  const captureSelection = () => {
    if (!statementRef.current || hasSubmitted) {
      return;
    }

    const selection = getSelectionWithinElement(
      statementRef.current,
      activity.statement,
    );

    if (!selection) {
      return;
    }

    setSelectedText(selection.selectedText);
    setSelectedTextStart(selection.selectedTextStart);
    setSelectedTextEnd(selection.selectedTextEnd);
  };

  const submitAttempt = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit || hasSubmitted) {
      return;
    }

    const attempt: MisconceptionDetectiveAttempt = {
      eventType: "activity-attempt",
      type: "misconception-detective",
      activityId: activity.activityId,
      title: activity.title,
      submittedAt: new Date().toISOString(),
      attemptNumber,
      selectedText: selectedText.trim(),
      selectedTextStart,
      selectedTextEnd,
      reason: reason.trim(),
    };

    setHasSubmitted(true);
    onSubmitAttempt(attempt);
  };

  return (
    <form
      onSubmit={submitAttempt}
      className="my-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
    >
      <div className="mb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Misconception Detective
          </div>
          <div className="text-xs font-medium text-zinc-500">
            Attempt {attemptNumber}
          </div>
        </div>
        <h2 className="mt-1 text-lg font-semibold text-zinc-950">
          {activity.title}
        </h2>
        {activity.instructions ? (
          <p className="mt-1 text-sm text-zinc-600">{activity.instructions}</p>
        ) : null}
      </div>

      {activity.priorAttempts && activity.priorAttempts.length > 0 ? (
        <div className="mb-4 space-y-2">
          {activity.priorAttempts.map((attempt) => (
            <div
              key={attempt.attemptNumber}
              className={[
                "rounded-md border p-3 text-sm",
                attempt.isCorrect
                  ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                  : "border-amber-200 bg-amber-50 text-amber-950",
              ].join(" ")}
            >
              <div className="font-medium">
                Attempt {attempt.attemptNumber}:{" "}
                {attempt.isCorrect ? "Correct" : "Try again"}
              </div>
              <p className="mt-1">{attempt.feedback}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
        <p
          ref={statementRef}
          onMouseUp={captureSelection}
          className="select-text text-sm leading-6 text-zinc-900"
        >
          {activity.statement}
        </p>
      </div>

      <div className="mt-4 rounded-md border border-zinc-200 p-3">
        <div className="block text-sm font-medium text-zinc-950">
          Highlighted text
        </div>
        <div className="mt-2 min-h-10 rounded-md bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
          {selectedText ||
            "Select the part of the statement that contains the mistake."}
        </div>
      </div>

      <label className="mt-4 block text-sm font-medium text-zinc-950">
        What is wrong with it?
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          disabled={hasSubmitted}
          rows={4}
          className="mt-2 block w-full rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 disabled:bg-zinc-50 disabled:text-zinc-500"
          placeholder="Explain the mistake and, if you can, the correct version."
        />
      </label>

      {hasSubmitted ? (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-950">
          Attempt submitted. The tutor will check it next.
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-sm text-zinc-600">
          Select text in the statement, then explain the issue.
        </div>
        <button
          type="submit"
          disabled={!canSubmit || hasSubmitted}
          className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          Submit finding
        </button>
      </div>
    </form>
  );
}
