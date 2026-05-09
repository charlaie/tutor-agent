import { generateObject } from "ai";
import { resolveModel } from "@copilotkit/runtime/v2";
import { z } from "zod";
import {
  misconceptionDetectiveFeedbackSchema,
  misconceptionDetectiveGradeRequestSchema,
} from "../../../lib/misconception-detective";

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

export async function POST(request: Request) {
  const payload = misconceptionDetectiveGradeRequestSchema.safeParse(
    await request.json(),
  );

  if (!payload.success) {
    return Response.json(
      { error: "Invalid misconception detective attempt." },
      { status: 400 },
    );
  }

  const { activity, attempt } = payload.data;

  try {
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
      attemptNumber: attempt.attemptNumber,
      selectedText: attempt.selectedText,
      reason: attempt.reason,
      isCorrect: object.isCorrect,
      feedback: object.feedback,
    });

    return Response.json(feedback);
  } catch (error) {
    console.error("Failed to grade misconception detective attempt", error);

    return Response.json(
      { error: "The tutor could not check this attempt." },
      { status: 500 },
    );
  }
}
