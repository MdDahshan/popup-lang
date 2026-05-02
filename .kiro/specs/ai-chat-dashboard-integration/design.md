# Design Document: AI Chat Dashboard Integration

## Overview

This feature reorganizes the application's main pages to provide immediate access to an AI-powered language tutor on the home page while consolidating all learning statistics and word management into a comprehensive dashboard. The design involves:

1. **New AI Chat Page (/)**: A full-screen conversational interface where users can interact with an AI tutor for language learning assistance
2. **Enhanced Dashboard (/dashboard)**: A unified view combining daily words, progress tracking, statistics, and review management
3. **Chat History Persistence**: Database-backed storage of all chat conversations for review and continuity
4. **Word Context Integration**: Ability to send words from the dashboard to the AI chat for detailed explanations

The architecture leverages the existing Groq AI service, Zustand state management, and SQLite database infrastructure while introducing new components for chat UI and enhanced dashboard layouts.

## Architecture

### High-Level Component Structure

```
┌─────────────────────────────────────────────────────────────┐
│                        App Router                            │
│  (React Router with HashRouter)                             │
└────────────┬────────────────────────────────┬───────────────┘
             │                                │
    ┌────────▼────────┐              ┌───────▼────────┐
    │  AI Chat Page   │              │   Dashboard    │
    │      (/)        │              │  (/dashboard)  │
    └────────┬────────┘              └───────┬────────┘
             │                                │
    ┌────────▼────────┐              ┌───────▼────────┐
    │  ChatStore      │              │  WordsStore    │
    │  (Zustand)      │              │  UserStore     │
    └────────┬────────┘              └───────┬────────┘
             │                                │
    ┌────────▼────────────────────────────────▼────────┐
    │           Tauri Backend (Rust)                   │
    │  ┌──────────────┐  ┌──────────────┐            │
    │  │ Chat Commands│  │ Word Commands│            │
    │  └──────┬───────┘  └──────┬───────┘            │
    │         │                  │                     │
    │  ┌──────▼──────────────────▼───────┐           │
    │  │      Groq AI Service             │           │
    │  └──────────────────────────────────┘           │
    │                                                  │
    │  ┌──────────────────────────────────┐           │
    │  │      SQLite Database             │           │
    │  │  - chat_messages                 │           │
    │  │  - chat_sessions                 │           │
    │  │  - words, daily_words            │           │
    │  └──────────────────────────────────┘           │
    └──────────────────────────────────────────────────┘
```

### Data Flow

**Chat Message Flow:**
1. User types message in ChatInput component
2. ChatStore dispatches message to Tauri backend
3. Backend calls Groq API with conversation context
4. Response streams back and updates ChatStore
5. ChatMessage components re-render with new messages
6. Messages persist to database

**Dashboard Data Flow:**
1. Dashboard mounts and fetches data from multiple stores
2. WordsStore provides daily words and progress
3. UserStore provides user profile and settings
4. DashboardStats fetched from backend (aggregated queries)
5. Components render with real-time data
6. User actions (generate words, start quiz) update stores

## Components and Interfaces

### Frontend Components

#### 1. AI Chat Page Components

**ChatPage** (`src/pages/ChatPage.tsx`)
- Main container for the AI chat interface
- Manages layout: header, message list, input area
- Handles scroll behavior and auto-scroll to latest message
- Provides clear history action

**ChatMessageList** (`src/components/chat/ChatMessageList.tsx`)
- Renders scrollable list of chat messages
- Implements virtualization for 100+ messages (react-window)
- Groups messages by date
- Shows typing indicator when AI is responding

**ChatMessage** (`src/components/chat/ChatMessage.tsx`)
- Displays individual message (user or AI)
- Props: `message: ChatMessage`, `isUser: boolean`
- Supports RTL/LTR text direction detection
- Renders markdown formatting for AI responses
- Shows timestamp on hover

**ChatInput** (`src/components/chat/ChatInput.tsx`)
- Text input with send button
- Auto-resize textarea (max 5 lines)
- Keyboard shortcuts (Enter to send, Shift+Enter for newline)
- Disabled state during AI response
- Character limit indicator (optional)

**WordContextPrompt** (`src/components/chat/WordContextPrompt.tsx`)
- Special message component for word explanations
- Displays word card with translation
- Shows "Explain this word" prompt
- Auto-triggers AI explanation on mount

#### 2. Enhanced Dashboard Components

**DashboardPage** (`src/pages/DashboardPage.tsx`)
- Main container with grid layout
- Orchestrates all dashboard sections
- Manages data fetching and refresh

**DashboardStatsCards** (`src/components/dashboard/DashboardStatsCards.tsx`)
- Four metric cards: Total Words, Accuracy, Streak, Today's Progress
- Props: `stats: DashboardStats`
- Animated number transitions

**DailyWordsSection** (`src/components/dashboard/DailyWordsSection.tsx`)
- Displays today's word list with progress
- Word cards with learned status
- "Explain with AI" button on each word
- Navigate to word detail on click

