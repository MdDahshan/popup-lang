# Language Learning Desktop App

## Overview

A desktop language-learning app that helps users build vocabulary through daily word sets, AI-guided explanations, repeated practice during the day, instant correction, and progress tracking.

The app is designed for desktop using **Tauri + Rust + React + TypeScript + Tailwind CSS**, with **SQLite** for local persistence and **Groq** for AI-powered explanations and feedback.

## Product Vision

The app lets the user choose:

- their native language
- the target language they want to learn
- the number of daily words, with a minimum of 3

Each day, the system prepares a daily learning set. For every word, the app explains:

- meaning
- pronunciation
- usage
- examples
- contextual notes in the user's native language

During the day, the app re-surfaces those words through in-app practice prompts, reminder flows, and quick quiz popups inside the desktop app.

If the user answers incorrectly, the AI explains the mistake, provides the correct meaning, gives alternative examples, and helps reinforce the word.

Everything is tracked in a dashboard, including:

- words studied
- correct and incorrect answers
- difficult words
- streaks
- daily and weekly performance
- review frequency

## Core Product Flow

### 1. Onboarding

When the user opens the app for the first time, they complete onboarding:

- choose native language
- choose target language
- select current level: beginner, intermediate, advanced
- choose daily word count, minimum 3
- choose reminder preferences
- optionally choose topic interests like travel, work, business, daily conversation

### 2. Daily Word Generation

At the start of each day, the app creates a daily word pack.

The pack should be based on:

- user level
- past performance
- difficult words that need reinforcement
- selected interests or categories
- already learned vocabulary to avoid unnecessary repetition

Each word entry should include:

- the word itself
- translation
- pronunciation or phonetic guide
- simple explanation in the native language
- 2 to 3 example sentences
- word type: noun, verb, adjective, etc.
- difficulty score
- review priority

### 3. Learning Session

The user can open the app and see today's words in a structured learning view.

For each word, the app shows:

- word card
- pronunciation button
- explanation
- example usage
- quick practice prompt

### 4. Practice During the Day

The app should run in the background and stay available through the system tray. During the day, it can show a small quiz popup card that appears automatically in the **top-right corner** of the screen.

This popup should behave like a lightweight floating card, not a full window. Its purpose is to create fast learning moments without forcing the user to fully open the app every time.

The popup card can include:

- one mini quiz at a time
- the current word
- a small question area
- quick answer buttons or a short input field
- instant feedback
- a close, snooze, or remind me later action

Suggested popup behavior:

- the app runs in the background after launch
- at configured intervals, a quiz card appears automatically
- the popup opens near the top-right side of the desktop
- it stays small and non-blocking
- it disappears automatically after a short time if ignored, or can be snoozed manually
- clicking the card can open the full app for more practice

Practice formats can include:

- translate the word
- choose the correct meaning
- fill in the blank
- use the word in a sentence
- identify the correct pronunciation

This should be implemented as a background desktop learning assistant experience, where the app remains active and periodically surfaces mini quiz cards throughout the day.

### 5. Error Correction Flow

If the user answers incorrectly:

- show the correct answer immediately
- explain why the answer was wrong
- give a simpler explanation
- provide one or more extra examples
- mark the word for future review
- increase the repetition priority for that word

### 6. Statistics Dashboard

The dashboard should show:

- total words learned
- today's completion progress
- weekly activity
- answer accuracy rate
- hardest words
- streak count
- review consistency
- per-language progress

## Why Desktop Works Well

A desktop version is useful for users who:

- study while working on their computer
- want a focused learning environment
- prefer keyboard-based interactions
- like visible progress dashboards
- want quick review sessions during work breaks

Desktop is also a strong environment for:

- richer analytics
- fast keyboard-driven quizzes
- side-panel learning
- system tray reminders
- lightweight local-first storage

## Recommended Tech Stack

### Frontend

- **React**
- **TypeScript**
- **Tailwind CSS**
- optional: **shadcn/ui** for clean and reusable UI components

### Desktop Shell

- **Tauri**

### Native Layer

- **Rust**

### Database

- **SQLite**

### AI Layer

- **Groq API**

## Why This Stack Is a Good Fit

### Tauri

- lightweight desktop app
- smaller bundle size than Electron in many cases
- good security model
- strong native integration
- ideal for modern cross-platform desktop apps

### Rust

- excellent for desktop-native capabilities
- useful for local scheduling and system integrations
- strong performance
- reliable for local services and background logic

### React

- fast UI development
- easy component architecture
- strong ecosystem
- good fit for dashboards, cards, quizzes, and onboarding flows

### Tailwind CSS

