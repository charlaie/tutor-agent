import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import type { NextRequest } from "next/server";
import { tutorMastraAgent } from "../../mastra/tutor-agent";

const runtime = new CopilotRuntime({
  agents: { default: tutorMastraAgent },
});

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
