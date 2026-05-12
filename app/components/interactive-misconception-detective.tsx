"use client";

import { type FormEvent, useRef, useState } from "react";
import type {
  MisconceptionDetectiveAttempt,
  MisconceptionDetectiveFeedback,
  MisconceptionDetectivePublicActivity,
} from "../lib/misconception-detective";

type InteractiveMisconceptionDetectiveProps = {
  activity: MisconceptionDetectivePublicActivity;
  onComplete: (result: MisconceptionDetectiveFeedback) => void;
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
  onComplete,
}: InteractiveMisconceptionDetectiveProps) {
  const statementRef = useRef<HTMLParagraphElement>(null);
  const [selectedText, setSelectedText] = useState("");
  const [selectedTextStart, setSelectedTextStart] = useState<number | null>(
    null,
  );
  const [selectedTextEnd, setSelectedTextEnd] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [feedbacks, setFeedbacks] = useState<MisconceptionDetectiveFeedback[]>(
    [],
  );
  const [result, setResult] = useState<MisconceptionDetectiveFeedback | null>(
    null,
  );
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const attemptNumber = feedbacks.length + 1;
  const canSubmit =
    selectedText.trim().length > 0 &&
    reason.trim().length > 0 &&
    !isChecking &&
    !result;

  const captureSelection = () => {
    if (!statementRef.current || result) {
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

  const submitAttempt = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) {
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

    setIsChecking(true);
    setError(null);

    try {
      const response = await fetch("/api/activity-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attempt),
      });

      if (!response.ok) {
        throw new Error("The tutor could not check this attempt.");
      }

      const feedback =
        (await response.json()) as MisconceptionDetectiveFeedback;

      setFeedbacks((current) => [...current, feedback]);

      if (feedback.isCorrect) {
        setResult(feedback);
        onComplete(feedback);
        return;
      }

      setSelectedText("");
      setSelectedTextStart(null);
      setSelectedTextEnd(null);
      setReason("");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The tutor could not check this attempt.",
      );
    } finally {
      setIsChecking(false);
    }
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

      {feedbacks.length > 0 ? (
        <div className="mb-4 space-y-2">
          {feedbacks.map((attempt) => (
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
          disabled={isChecking || Boolean(result)}
          rows={4}
          className="mt-2 block w-full rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 disabled:bg-zinc-50 disabled:text-zinc-500"
          placeholder="Explain the mistake and, if you can, the correct version."
        />
      </label>

      {error ? (
        <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-950">
          {error}
        </div>
      ) : null}

      {isChecking ? (
        <div className="mt-4 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm font-medium text-zinc-700">
          Checking your finding...
        </div>
      ) : null}

      {result ? (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-950">
          Activity complete.
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-sm text-zinc-600">
          Select text in the statement, then explain the issue.
        </div>
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {isChecking ? "Checking..." : "Submit finding"}
        </button>
      </div>
    </form>
  );
}