**QuickActionsSection** (`src/components/dashboard/QuickActionsSection.tsx`)
- Action buttons: Generate Words, Start Quiz, Refresh Words
- Loading states for each action
- Error display

**WeeklyActivityChart** (`src/components/dashboard/WeeklyActivityChart.tsx`)
- Bar chart showing words learned per day (7 days)
- Uses recharts library
- Responsive sizing

**WordsReviewList** (`src/components/dashboard/WordsReviewList.tsx`)
- List of words needing review (based on quiz performance)
- Sorted by priority
- Click to navigate to word detail

### State Management

#### ChatStore (`src/store/chatStore.ts`)

```typescript
interface ChatState {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  sessionId: number | null;
  
  // Actions
  fetchMessages: () => Promise<void>;
  sendMessage: (content: string, wordContext?: WordContext) => Promise<void>;
  clearHistory: () => Promise<void>;
  retryLastMessage: () => Promise<void>;
}

interface ChatMessage {
  id: number;
  session_id: number;
  role: 'user' | 'assistant';
  content: string;
  word_context_id?: number;
  created_at: string;
}

interface WordContext {
  word_id: number;
  word_text: string;
  translation: string;
}
```

#### Enhanced WordsStore

Add method for AI explanation:
```typescript
interface WordsState {
  // ... existing fields
  explainWordWithAI: (wordId: number) => Promise<void>;
}
```

### Backend Components

#### Tauri Commands

**Chat Commands** (`src-tauri/src/commands/chat.rs`)

```rust
#[tauri::command]
pub async fn send_chat_message(
    state: State<'_, AppState>,
    content: String,
    word_context_id: Option<i64>,
) -> Result<ChatMessage, String>

#[tauri::command]
pub async fn get_chat_messages(
    state: State<'_, AppState>,
) -> Result<Vec<ChatMessage>, String>

#[tauri::command]
pub async fn clear_chat_history(
    state: State<'_, AppState>,
) -> Result<(), String>

#[tauri::command]
pub async fn get_or_create_session(
    state: State<'_, AppState>,
) -> Result<i64, String>
```

**Enhanced Dashboard Commands** (`src-tauri/src/commands/dashboard.rs`)

```rust
// Existing get_dashboard_stats enhanced with more metrics
#[tauri::command]
pub async fn get_dashboard_stats(
    state: State<'_, AppState>,
) -> Result<DashboardStats, String>
```

#### AI Service Enhancement

**Chat Service** (`src-tauri/src/services/groq.rs`)

Add new function:
```rust
pub async fn chat_completion(
    api_key: &str,
    messages: Vec<ChatMessage>,
    user_context: &UserContext,
    word_context: Option<&WordContext>,
) -> Result<String, String>
```

This function:
- Accepts conversation history
- Includes system prompt with user's language learning context
- Optionally includes word context for explanations
- Returns AI response as string

## Data Models

### Database Schema Changes

#### New Tables

**chat_sessions**
```sql
CREATE TABLE chat_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id, updated_at DESC);
```

**chat_messages**
```sql
CREATE TABLE chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    word_context_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (word_context_id) REFERENCES words(id)
);

CREATE INDEX idx_chat_messages_session ON chat_messages(session_id, created_at);
```

### TypeScript Types

**Chat Types** (`src/types/index.ts`)

```typescript
export interface ChatSession {
  id: number;
  user_id: number;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: number;
  session_id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  word_context_id: number | null;
  created_at: string;
}

export interface WordContext {
  word_id: number;
  word_text: string;
  translation: string;
  pronunciation: string;
}
```

### Rust Models

**Chat Models** (`src-tauri/src/models/chat.rs`)

```rust
#[derive(Debug, Serialize, Deserialize)]
pub struct ChatSession {
    pub id: i64,
    pub user_id: i64,
    pub title: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatMessage {
    pub id: i64,
    pub session_id: i64,
    pub role: String,
    pub content: String,
    pub word_context_id: Option<i64>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserContext {
    pub target_language: String,
    pub native_language: String,
    pub level: String,
    pub interests: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WordContext {
    pub word_id: i64,
    pub word_text: String,
    pub translation: String,
    pub pronunciation: String,
}
```

## Error Handling

### Frontend Error Handling

**Chat Errors:**
- API key not configured: Show inline message with link to settings
- Network timeout (30s): Show retry button
- Rate limit exceeded: Show friendly message with wait time
- Invalid response: Log error, show generic message

**Dashboard Errors:**
- Failed to load stats: Show error card with retry button
- Failed to generate words: Toast notification with error
- Failed to start quiz: Inline error message

### Backend Error Handling

**Chat Command Errors:**
- Database errors: Log and return user-friendly message
- Groq API errors: Parse error response and return specific message
- Missing API key: Return specific error code
- Timeout: Cancel request and return timeout error

**Error Response Format:**
```rust
#[derive(Serialize)]
struct ErrorResponse {
    code: String,
    message: String,
    details: Option<String>,
}
```

### Retry Logic

**Chat Messages:**
- Automatic retry on network errors (max 2 retries)
- Exponential backoff: 1s, 2s
- User-initiated retry for failed messages

