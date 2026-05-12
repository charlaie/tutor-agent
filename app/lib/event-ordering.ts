import { z } from "zod";

export const eventOrderingItemSchema = z.object({
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

export const eventOrderingActivityInitSchema = z.object({
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

export type EventOrderingActivityInit = z.infer<
  typeof eventOrderingActivityInitSchema
>;
