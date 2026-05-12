"use client";

import { useHumanInTheLoop } from "@copilotkit/react-core/v2";
import { normalizeQuizArgs } from "../lib/activity-normalize";
import {
  quizActivityInitSchema,
  type QuizActivityInit,
} from "../lib/quiz";
import { InteractiveQuiz, type QuizActivityEnd } from "./interactive-quiz";

type QuizToolProps = {
  args: Partial<QuizActivityInit>;
  status: "inProgress" | "executing" | "complete";
  result: string | undefined;
  respond?: (result: unknown) => Promise<void>;
};

function QuizToolRenderer({ args, status, result, respond }: QuizToolProps) {
  if (status === "inProgress") {
    return (
      <div className="my-3 rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-600 shadow-sm">
        Building quiz...
      </div>
    );
  }

  if (status === "complete") {
    return (
      <div className="my-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
        Quiz submitted.
        {result ? (
          <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-white/70 p-2 text-xs text-emerald-950">
            {result}
          </pre>
        ) : null}
      </div>
    );
  }

  const parsedQuiz = quizActivityInitSchema.safeParse(normalizeQuizArgs(args));

  if (!parsedQuiz.success) {
    return (
      <div className="my-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        The quiz activity was not generated in the expected format.
      </div>
    );
  }

  return (
    <InteractiveQuiz
      quiz={parsedQuiz.data}
      onComplete={(activityEnd: QuizActivityEnd) => {
        void respond?.(JSON.stringify(activityEnd));
      }}
    />
  );
}

export function QuizTool() {
  useHumanInTheLoop<QuizActivityInit>({
    name: "start_quiz",
    description:
      "Start an interactive multiple-choice quiz activity. Use this when the learner asks for a quiz, practice, review questions, or a knowledge check.",
    parameters: quizActivityInitSchema,
    followUp: true,
    render: QuizToolRenderer,
  });

  return null;
}
