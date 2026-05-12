"use client";

import { useHumanInTheLoop } from "@copilotkit/react-core/v2";
import { normalizeMisconceptionDetectiveArgs } from "../lib/activity-normalize";
import {
  type MisconceptionDetectiveFeedback,
  type MisconceptionDetectivePublicActivity,
  misconceptionDetectivePublicActivitySchema,
} from "../lib/misconception-detective";
import { InteractiveMisconceptionDetective } from "./interactive-misconception-detective";

type MisconceptionDetectiveToolProps = {
  args: Partial<MisconceptionDetectivePublicActivity>;
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

  const parsedActivity = misconceptionDetectivePublicActivitySchema.safeParse(
    normalizeMisconceptionDetectiveArgs(args),
  );

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
      onComplete={(activityEnd: MisconceptionDetectiveFeedback) => {
        void respond?.(JSON.stringify(activityEnd));
      }}
    />
  );
}

export function MisconceptionDetectiveTool() {
  useHumanInTheLoop<MisconceptionDetectivePublicActivity>({
    name: "show_misconception_detective",
    description:
      "Show an interactive misconception detective activity where the learner highlights the incorrect part of a statement and explains what is wrong.",
    parameters: misconceptionDetectivePublicActivitySchema,
    followUp: true,
    render: MisconceptionDetectiveToolRenderer,
  });

  return null;
}
