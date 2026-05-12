import { z } from "zod";

export const misconceptionTargetSchema = z.object({
  incorrectText: z
    .string()
    .describe("The exact incorrect span or claim in the statement."),
  correction: z.string().describe("The accurate replacement for the mistake."),
  explanation: z
    .string()
    .describe("Brief explanation of why the generated statement is wrong."),
});

export const misconceptionAttemptFeedbackSchema = z.object({
  attemptNumber: z.number().int().min(1),
  selectedText: z.string(),
  reason: z.string(),
  isCorrect: z.boolean(),
  feedback: z.string().describe("Short feedback shown to the learner."),
});

export const misconceptionDetectiveActivitySchema = z.object({
  eventType: z.literal("activity-init"),
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
    "The hidden answer key for grading learner attempts.",
  ),
});

export const misconceptionDetectivePublicActivitySchema =
  misconceptionDetectiveActivitySchema.omit({
    targetMisconception: true,
  });

export const misconceptionDetectiveAttemptSchema = z.object({
  eventType: z.literal("activity-attempt"),
  type: z.literal("misconception-detective"),
  activityId: z.string(),
  title: z.string(),
  submittedAt: z.string(),
  attemptNumber: z.number().int().min(1),
  selectedText: z.string(),
  selectedTextStart: z.number().int().min(0).nullable(),
  selectedTextEnd: z.number().int().min(0).nullable(),
  reason: z.string(),
});

export const misconceptionDetectiveFeedbackSchema = z.object({
  eventType: z.enum(["activity-update", "activity-end"]),
  type: z.literal("misconception-detective"),
  activityId: z.string(),
  title: z.string(),
  checkedAt: z.string(),
  attemptNumber: z.number().int().min(1),
  selectedText: z.string(),
  reason: z.string(),
  isCorrect: z.boolean(),
  feedback: z.string(),
});

export type MisconceptionTarget = z.infer<typeof misconceptionTargetSchema>;
export type MisconceptionAttemptFeedback = z.infer<
  typeof misconceptionAttemptFeedbackSchema
>;
export type MisconceptionDetectiveActivity = z.infer<
  typeof misconceptionDetectiveActivitySchema
>;
export type MisconceptionDetectivePublicActivity = z.infer<
  typeof misconceptionDetectivePublicActivitySchema
>;
export type MisconceptionDetectiveAttempt = z.infer<
  typeof misconceptionDetectiveAttemptSchema
>;
export type MisconceptionDetectiveFeedback = z.infer<
  typeof misconceptionDetectiveFeedbackSchema
>;
