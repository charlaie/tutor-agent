"use client";
import dynamic from "next/dynamic";
import { EventOrderingTool } from "./components/event-ordering-tool";
import { QuizTool } from "./components/quiz-tool";

const CopilotChat = dynamic(
  () => import("@copilotkit/react-core/v2").then((mod) => mod.CopilotChat),
  { ssr: false },
);

export default function Page() {
  return (
    <main className="h-screen bg-zinc-50 text-zinc-950 flex flex-col">
      <QuizTool />
      <EventOrderingTool />
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">
              Tutor Agent
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              Ask for explanations, examples, or a quick quiz on any topic.
            </p>
          </div>
        </header>

        <section className="min-h-0 flex-1 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
          <CopilotChat
            className="h-full"
            labels={{
              modalHeaderTitle: "Tutor",
              welcomeMessageText: "What would you like to learn today?",
              chatInputPlaceholder: "Ask a question or request a quiz...",
            }}
          />
        </section>
      </div>
    </main>
  );
}
