import { z } from "zod";

export const quizChoiceSchema = z.object({
  id: z.string().describe("Stable choice id, for example 'a', 'b', 'c', 'd'."),
  text: z.string().describe("The answer choice shown to the learner."),
  isCorrect: z.boolean().describe("Whether this choice is the correct answer."),
});

export const quizQuestionSchema = z.object({
  id: z.string().describe("Stable question id, for example 'q1'."),
  prompt: z.string().describe("The question prompt shown to the learner."),
  choices: z
    .array(quizChoiceSchema)
    .min(2)
    .max(5)
    .describe("Multiple-choice answers. Exactly one should be correct."),
  explanation: z
    .string()
    .optional()
    .describe("Brief explanation shown after the learner submits."),
});

export const quizActivityInitSchema = z.object({
  eventType: z.literal("activity-init"),
  type: z.literal("quiz"),
  activityId: z
    .string()
    .describe("Unique id for this quiz activity, such as 'quiz-basic-css-1'."),
  title: z.string().describe("Short quiz title."),
  instructions: z
    .string()
    .optional()
    .describe("One sentence of instructions for the learner."),
  questions: z
    .array(quizQuestionSchema)
    .min(1)
    .max(6)
    .describe("The quiz questions to render."),
});

export type QuizActivityInit = z.infer<typeof quizActivityInitSchema>;
