import { NextResponse } from "next/server";
import { gradeMisconceptionDetectiveAttempt } from "../../lib/activity-sessions";
import { misconceptionDetectiveAttemptSchema } from "../../lib/misconception-detective";

export async function POST(request: Request) {
  const payload = misconceptionDetectiveAttemptSchema.safeParse(
    await request.json(),
  );

  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid activity event." },
      { status: 400 },
    );
  }

  try {
    const feedback = await gradeMisconceptionDetectiveAttempt(payload.data);

    return NextResponse.json(feedback);
  } catch (error) {
    console.error("Failed to handle activity event", error);

    const message =
      error instanceof Error && error.message === "Activity session not found."
        ? "Activity session not found."
        : "The tutor could not handle this activity event.";

    return NextResponse.json(
      { error: message },
      { status: message === "Activity session not found." ? 404 : 500 },
    );
  }
}