- rapid UI building
- clean styling workflow
- useful for responsive layouts, cards, badges, charts, and panels

### SQLite

- simple and fast local database
- perfect for user progress, word history, mistakes, and analytics
- no separate server required for MVP

### Groq

- fast inference for AI explanations
- useful for correction, examples, simplification, and adaptive teaching

## High-Level Architecture

### App Layers

1. **React UI Layer**

- onboarding screens
- daily words screen
- quiz modals
- dashboard
- settings

1. **Tauri Bridge**

- communication between frontend and native system layer
- invoke commands from React to Rust

1. **Rust Core Layer**

- local scheduling
- reminder logic
- database access helpers
- secure API handling if needed
- native desktop integrations

1. **Persistence Layer**

- SQLite database

1. **AI Service Layer**

- Groq API requests for explanations, examples, and answer correction

## Suggested Folder Structure

```text
language-learning-desktop/
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── lib/
│   ├── store/
│   ├── styles/
│   └── types/
├── src-tauri/
│   ├── src/
│   │   ├── commands/
│   │   ├── db/
│   │   ├── services/
│   │   ├── models/
│   │   └── main.rs
│   └── tauri.conf.json
├── public/
├── package.json
└── README.md
```

## Core Features for MVP

### Must Have

- onboarding flow
- native language selection
- target language selection
- level selection
- daily word count setting
- daily word list generation
- word explanation page
- quiz interactions
- wrong answer correction flow
- local progress tracking
- statistics dashboard
- reminder system
- settings page

### Good to Have Soon After

- topic-based word packs
- streak rewards
- difficulty adaptation
- review queue for failed words
- import or export progress

### Planned After MVP

- audio pronunciation
- mobile companion app
- cloud backup or sync layer

### Later Stage Features

- mobile version after desktop MVP
- cloud sync
- account system
- cross-device progress
- gamification
- shared study lists
- teacher mode or curated lesson packs
- AI conversation practice

## Functional Modules

### 1. User Profile Module

Stores:

- native language
- target language
- level
- preferred word count
- reminder preferences
- topic interests

### 2. Word Management Module

Handles:

- selecting new daily words
- storing word metadata
- prioritizing difficult words
- avoiding duplicate overexposure
- organizing review queue

### 3. AI Explanation Module

Responsible for:

- meaning explanation
- simplification by level
- generating examples
- correcting user mistakes
- giving contrast between similar words

### 4. Quiz Engine

Supports:

- multiple choice
- text input
- fill in the blank
- sentence usage prompts
- pronunciation checks if audio is added later

### 5. Reminder Engine

Handles:

- background app runtime
- system tray presence
- scheduled popup quiz cards
- desktop reminder timing rules
- re-prompt logic for missed practice
- snooze and remind-later behavior
- opening the full app when the popup is clicked

### 6. Analytics Module

Tracks:

- attempts per word
- correct rate
- incorrect rate
- review count
- streaks
- hardest words
- daily completion

## Database Design

### users

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  native_language TEXT NOT NULL,
  target_language TEXT NOT NULL,
  level TEXT NOT NULL,
  daily_word_count INTEGER NOT NULL,
  reminder_enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### words

```sql
CREATE TABLE words (
  id INTEGER PRIMARY KEY,
  word_text TEXT NOT NULL,
  target_language TEXT NOT NULL,
  translation TEXT,
  pronunciation TEXT,
  explanation TEXT,
  examples_json TEXT,
  word_type TEXT,
  difficulty_score REAL DEFAULT 0,
  created_at TEXT NOT NULL
);
```

### daily_word_sets

