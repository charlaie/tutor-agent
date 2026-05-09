"use client";

import { useHumanInTheLoop } from "@copilotkit/react-core/v2";
import { z } from "zod";
import {
  InteractiveMisconceptionDetective,
  type MisconceptionDetectiveAttempt,
} from "./interactive-misconception-detective";

const misconceptionTargetSchema = z.object({
  incorrectText: z
    .string()
    .describe("The exact incorrect span or claim in the statement."),
  correction: z.string().describe("The accurate replacement for the mistake."),
  explanation: z
    .string()
    .describe("Brief explanation of why the generated statement is wrong."),
});

const misconceptionAttemptFeedbackSchema = z.object({
  attemptNumber: z.number().int().min(1),
  selectedText: z.string(),
  reason: z.string(),
  isCorrect: z.boolean(),
  feedback: z.string().describe("Short feedback shown to the learner."),
});

const misconceptionDetectiveActivitySchema = z.object({
  eventType: z
    .enum(["activity-init", "activity-update"])
    .describe(
      "Use activity-init for the first detective card and activity-update when showing feedback and another attempt.",
    ),
  type: z.literal("misconception-detective"),
  activityId: z
    .string()
    .describe("Unique id for this activity, such as 'detective-photosynthesis-1'."),
  title: z.string().describe("Short activity title."),
  instructions: z
    .string()
    .optional()
    .describe("One sentence telling the learner to find the incorrect claim."),
  statement: z
    .string()
    .describe(
      "A short topic statement containing exactly one important factual mistake.",
    ),
  targetMisconception: misconceptionTargetSchema.describe(
    "The hidden answer key for the agent to grade learner attempts.",
  ),
  attemptNumber: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe("The next learner attempt number. Defaults to 1."),
  priorAttempts: z
    .array(misconceptionAttemptFeedbackSchema)
    .optional()
    .describe("Prior attempt feedback to display before the retry."),
});

type MisconceptionDetectiveActivity = z.infer<
  typeof misconceptionDetectiveActivitySchema
>;

type MisconceptionDetectiveToolProps = {
  args: Partial<MisconceptionDetectiveActivity>;
  status: "inProgress" | "executing" | "complete";
  result: string | undefined;
  respond?: (result: unknown) => Promise<void>;
};

function MisconceptionDetectiveToolRenderer({
  args,
  status,
  result,
  respond,
}: MisconceptionDetectiveToolProps) {
  if (status === "inProgress") {
    return (
      <div className="my-3 rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-600 shadow-sm">
        Building misconception detective...
      </div>
    );
  }

  if (status === "complete") {
    return (
      <div className="my-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
        Detective attempt submitted.
        {result ? (
          <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-white/70 p-2 text-xs text-emerald-950">
            {result}
          </pre>
        ) : null}
      </div>
    );
  }

  const parsedActivity = misconceptionDetectiveActivitySchema.safeParse(args);

  if (!parsedActivity.success) {
    return (
      <div className="my-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        The misconception detective activity was not generated in the expected
        format.
      </div>
    );
  }

  return (
    <InteractiveMisconceptionDetective
      activity={parsedActivity.data}
      onSubmitAttempt={(attempt: MisconceptionDetectiveAttempt) => {
        void respond?.(JSON.stringify(attempt));
      }}
    />
  );
}

export function MisconceptionDetectiveTool() {
  useHumanInTheLoop<MisconceptionDetectiveActivity>({
    name: "show_misconception_detective",
    description:
      "Show an interactive misconception detective activity where the learner highlights the incorrect part of a statement and explains what is wrong.",
    parameters: misconceptionDetectiveActivitySchema,
    followUp: true,
    render: MisconceptionDetectiveToolRenderer,
  });

  return null;
}
