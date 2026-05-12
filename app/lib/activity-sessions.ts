import { randomUUID } from "node:crypto";
import { resolveModel } from "@copilotkit/runtime/v2";
import { generateObject } from "ai";
import { z } from "zod";
import {
  type MisconceptionDetectiveActivity,
  type MisconceptionDetectiveAttempt,
  type MisconceptionDetectiveFeedback,
  type MisconceptionDetectivePublicActivity,
  misconceptionDetectiveActivitySchema,
  misconceptionDetectiveFeedbackSchema,
} from "./misconception-detective";

type MisconceptionSession = {
  type: "misconception-detective";
  activity: MisconceptionDetectiveActivity;
  attempts: MisconceptionDetectiveFeedback[];
  completed: boolean;
  createdAt: string;
};

const generatedMisconceptionSchema = z.object({
  title: z.string().describe("Short activity title."),
  instructions: z
    .string()
    .describe("One sentence telling the learner to find the incorrect claim."),
  statement: z
    .string()
    .describe(
      "A short topic statement containing exactly one important factual mistake.",
    ),
  targetMisconception: z.object({
    incorrectText: z
      .string()
      .describe("The exact incorrect span or claim in the statement."),
    correction: z
      .string()
      .describe("The accurate replacement for the mistake."),
    explanation: z
      .string()
      .describe("Brief explanation of why the generated statement is wrong."),
  }),
});

const gradeResultSchema = z.object({
  isCorrect: z
    .boolean()
    .describe(
      "True only when the selected text covers the incorrect claim and the reason explains the mistake.",
    ),
  feedback: z
    .string()
    .describe(
      "Concise learner-facing feedback. If incorrect, give a hint without revealing the exact answer.",
    ),
});

const globalForActivitySessions = globalThis as typeof globalThis & {
  __copilotTutorActivitySessions?: Map<string, MisconceptionSession>;
};

const activitySessions =
  globalForActivitySessions.__copilotTutorActivitySessions ??
  new Map<string, MisconceptionSession>();

globalForActivitySessions.__copilotTutorActivitySessions = activitySessions;

function toPublicActivity(
  activity: MisconceptionDetectiveActivity,
): MisconceptionDetectivePublicActivity {
  return {
    eventType: activity.eventType,
    type: activity.type,
    activityId: activity.activityId,
    title: activity.title,
    instructions: activity.instructions,
    statement: activity.statement,
  };
}

function createActivityId(topic: string) {
  const slug = topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);

  return `detective-${slug || "topic"}-${randomUUID().slice(0, 8)}`;
}

export async function createMisconceptionDetectiveSession({
  topic,
}: {
  topic: string;
}): Promise<MisconceptionDetectivePublicActivity> {
  const { object } = await generateObject({
    model: resolveModel("google:gemini-2.5-flash"),
    schema: generatedMisconceptionSchema,
    temperature: 0.4,
    system: `You create misconception detective activities for a tutor app.

The learner sees a short statement with exactly one important factual mistake.
The learner must highlight the wrong part and explain why it is wrong.

Do not make the mistake a typo, wording nit, or vague claim. The targetMisconception must be sufficient for server-side grading, but it will never be shown to the learner.`,
    prompt: JSON.stringify({ topic }),
  });

  const activity = misconceptionDetectiveActivitySchema.parse({
    eventType: "activity-init",
    type: "misconception-detective",
    activityId: createActivityId(topic),
    title: object.title,
    instructions: object.instructions,
    statement: object.statement,
    targetMisconception: object.targetMisconception,
  });

  activitySessions.set(activity.activityId, {
    type: "misconception-detective",
    activity,
    attempts: [],
    completed: false,
    createdAt: new Date().toISOString(),
  });

  return toPublicActivity(activity);
}

export async function gradeMisconceptionDetectiveAttempt(
  attempt: MisconceptionDetectiveAttempt,
): Promise<MisconceptionDetectiveFeedback> {
  const session = activitySessions.get(attempt.activityId);

  if (!session) {
    throw new Error("Activity session not found.");
  }

  if (session.completed) {
    const lastAttempt = session.attempts.at(-1);

    if (lastAttempt) {
      return lastAttempt;
    }
  }

  const { activity } = session;
  const { object } = await generateObject({
    model: resolveModel("google:gemini-2.5-flash"),
    schema: gradeResultSchema,
    temperature: 0,
    system: `You grade a misconception detective activity.

The learner sees a statement with exactly one factual mistake and submits highlighted text plus an explanation.

Mark isCorrect true only when:
- The selected text covers the incorrect claim or its essential wrong term.
- The reason explains why it is wrong or gives the right correction.

If the learner is incorrect, give a brief hint about what to reconsider without revealing the exact incorrect span or full correction.
If the learner is correct, explain why in 1-3 sentences.`,
    prompt: JSON.stringify({
      statement: activity.statement,
      targetMisconception: activity.targetMisconception,
      learnerAttempt: {
        selectedText: attempt.selectedText,
        reason: attempt.reason,
      },
    }),
  });

  const feedback = misconceptionDetectiveFeedbackSchema.parse({
    eventType: object.isCorrect ? "activity-end" : "activity-update",
    type: "misconception-detective",
    activityId: activity.activityId,
    title: activity.title,
    checkedAt: new Date().toISOString(),
    attemptNumber: session.attempts.length + 1,
    selectedText: attempt.selectedText,
    reason: attempt.reason,
    isCorrect: object.isCorrect,
    feedback: object.feedback,
  });

  session.attempts.push(feedback);
  session.completed = feedback.isCorrect;

  return feedback;
}
