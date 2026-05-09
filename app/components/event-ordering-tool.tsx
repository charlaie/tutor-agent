"use client";

import { useHumanInTheLoop } from "@copilotkit/react-core/v2";
import { z } from "zod";
import {
  InteractiveEventOrdering,
  type EventOrderingActivityEnd,
} from "./interactive-event-ordering";

const eventOrderingItemSchema = z.object({
  id: z.string().describe("Stable event id, for example 'event-1'."),
  title: z.string().describe("Short event label shown to the learner."),
  description: z
    .string()
    .optional()
    .describe("Optional one-sentence detail for the event."),
  correctPosition: z
    .number()
    .int()
    .min(1)
    .describe("The correct 1-based position for this event."),
});

const eventOrderingActivityInitSchema = z.object({
  eventType: z.literal("activity-init"),
  type: z.literal("event-ordering"),
  activityId: z
    .string()
    .describe("Unique id for this activity, such as 'ordering-ww2-1'."),
  title: z.string().describe("Short activity title."),
  instructions: z
    .string()
    .optional()
    .describe("One sentence telling the learner to order the events."),
  events: z
    .array(eventOrderingItemSchema)
    .min(3)
    .max(8)
    .describe(
      "Events to display initially out of order. Each event has the correct position.",
    ),
});

type EventOrderingActivityInit = z.infer<
  typeof eventOrderingActivityInitSchema
>;

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

  const parsedActivity = eventOrderingActivityInitSchema.safeParse(args);

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
