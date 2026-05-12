import { MastraAgent } from "@ag-ui/mastra";
import { generateObject } from "ai";
import { randomUUID } from "node:crypto";
import { resolveModel } from "@copilotkit/runtime/v2";
import { Agent } from "@mastra/core/agent";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { createMisconceptionDetectiveSession } from "../lib/activity-sessions";
import { eventOrderingActivityInitSchema } from "../lib/event-ordering";
import { quizActivityInitSchema } from "../lib/quiz";

function createActivitySlug(topic: string) {
  return topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

const createQuizActivityTool = createTool({
  id: "create_quiz_activity",
  description:
    "Create a validated multiple-choice quiz activity payload. Use this before showing the start_quiz frontend tool.",
  inputSchema: z.object({
    topic: z.string().describe("The learner's topic for the quiz."),
    questionCount: z
      .number()
      .int()
      .min(1)
      .max(6)
      .optional()
      .describe("Number of questions. Default to 3 unless the learner asks otherwise."),
  }),
  outputSchema: quizActivityInitSchema,
  execute: async ({ topic, questionCount }) => {
    const { object } = await generateObject({
      model: resolveModel("google:gemini-2.5-flash"),
      schema: quizActivityInitSchema.omit({
        eventType: true,
        type: true,
        activityId: true,
      }),
      temperature: 0.4,
      system: `You create multiple-choice quiz activities for a tutor app.

Create clear learner-facing questions. Every question must have 2-5 choices, exactly one choice with isCorrect true, and a concise explanation.`,
      prompt: JSON.stringify({
        topic,
        questionCount: questionCount ?? 3,
      }),
    });

    return quizActivityInitSchema.parse({
      eventType: "activity-init",
      type: "quiz",
      activityId: `quiz-${createActivitySlug(topic) || "topic"}-${randomUUID().slice(0, 8)}`,
      ...object,
    });
  },
});

const createEventOrderingActivityTool = createTool({
  id: "create_event_ordering_activity",
  description:
    "Create a validated event-ordering activity payload. Use this before showing the start_event_ordering frontend tool.",
  inputSchema: z.object({
    topic: z.string().describe("The learner's topic for the ordering activity."),
    eventCount: z
      .number()
      .int()
      .min(3)
      .max(8)
      .optional()
      .describe("Number of events. Default to 5 unless the learner asks otherwise."),
  }),
  outputSchema: eventOrderingActivityInitSchema,
  execute: async ({ topic, eventCount }) => {
    const { object } = await generateObject({
      model: resolveModel("google:gemini-2.5-flash"),
      schema: eventOrderingActivityInitSchema.omit({
        eventType: true,
        type: true,
        activityId: true,
      }),
      temperature: 0.4,
      system: `You create event ordering activities for a tutor app.

Create events for the learner to arrange. The events array should be initially out of order, but each event's correctPosition must be its 1-based position in the correct sequence.`,
      prompt: JSON.stringify({
        topic,
        eventCount: eventCount ?? 5,
      }),
    });

    return eventOrderingActivityInitSchema.parse({
      eventType: "activity-init",
      type: "event-ordering",
      activityId: `ordering-${createActivitySlug(topic) || "topic"}-${randomUUID().slice(0, 8)}`,
      ...object,
    });
  },
});

const createMisconceptionDetectiveActivityTool = createTool({
  id: "create_misconception_detective_activity",
  description:
    "Create a misconception detective activity with a private server-side answer key. Use this before showing the misconception detective frontend tool.",
  inputSchema: z.object({
    topic: z
      .string()
      .describe("The learner's topic for the misconception detective activity."),
  }),
  outputSchema: z.object({
    eventType: z.literal("activity-init"),
    type: z.literal("misconception-detective"),
    activityId: z.string(),
    title: z.string(),
    instructions: z.string().optional(),
    statement: z.string(),
  }),
  execute: async ({ topic }) => {
    return createMisconceptionDetectiveSession({ topic });
  },
});

const tutorInstructions = `You are a patient tutor agent.

Help the learner build understanding step by step. Prefer concise explanations, ask clarifying questions when the learning goal is unclear, and adapt to the learner's level.

Interactive activity protocol:
- When the learner asks for practice, a quiz, a check, review questions, or a knowledge check, first call create_quiz_activity with the learner's topic and requested question count if any.
- After create_quiz_activity returns, immediately call start_quiz with exactly that returned activity payload. Do not rewrite, summarize, or omit fields from the returned payload.
- After the tool returns an activity-end quiz result, review only incorrectAnswers. Do not recap correct questions. If incorrectAnswers is empty, briefly acknowledge the perfect score and suggest one next step.
- When the learner asks to practice a timeline, chronology, sequence, process, ordered steps, lifecycle, workflow, or cause-and-effect chain, first call create_event_ordering_activity with the learner's topic and requested event count if any.
- After create_event_ordering_activity returns, immediately call start_event_ordering with exactly that returned activity payload. Do not rewrite, summarize, or omit fields from the returned payload.
- After the tool returns an activity-end event-ordering result, review only incorrectOrderings. Focus on the learner's repeated ordering mistakes and the concepts needed to fix them. If incorrectOrderings is empty, briefly acknowledge the correct order and suggest one next step.
- When the learner asks to find misconceptions, spot an error, debug a statement, catch a false claim, or play misconception detective, first call create_misconception_detective_activity with the learner's topic.
- After create_misconception_detective_activity returns, immediately call show_misconception_detective with exactly that returned public activity payload. Do not add targetMisconception or any answer key fields.
- The misconception detective component grades incorrect learner attempts through the activity side channel and only returns an activity-end result after the learner identifies the misconception correctly. After that result, briefly reinforce the corrected concept and suggest one next step.`;

const tutorAgent = new Agent({
  id: "tutor-agent",
  name: "Tutor Agent",
  instructions: tutorInstructions,
  model: "google/gemini-2.5-flash",
  tools: {
    createQuizActivityTool,
    createEventOrderingActivityTool,
    createMisconceptionDetectiveActivityTool,
  },
  defaultOptions: {
    maxSteps: 6,
  },
});

export const tutorMastraAgent = new MastraAgent({
  agentId: "default",
  description: "A patient tutor agent with interactive learning activities.",
  resourceId: "tutor",
  agent: tutorAgent,
});
