# Popup Lang

Popup Lang is a desktop language-learning app that helps users build a daily habit through:

- AI-generated daily words
- Quick in-app review
- Background quiz popups
- Progress tracking and statistics
- An educational chat assistant

> Built with **Tauri + Rust + React + TypeScript + Tailwind + SQLite**

---

## Core Features

- **Onboarding** to choose:
  - Native language
  - Target language
  - Level
  - Daily word count
  - Reminders and interests
- **Daily word generation** with explanation, translation, pronunciation, and examples.
- **Quiz Popup** shown periodically (or manually from the system tray).
- **Chat assistant** for word explanations and extra practice.
- **Dashboard** for daily completion, accuracy, and history.
- **RTL/LTR support** for mixed Arabic/English content.

---

## Requirements

Before running the app, install:

1. **Node.js** (18+ or 20+ recommended)
2. **npm**
3. **Rust** and Cargo
4. Tauri system prerequisites (WebView/tooling)

See official Tauri prerequisites by OS:
https://tauri.app/start/prerequisites/

---

## Run Locally

### 1) Install dependencies

```bash
npm install
```

### 2) Run desktop app

```bash
npm run tauri dev
```

### 3) Run frontend only

```bash
npm run dev
```

---

## Production Build

```bash
npm run tauri build
```

> App bundles are generated according to Tauri settings in `src-tauri/tauri.conf.json`.

---

## API Key Setup

- Daily word generation uses Groq.
- After launching the app, open **Settings** and enter your API key.
- The key is stored locally in the app settings database (SQLite).

---

## Available npm Scripts

- `npm run dev` — start Vite
- `npm run build` — build frontend (TypeScript + Vite)
- `npm run preview` — preview build
- `npm run tauri` — run Tauri commands
- `npm run test` — run tests once (Vitest)
- `npm run test:watch` — watch mode
- `npm run test:ui` — Vitest UI

---

## Project Structure (short)

- `src/` — React frontend (views, stores, components)
- `src-tauri/` — Rust backend + Tauri commands + SQLite
- `src-tauri/src/commands/` — app commands (chat/quiz/words/settings...)
- `src-tauri/src/db/` — migrations and queries
- `src-tauri/src/services/` — AI/provider integrations

---

## Notes

- The app uses a system tray and can keep running in the background.
- Closing the window hides the app instead of fully quitting.
- You can trigger a quiz immediately from tray menu via **Quiz Now**.

---

## Additional Project Docs

- `language-learning-desktop-app.md`
- `POPUP_IMPROVEMENTS.md`
- `MEMORY_AND_POPUP_FIX.md`
- `USAGE_EXAMPLES.md`
