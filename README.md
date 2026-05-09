# Copilot Tutor

Copilot Tutor is a Next.js tutoring agent that uses CopilotKit to chat with learners and generate interactive study activities inside the conversation. The tutor can explain concepts, create multiple-choice quizzes, build event-ordering exercises, and run misconception-detective activities where learners identify and explain an incorrect claim.

This project was built as part of the [Generative UI Global Hackathon: Agentic Interfaces](https://hong-kong.aitinkerers.org/p/generative-ui-global-hackathon-agentic-interfaces-hong-kong).

## Tech Stack

- [Next.js](https://nextjs.org/) app router
- [CopilotKit](https://www.copilotkit.ai/) runtime and React UI
- Gemini via CopilotKit's built-in agent model resolver
- React and Tailwind CSS

## Requirements

- Node.js compatible with Next.js 16
- pnpm
- A Gemini API key from Google AI Studio

## Environment Variables

This project requires a server-side Gemini API key:

```bash
GOOGLE_API_KEY=your_gemini_api_key_here
```

Create your local environment file from the example:

```bash
cp .env.example .env
```

Then edit `.env` and replace the placeholder with your real Gemini API key:

```bash
GOOGLE_API_KEY=AIza...
```

Do not prefix this variable with `NEXT_PUBLIC_`. The key is used by the server-side CopilotKit route in `app/api/copilotkit/route.ts` and the grading route in `app/api/misconception-detective/grade/route.ts`.

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

## Scripts

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
```

## Project Structure

- `app/page.tsx` renders the chat UI and registers activity tools.
- `app/api/copilotkit/route.ts` configures the CopilotKit runtime and Gemini tutor agent.
- `app/components/*` contains the interactive quiz, ordering, and misconception-detective components.
- `app/api/misconception-detective/grade/route.ts` grades misconception-detective attempts with Gemini.
