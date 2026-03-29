# CodeQuest

CodeQuest is a Next.js 14 App Router app focused entirely on AI-assisted coding practice. It combines coding challenges, a dedicated AI tutor, a free editor, and Firebase-backed progress tracking in one product.

## Stack

- Next.js 14 with the App Router
- TypeScript
- Tailwind CSS
- Framer Motion animations
- Google Gemini API via server route handlers
- Monaco Editor for coding surfaces
- Geist and Geist Mono from Google Fonts

## Features

- Coding challenge library with difficulty filters and Monaco-based challenge runner
- Dedicated AI tutor for hints, debugging help, and concept explanations
- Free editor for JavaScript, TypeScript, and Python with AI-simulated console output
- Google login with Firebase Authentication
- Firebase Firestore progress tracking for solved challenges, XP, and streak
- Personalization engine for weak-topic tracking, adaptive difficulty, and next-problem suggestions
- User dashboard with solved stats, accuracy, XP, weak topics, and chart visualizations
- Light and dark theme support with modernized layout spacing and visuals

## Environment

Copy the example file and add your server-side API credentials:

```bash
cp .env.local.example .env.local
```

Then set:

```env
GEMINI_API_KEY=your_gemini_api_key_here
JUDGE0_API_URL=https://ce.judge0.com
JUDGE0_AUTH_TOKEN=your_judge0_auth_token_here
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

`JUDGE0_API_URL` and `JUDGE0_AUTH_TOKEN` are only read on the server. The Judge0 helper lives in [`lib/judge0.ts`](./lib/judge0.ts) and is intended for route handlers or other server-only modules.
Firebase web config is initialized in [`lib/firebase.ts`](./lib/firebase.ts) and is intended for client-side auth and Firestore usage.

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
    dashboard/route.ts
    evaluate/route.ts
  challenges/
    [id]/page.tsx
    page.tsx
  code/page.tsx
  dashboard/page.tsx
  progress/page.tsx
  tutor/page.tsx
  Nav.tsx
  globals.css
  layout.tsx
  page.tsx
components/
  dashboard/
    DonutChart.tsx
    HorizontalBarChart.tsx
    MetricCard.tsx
  MessageContent.tsx
  ProgressBar.tsx
lib/
  challenges.ts
  firebase.ts
  gamification.ts
  dashboard.ts
  gemini.ts
  judge0.ts
  personalization.ts
  progress.ts
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
      "content": "Help me debug this loop without solving it"
    }
  ],
  "mode": "coding",
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

- `coding`: challenge-aware tutor guidance with hints and debugging help
- `editor`: raw console output simulation for the free editor
- `evaluation`: private evaluator mode used by the submission checker

### `POST /api/evaluate`

Accepts:

```json
{
  "challengeId": "sum-two-numbers",
  "code": "function sum(a, b) { return a + b; }"
}
```

### `POST /api/dashboard`

Accepts a progress snapshot payload (same shape used by the client progress state).

Returns:

```json
{
  "solvedCount": 4,
  "totalChallenges": 6,
  "solvedPercent": 67,
  "accuracyPercent": 72,
  "xp": 140,
  "weakTopics": [
    {
      "topic": "strings",
      "attempts": 5,
      "errorRatePercent": 60
    }
  ],
  "difficultyAccuracy": [
    {
      "difficulty": "beginner",
      "attempts": 12,
      "solved": 3,
      "accuracyPercent": 75
    }
  ]
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

- Progress is synced through Firebase Firestore when users sign in.
- Gamification XP rules are centralized in [`lib/gamification.ts`](./lib/gamification.ts).
- Personalization logic lives in [`lib/personalization.ts`](./lib/personalization.ts).
- The coding evaluator uses Gemini reasoning against the supplied challenge metadata and test cases.
- The free editor simulates console output through Gemini and does not execute code in a sandboxed runtime.

## Firestore Structure

```text
users/{uid}
  completedIds: string[]
  xp: number
  streak: number
  lastSolvedDate: string | null   // YYYY-MM-DD (UTC)
  challengeStats: {
    [challengeId]: {
      attempts: number
      passed: number
      failed: number
      lastOutcome: "passed" | "failed" | null
      lastAttemptAt: string | null
    }
  }
  topicStats: {
    [topic]: {
      attempts: number
      passed: number
      failed: number
    }
  }
  recentAttemptOutcomes: ("passed" | "failed")[]
  displayName: string | null
  email: string | null
  photoURL: string | null
  createdAt: timestamp
  updatedAt: timestamp
```
