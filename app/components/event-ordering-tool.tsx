"use client";

import { useHumanInTheLoop } from "@copilotkit/react-core/v2";
import { normalizeEventOrderingArgs } from "../lib/activity-normalize";
import {
  type EventOrderingActivityInit,
  eventOrderingActivityInitSchema,
} from "../lib/event-ordering";
import {
  type EventOrderingActivityEnd,
  InteractiveEventOrdering,
} from "./interactive-event-ordering";

type EventOrderingToolProps = {
  args: Partial<EventOrderingActivityInit>;
  status: "inProgress" | "executing" | "complete";
  result: string | undefined;
  respond?: (result: unknown) => Promise<void>;
};

function EventOrderingToolRenderer({
  args,
  status,
  result,
  respond,
}: EventOrderingToolProps) {
  if (status === "inProgress") {
    return (
      <div className="my-3 rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-600 shadow-sm">
        Building ordering activity...
      </div>
    );
  }

  if (status === "complete") {
    return (
      <div className="my-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
        Ordering activity submitted.
        {result ? (
          <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-white/70 p-2 text-xs text-emerald-950">
            {result}
          </pre>
        ) : null}
      </div>
    );
  }

  const parsedActivity = eventOrderingActivityInitSchema.safeParse(
    normalizeEventOrderingArgs(args),
  );

  if (!parsedActivity.success) {
    return (
      <div className="my-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        The ordering activity was not generated in the expected format.
      </div>
    );
  }

  return (
    <InteractiveEventOrdering
      activity={parsedActivity.data}
      onComplete={(activityEnd: EventOrderingActivityEnd) => {
        void respond?.(JSON.stringify(activityEnd));
      }}
    />
  );
}

export function EventOrderingTool() {
  useHumanInTheLoop<EventOrderingActivityInit>({
    name: "start_event_ordering",
    description:
      "Start an interactive event ordering activity. Use this when the learner needs to practice chronology, process steps, sequences, timelines, or cause-and-effect order.",
    parameters: eventOrderingActivityInitSchema,
    followUp: true,
    render: EventOrderingToolRenderer,
  });

  return null;
}