```sql
CREATE TABLE daily_word_sets (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

### daily_words

```sql
CREATE TABLE daily_words (
  id INTEGER PRIMARY KEY,
  set_id INTEGER NOT NULL,
  word_id INTEGER NOT NULL,
  order_index INTEGER NOT NULL,
  review_priority REAL DEFAULT 1
);
```

### quiz_attempts

```sql
CREATE TABLE quiz_attempts (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  word_id INTEGER NOT NULL,
  question_type TEXT NOT NULL,
  user_answer TEXT,
  is_correct INTEGER NOT NULL,
  ai_feedback TEXT,
  created_at TEXT NOT NULL
);
```

### review_queue

```sql
CREATE TABLE review_queue (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  word_id INTEGER NOT NULL,
  priority REAL NOT NULL,
  next_review_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

## UI Screens

### 1. Welcome / Onboarding

- choose languages
- choose level
- choose word count
- choose reminder settings

### 2. Home Screen

- today's goal
- today's words
- quick progress summary
- continue learning button

### 3. Word Detail Screen

- word
- translation
- pronunciation
- explanation
- examples
- practice button

### 4. Quiz Popup / Modal

- one question at a time
- fast answer entry
- immediate feedback

### 5. Dashboard

- charts
- streaks
- hardest words
- success rate
- daily and weekly trends

### 6. Settings

- language preferences
- reminder times
- AI explanation preferences
- reset progress
- export data

## Suggested State Management

For React, use one of these:

- **Zustand** for simple and clean state management
- or **Redux Toolkit** if the app becomes larger

Recommended for MVP: **Zustand**

Store slices can include:

- user settings
- current daily set
- active quiz state
- dashboard stats
- reminder state

## API Design for AI Requests

### Example AI tasks

1. **Explain word**

- input: word, target language, native language, user level
- output: explanation, pronunciation, examples

1. **Correct answer**

- input: word, user answer, expected answer, user level
- output: correctness explanation, improved examples, retry hint

1. **Generate daily words**

- input: level, target language, past mistakes, user interests
- output: daily word suggestions

## Prompting Strategy

The AI should be instructed to:

- explain in the user's native language
- keep output short and clear
- adapt to the learner's level
- avoid overly academic explanations
- give practical, common examples
- provide encouragement when correcting mistakes

## Reminder UX Recommendation

For desktop, the intended experience is:

- the app stays running in the background
- it remains available from the system tray
- at scheduled times, it shows a small floating quiz card
- the card appears in the top-right corner of the desktop
- the card should feel lightweight, fast, and easy to dismiss
- clicking it can expand into a larger practice experience inside the app

The popup should not behave like a blocking system alert. It should feel like a smart study companion that quietly appears during the day with small review challenges.

## Security and Privacy

Recommended principles:

- keep user progress stored locally by default
- store API keys securely, never expose secrets in frontend code
- use Rust side for sensitive handling where possible
- request only needed permissions
- make reminders configurable and easy to disable
- design the architecture so local-first desktop data can later evolve into optional sync for mobile support

## Development Roadmap

### Phase 1: Foundation

- initialize Tauri app
- set up React + TypeScript + Tailwind
- create app shell and routing
- create SQLite setup
- build onboarding screens

### Phase 2: Core Learning Flow

- build daily words screen
- build word detail screen
- integrate Groq for explanations
- build quiz modal
- save quiz attempts

### Phase 3: Reminder and Review System

- add reminder engine
- add tray integration
- build review queue logic
- repeat difficult words based on mistakes

### Phase 4: Analytics

- build dashboard
- track daily and weekly performance
- identify hardest words
- calculate streaks

### Phase 5: Polish

- improve UI
- optimize flows
- add settings and export
- test cross-platform desktop behavior

## Recommended Libraries

### Frontend

- `react`
- `typescript`
- `tailwindcss`
- `zustand`
- `react-router-dom`
- `tanstack-query` if you want structured async fetching
- `recharts` for dashboard charts
- `shadcn/ui` for UI building blocks

### Tauri / Rust

- `tauri`
- `serde`
- `rusqlite` or `sqlx` with SQLite
- notification or tray support depending on final implementation

## Risks and Product Decisions

### 1. Overusing AI

Risk:

- high cost
- inconsistent output

Solution:

- cache responses locally
- reuse explanations where possible
- keep deterministic app logic outside AI

### 2. Overly intrusive reminders

Risk:

- users disable reminders
- app becomes annoying

Solution:

- make reminder frequency configurable
- keep interactions short
- allow snooze or pause

### 3. Hard first-time experience

Risk:

- users drop before habit forms

Solution:

- keep onboarding short
- default to 3 words per day
- guide user into first success quickly

## Final Recommendation

For a desktop version, this is the strongest practical stack:

- **Tauri** latest version
- **Rust** latest version
- **React** latest version
- **TypeScript** latest version
- **Tailwind CSS** latest version
- **SQLite** latest version
- **Groq API**

This stack gives you:

- a modern UI
- local-first performance
- solid native desktop capability
- clean architecture for AI-enhanced learning
- a realistic path from MVP to full product

## Confirmed Product Decisions

- the app starts as a **desktop app first**, with a plan to support **mobile later**
- target desktop platforms from the beginning are **Windows, macOS, and Linux**
- the app will **always require internet for AI features**
- daily words and learning content should be generated **with AI**
- **audio pronunciation** is planned for a later phase, not MVP
- the first version should be **local-only first**, without user accounts or sync
- the MVP should support **multiple target languages** from day one

## Remaining Open Question

- popup quiz card support **full interaction directly inside the card** using buttons and text input