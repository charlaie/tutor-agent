# Copilot Tutor

Copilot Tutor is a Next.js tutoring agent that uses CopilotKit to chat with learners and generate interactive study activities inside the conversation. The tutor can explain concepts, create multiple-choice quizzes, build event-ordering exercises, and run misconception-detective activities where learners identify and explain an incorrect claim.

This project was built as part of the [Generative UI Global Hackathon: Agentic Interfaces](https://hong-kong.aitinkerers.org/p/generative-ui-global-hackathon-agentic-interfaces-hong-kong).

## Tech Stack

- [Next.js](https://nextjs.org/) app router
- [CopilotKit](https://www.copilotkit.ai/) runtime and React UI
- [AG-UI](https://docs.ag-ui.com/) as the agent/frontend protocol
- [Mastra](https://mastra.ai/) for the tutor agent runtime
- Gemini via Mastra and server-side AI SDK calls
- React and Tailwind CSS

## Requirements

- Node.js compatible with Next.js 16
- pnpm
- A Gemini API key from Google AI Studio

## Environment Variables

This project requires a server-side Gemini API key:

```bash
GOOGLE_API_KEY=your_gemini_api_key_here
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here
```

Create your local environment file from the example:

```bash
cp .env.example .env
```

Then edit `.env` and replace the placeholder with your real Gemini API key:

```bash
GOOGLE_API_KEY=AIza...
GOOGLE_GENERATIVE_AI_API_KEY=AIza...
```

Do not prefix these variables with `NEXT_PUBLIC_`. They are used only on the server by the Mastra tutor agent, activity creation tools, and misconception grading side channel.

## Getting Started

Install dependencies:

```bash
pnpm install
```

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Use

Ask the tutor for help with a topic:

```text
Explain photosynthesis at a high-school level.
```

Ask for an interactive quiz:

```text
Give me a 4-question quiz about React hooks.
```

Ask for an ordering activity:

```text
Help me practice the order of mitosis phases.
```

Ask for misconception practice:

```text
Play misconception detective with me about HTTP caching.
```

The tutor will call the relevant CopilotKit human-in-the-loop tool and render the interactive component in the chat.

## Architecture

The chat UI is still rendered with CopilotKit, but the tutor agent is now a Mastra agent exposed through AG-UI:

```text
React + CopilotKit chat
  -> /api/copilotkit
  -> AG-UI MastraAgent adapter
  -> Mastra tutor agent
  -> Gemini
```

Quiz and event-ordering activities use backend Mastra creation tools to produce validated activity payloads, then render with the existing CopilotKit human-in-the-loop components. They still grade locally in the browser and send one final result back to the tutor.

Misconception detective uses a side channel for intermediate attempts:

```text
show_misconception_detective frontend tool
  -> public activity payload only
  -> /api/activity-events for each learner attempt
  -> server-side private activity session + Gemini grading
  -> final result returned to the main chat only when complete
```

This keeps detailed attempt/grading messages out of the main conversation history and keeps the hidden `targetMisconception` answer key off the client.

## Scripts

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
```

## Project Structure

- `app/page.tsx` renders the chat UI and registers activity tools.
- `app/api/copilotkit/route.ts` exposes the CopilotKit runtime with the Mastra AG-UI tutor agent.
- `app/mastra/tutor-agent.ts` defines the Mastra tutor agent and backend activity creation tools.
- `app/components/*` contains the interactive quiz, ordering, and misconception-detective components.
- `app/api/activity-events/route.ts` handles structured side-channel activity events.
- `app/lib/activity-sessions.ts` stores private in-memory misconception activity state and grades attempts.
