# Learnly

Learnly is a Next.js 14 App Router web app for practicing both programming and spoken languages in one place. It includes curated coding challenges, guided language lessons, a Gemini-powered AI tutor, a free code editor, and a local progress system backed by `localStorage`.

## Stack

- Next.js 14 with the App Router
- TypeScript
- Tailwind CSS
- Google Gemini API via server route handlers
- Monaco Editor for coding surfaces
- Geist and Geist Mono from Google Fonts

## Features

- Minimal white UI built from CSS variables in [`app/globals.css`](./app/globals.css)
- Sticky shared navigation with Home, AI Tutor, Editor, and Progress
- Coding challenge library with difficulty filters and Monaco-based challenge runner
- Spoken-language lesson library with exercise-by-exercise checking and AI feedback
- AI tutor with General, Coding, and Languages modes
- Free editor for JavaScript, TypeScript, and Python with Gemini-simulated console output
- Progress tracking and XP totals stored in `localStorage`

## Environment

Copy the example file and add your Gemini API key:

```bash
cp .env.local.example .env.local
```

Then set:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Scripts

- `npm run dev` starts the development server
- `npm run build` creates a production build
- `npm run start` runs the production server
- `npm run typecheck` runs TypeScript without emitting files

## Project Structure

```text
app/
  api/
    chat/route.ts
    evaluate/route.ts
  challenges/
    [id]/page.tsx
    page.tsx
  code/page.tsx
  languages/
    [id]/page.tsx
    page.tsx
  learn/page.tsx
  progress/page.tsx
  Nav.tsx
  globals.css
  layout.tsx
  page.tsx
components/
  MessageContent.tsx
  ProgressBar.tsx
lib/
  claude.ts
  data.ts
  useProgress.ts
```

## API Routes

### `POST /api/chat`

Accepts:

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Help me with Spanish greetings"
    }
  ],
  "mode": "language",
  "context": {}
}
```

Returns:

```json
{
  "message": "..."
}
```

Modes:

- `coding`: patient coding tutor, hints only, no full solutions
- `language`: friendly language tutor with translations and examples
- `general`: mixed tutor for coding and spoken languages

### `POST /api/evaluate`

Accepts:

```json
{
  "code": "function sum(a, b) { return a + b; }",
  "challenge": {
    "id": "sum-two-numbers"
  }
}
```

Returns JSON only:

```json
{
  "passed": true,
  "passedTests": 3,
  "totalTests": 3,
  "feedback": "Your function returns the correct sum for the provided cases.",
  "suggestion": "You can now try a more advanced challenge."
}
```

## Notes

- Progress is stored locally under the `learnly_progress` key.
- The coding evaluator uses Gemini reasoning against the supplied challenge metadata and test cases.
- The free editor simulates console output through Gemini and does not execute code in a sandboxed runtime.
