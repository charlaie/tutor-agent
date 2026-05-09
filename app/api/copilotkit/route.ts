import {
	CopilotRuntime,
	copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { BuiltInAgent } from "@copilotkit/runtime/v2";
import { NextRequest } from "next/server";

const builtInAgent = new BuiltInAgent({
	model: "google:gemini-2.5-flash",
});

const runtime = new CopilotRuntime({
	agents: { default: builtInAgent },
});

export const POST = async (req: NextRequest) => {
	const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
		runtime,
		endpoint: "/api/copilotkit",
	});

	return handleRequest(req);
};
