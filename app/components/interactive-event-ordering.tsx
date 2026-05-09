"use client";

import { type DragEvent, useMemo, useState } from "react";

export type EventOrderingItem = {
  id: string;
  title: string;
  description?: string;
  correctPosition: number;
};

export type EventOrderingActivityInit = {
  eventType: "activity-init";
  type: "event-ordering";
  activityId: string;
  title: string;
  instructions?: string;
  events: EventOrderingItem[];
};

export type EventOrderingAttemptItem = {
  itemId: string;
  title: string;
  attemptedPosition: number;
  correctPosition: number;
  isCorrectPosition: boolean;
};

export type EventOrderingAttempt = {
  attemptNumber: number;
  checkedAt: string;
  attemptedOrder: EventOrderingAttemptItem[];
  misplacedCount: number;
};

export type EventOrderingActivityEnd = {
  eventType: "activity-end";
  type: "event-ordering";
  activityId: string;
  title: string;
  completedAt: string;
  totalEvents: number;
  attempts: number;
  finalOrder: EventOrderingAttemptItem[];
  incorrectOrderings: EventOrderingAttempt[];
};

type InteractiveEventOrderingProps = {
  activity: EventOrderingActivityInit;
  onComplete: (result: EventOrderingActivityEnd) => void;
};

function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  const next = [...items];
  const [movedItem] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, movedItem);
  return next;
}