**Dashboard Data:**
- No automatic retry
- User can manually refresh

## Testing Strategy

### Unit Tests

**Frontend:**
- ChatStore actions and state updates
- Message formatting and RTL detection
- Dashboard stat calculations
- Component rendering with various props

**Backend:**
- Chat message CRUD operations
- Session management
- AI service request formatting
- Database query correctness

### Integration Tests

**Chat Flow:**
1. User sends message
2. Message saved to database
3. AI response generated
4. Response saved and displayed

**Word Context Flow:**
1. User clicks "Explain with AI" on word
2. Navigate to chat with word context
3. AI generates explanation
4. Explanation displayed and saved

**Dashboard Data:**
1. Fetch all dashboard data
2. Verify aggregations are correct
3. Test with empty state
4. Test with full data

### End-to-End Tests

**User Scenarios:**
1. New user opens app → sees AI chat
2. User sends first message → receives response
3. User navigates to dashboard → sees stats
4. User generates words → words appear in dashboard
5. User clicks word → explains in AI chat
6. User clears chat history → messages removed

### Performance Tests

**Chat:**
- Load 100+ messages: < 2s
- Send message: < 500ms (excluding AI response)
- Scroll performance: 60fps with virtualization

**Dashboard:**
- Initial load: < 2s
- Stat updates: < 500ms
- Chart rendering: < 1s

## Implementation Notes

### RTL Support

Both chat and dashboard must support RTL languages (Arabic, Hebrew):
- Use `getTextDirection()` and `getContentDirection()` from `src/lib/rtl.ts`
- Apply `dir` attribute to message content
- Use `bidi-isolate` class for mixed-direction text
- Mirror UI elements appropriately (chat bubbles, icons)

### Responsive Design

**Chat Page:**
- Mobile: Full screen, fixed input at bottom
- Tablet/Desktop: Max width 800px, centered

**Dashboard:**
- Desktop: Grid layout, no scroll
- Tablet: 2-column grid, minimal scroll
- Mobile: Single column, vertical scroll

### Performance Optimizations

**Chat:**
- Virtualize message list with react-window
- Debounce input (300ms)
- Lazy load old messages (pagination)
- Cache AI responses

**Dashboard:**
- Memoize chart components
- Cache dashboard stats (5min TTL)
- Lazy load word review list
- Optimize database queries with indexes

### Accessibility

**Chat:**
- ARIA labels for input and send button
- Keyboard navigation (Tab, Enter)
- Screen reader announcements for new messages
- Focus management

**Dashboard:**
- Semantic HTML (sections, headings)
- ARIA labels for charts
- Keyboard navigation for word cards
- Color contrast compliance

### Security

**API Key:**
- Store encrypted in database
- Never expose in frontend logs
- Validate before API calls

**Input Sanitization:**
- Sanitize user messages before storage
- Escape HTML in chat display
- Validate word context IDs

**Rate Limiting:**
- Client-side: Max 10 messages per minute
- Backend: Respect Groq API limits
- Show friendly error on limit exceeded

## Migration Strategy

### Phase 1: Database Migration
1. Add chat_sessions and chat_messages tables
2. Run migration on app startup
3. Verify schema with tests

### Phase 2: Backend Implementation
1. Implement chat commands
2. Enhance Groq service for chat
3. Add database queries
4. Test with Postman/curl

### Phase 3: Frontend - Chat Page
1. Create ChatStore
2. Build chat components
3. Implement ChatPage
4. Test chat flow

### Phase 4: Frontend - Dashboard Enhancement
1. Move HomePage content to DashboardPage
2. Reorganize layout
3. Add "Explain with AI" buttons
4. Test navigation

### Phase 5: Integration
1. Connect word context to chat
2. Test full user flows
3. Performance optimization
4. Bug fixes

### Phase 6: Polish
1. Loading states
2. Error handling
3. Animations
4. Accessibility audit

## Dependencies

### New Dependencies

**Frontend:**
- `react-window` (^1.8.10): Message virtualization
- `react-markdown` (^9.0.1): Render AI responses with formatting
- `remark-gfm` (^4.0.0): GitHub Flavored Markdown support

**Backend:**
- No new dependencies (use existing reqwest, serde, rusqlite)

### Version Compatibility

- React 18.x
- Tauri 2.x
- Rust 1.70+
- Node 18+

## Open Questions

1. **Chat Session Management**: Should we support multiple chat sessions or just one continuous conversation?
   - **Decision**: Start with single session, add multi-session in future iteration

2. **Message Retention**: How long should we keep chat history?
   - **Decision**: Keep all messages, add "Clear History" button for user control

3. **AI Context Window**: How many previous messages should we send to AI?
   - **Decision**: Last 10 messages (5 exchanges) to stay within token limits

4. **Dashboard Scroll**: Should dashboard allow scroll on desktop or force no-scroll design?
   - **Decision**: No scroll on desktop (>1024px), allow scroll on smaller screens

5. **Word Explanation Format**: Should AI explanations follow a specific template?
   - **Decision**: Yes, use structured prompt to ensure consistent format (definition, examples, usage notes)