export function InteractiveEventOrdering({
  activity,
  onComplete,
}: InteractiveEventOrderingProps) {
  const [orderedEvents, setOrderedEvents] = useState(activity.events);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [previewEvents, setPreviewEvents] = useState<EventOrderingItem[] | null>(
    null,
  );
  const [incorrectOrderings, setIncorrectOrderings] = useState<
    EventOrderingAttempt[]
  >([]);
  const [lastAttempt, setLastAttempt] = useState<EventOrderingAttempt | null>(
    null,
  );
  const [isCorrect, setIsCorrect] = useState(false);
  const [result, setResult] = useState<EventOrderingActivityEnd | null>(null);

  const totalEvents = activity.events.length;
  const correctOrder = useMemo(
    () => [...activity.events].sort((a, b) => a.correctPosition - b.correctPosition),
    [activity.events],
  );
  const visibleEvents = previewEvents ?? orderedEvents;

  const buildAttempt = (attemptNumber: number): EventOrderingAttempt => {
    const attemptedOrder = orderedEvents.map((event, index) => ({
      itemId: event.id,
      title: event.title,
      attemptedPosition: index + 1,
      correctPosition: event.correctPosition,
      isCorrectPosition: event.correctPosition === index + 1,
    }));

    return {
      attemptNumber,
      checkedAt: new Date().toISOString(),
      attemptedOrder,
      misplacedCount: attemptedOrder.filter((item) => !item.isCorrectPosition)
        .length,
    };
  };

  const reorderById = (sourceId: string, targetId: string) => {
    if (sourceId === targetId || result) {
      return;
    }

    setOrderedEvents((current) => {
      const sourceIndex = current.findIndex((event) => event.id === sourceId);
      const targetIndex = current.findIndex((event) => event.id === targetId);

      if (sourceIndex === -1 || targetIndex === -1) {
        return current;
      }

      return moveItem(current, sourceIndex, targetIndex);
    });
    setLastAttempt(null);
    setIsCorrect(false);
  };

  const previewReorder = (
    sourceId: string,
    targetId: string,
    targetPosition: "before" | "after",
  ) => {
    if (sourceId === targetId || result) {
      return;
    }

    setPreviewEvents((currentPreview) => {
      const current = currentPreview ?? orderedEvents;
      const sourceIndex = current.findIndex((event) => event.id === sourceId);
      const targetIndex = current.findIndex((event) => event.id === targetId);

      if (sourceIndex === -1 || targetIndex === -1) {
        return current;
      }

      const insertionIndex =
        targetPosition === "before" ? targetIndex : targetIndex + 1;
      const adjustedIndex =
        sourceIndex < insertionIndex ? insertionIndex - 1 : insertionIndex;

      if (sourceIndex === adjustedIndex) {
        return current;
      }

      return moveItem(current, sourceIndex, adjustedIndex);
    });
  };

  const moveByButton = (eventId: string, direction: -1 | 1) => {
    if (result) {
      return;
    }

    setOrderedEvents((current) => {
      const currentIndex = current.findIndex((event) => event.id === eventId);
      const nextIndex = currentIndex + direction;

      if (
        currentIndex === -1 ||
        nextIndex < 0 ||
        nextIndex >= current.length
      ) {
        return current;
      }

      return moveItem(current, currentIndex, nextIndex);
    });
    setLastAttempt(null);
    setIsCorrect(false);
  };

  const handleDrop = (
    event: DragEvent<HTMLLIElement>,
    targetEventId: string,
  ) => {
    event.preventDefault();
    const sourceId = event.dataTransfer.getData("text/plain") || draggedId;

    if (sourceId && previewEvents) {
      setOrderedEvents(previewEvents);
      setLastAttempt(null);
      setIsCorrect(false);
    } else if (sourceId) {
      reorderById(sourceId, targetEventId);
    }

    setDraggedId(null);
    setPreviewEvents(null);
  };

  const checkOrder = () => {
    if (result) {
      return;
    }

    const attempt = buildAttempt(incorrectOrderings.length + 1);
    setLastAttempt(attempt);

    if (attempt.misplacedCount === 0) {
      setIsCorrect(true);
      return;
    }

    setIncorrectOrderings((current) => [...current, attempt]);
    setIsCorrect(false);
  };

  const finishActivity = () => {
    if (!isCorrect || result) {
      return;
    }

    const finalAttempt = buildAttempt(incorrectOrderings.length + 1);
    const completedActivity: EventOrderingActivityEnd = {
      eventType: "activity-end",
      type: "event-ordering",
      activityId: activity.activityId,
      title: activity.title,
      completedAt: new Date().toISOString(),
      totalEvents,
      attempts: incorrectOrderings.length + 1,
      finalOrder: finalAttempt.attemptedOrder,
      incorrectOrderings,
    };

    setResult(completedActivity);
    onComplete(completedActivity);
  };

  if (totalEvents === 0) {
    return (
      <div className="my-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        This ordering activity does not contain any events.
      </div>
    );
  }

  return (
    <div className="my-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Event Ordering
          </div>
          <div className="text-xs font-medium text-zinc-500">
            {incorrectOrderings.length} incorrect checks
          </div>
        </div>
        <h2 className="mt-1 text-lg font-semibold text-zinc-950">
          {activity.title}
        </h2>
        {activity.instructions ? (
          <p className="mt-1 text-sm text-zinc-600">{activity.instructions}</p>
        ) : null}
      </div>

      <ol className="space-y-2">
        {visibleEvents.map((event, index) => {
          const lastAttemptItem = lastAttempt?.attemptedOrder.find(
            (item) => item.itemId === event.id,
          );
          const showCorrect = lastAttemptItem?.isCorrectPosition;
          const showIncorrect = lastAttemptItem?.isCorrectPosition === false;

          return (
            <li
              key={event.id}
              draggable={!result}
              onDragStart={(dragEvent) => {
                setDraggedId(event.id);
                setPreviewEvents(orderedEvents);
                dragEvent.dataTransfer.setData("text/plain", event.id);
                dragEvent.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(dragEvent) => {
                dragEvent.preventDefault();

                const activeDraggedId =
                  draggedId || dragEvent.dataTransfer.getData("text/plain");

                if (!activeDraggedId) {
                  return;
                }

                const rect = dragEvent.currentTarget.getBoundingClientRect();
                const targetPosition =
                  dragEvent.clientY < rect.top + rect.height / 2
                    ? "before"
                    : "after";

                previewReorder(activeDraggedId, event.id, targetPosition);
              }}
              onDrop={(dropEvent) => handleDrop(dropEvent, event.id)}
              onDragEnd={() => {
                setDraggedId(null);
                setPreviewEvents(null);
              }}
              className={[
                "flex items-start gap-3 rounded-md border p-3 text-sm transition-all",
                draggedId === event.id
                  ? "scale-[0.99] border-zinc-400 bg-zinc-50 shadow-sm"
                  : "opacity-100",
                showCorrect
                  ? "border-emerald-300 bg-emerald-50 text-emerald-950"
                  : showIncorrect
                    ? "border-rose-300 bg-rose-50 text-rose-950"
                    : "border-zinc-200 bg-white text-zinc-800",
                draggedId === event.id ? "shadow-sm ring-2 ring-zinc-300" : "",
              ].join(" ")}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-xs font-semibold text-zinc-600">
                {index + 1}
              </div>

              <div className="min-w-0 flex-1">
                <div className="font-medium text-zinc-950">{event.title}</div>
                {event.description ? (
                  <div className="mt-1 text-zinc-600">{event.description}</div>
                ) : null}
                {showIncorrect ? (
                  <div className="mt-2 text-xs font-medium">
                    Correct position: {event.correctPosition}
                  </div>
                ) : null}
              </div>

              <div className="flex shrink-0 flex-col gap-1">
                <button
                  type="button"
                  onClick={() => moveByButton(event.id, -1)}
                  disabled={index === 0 || Boolean(result)}
                  className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Up
                </button>
                <button
                  type="button"
                  onClick={() => moveByButton(event.id, 1)}
                  disabled={index === visibleEvents.length - 1 || Boolean(result)}
                  className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Down
                </button>
              </div>
            </li>
          );
        })}
      </ol>

      {lastAttempt ? (
        <div
          className={[
            "mt-4 rounded-md border p-3 text-sm",
            isCorrect
              ? "border-emerald-200 bg-emerald-50 text-emerald-950"
              : "border-rose-200 bg-rose-50 text-rose-950",
          ].join(" ")}
        >
          {isCorrect
            ? "Correct order. Click Finish to send the result."
            : `${lastAttempt.misplacedCount} event${lastAttempt.misplacedCount === 1 ? "" : "s"} out of place. Reorder and check again.`}
        </div>
      ) : null}

      {result ? (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-950">
          Activity submitted.
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-sm text-zinc-600">
          Correct order has {correctOrder.length} events
        </div>

        {isCorrect ? (
          <button
            type="button"
            onClick={finishActivity}
            disabled={Boolean(result)}
            className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-300"
          >
            Finish
          </button>
        ) : (
          <button
            type="button"
            onClick={checkOrder}
            disabled={Boolean(result)}
            className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-300"
          >
            Check order
          </button>
        )}
      </div>
    </div>
  );
}
