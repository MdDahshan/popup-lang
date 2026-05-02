# Implementation Plan: AI Chat Dashboard Integration

## Overview

This implementation follows a phased migration strategy to reorganize the application's main pages. The Home page (/) will become an AI chat interface, while the Dashboard (/dashboard) will consolidate all learning statistics and daily word management. The implementation builds incrementally, starting with database schema, then backend services, followed by frontend components, and finally integration.

## Tasks

- [x] 1. Database schema migration for chat functionality
  - [x] 1.1 Create chat_sessions table with user association
    - Add table with id, user_id, title, created_at, updated_at columns
    - Add foreign key constraint to users table
    - Add index on user_id and updated_at for efficient queries
    - _Requirements: 4.1, 4.5, 4.6_
  
  - [x] 1.2 Create chat_messages table with session association
    - Add table with id, session_id, role, content, word_context_id, created_at columns
    - Add CHECK constraint for role (user, assistant, system)
    - Add foreign key constraints to chat_sessions and words tables
    - Add index on session_id and created_at for message retrieval
    - _Requirements: 4.1, 4.5_
  
  - [x] 1.3 Write database migration in migrations.rs
    - Implement migration function to create both tables
    - Add migration to run_migrations function
    - Handle migration errors gracefully
    - _Requirements: 4.1_

- [x] 2. Backend chat commands and AI service integration
  - [x] 2.1 Create chat models in src-tauri/src/models/chat.rs
    - Define ChatSession struct with Serialize/Deserialize
    - Define ChatMessage struct with Serialize/Deserialize
    - Define UserContext struct for AI prompts
    - Define WordContext struct for word explanations
    - _Requirements: 3.1, 4.5, 5.3, 6.2_
  
  - [x] 2.2 Implement chat database queries in src-tauri/src/db/queries.rs
    - Add create_chat_session function
    - Add get_chat_session_by_user function
    - Add insert_chat_message function
    - Add get_chat_messages_by_session function
    - Add delete_chat_messages_by_session function
    - _Requirements: 4.1, 4.2, 4.4_
  
  - [x] 2.3 Enhance Groq service for chat completion in src-tauri/src/services/groq.rs
    - Add chat_completion function accepting message history
    - Build system prompt with user's language learning context
    - Include word context in prompt when provided
    - Handle API errors and timeouts (30s)
    - Implement retry logic for transient failures
    - _Requirements: 3.2, 6.1, 6.2, 6.5, 6.6_
  
  - [x] 2.4 Create chat commands in src-tauri/src/commands/chat.rs
    - Implement send_chat_message command
    - Implement get_chat_messages command
    - Implement clear_chat_history command
    - Implement get_or_create_session command
    - Handle API key validation and error responses
    - _Requirements: 3.2, 4.2, 4.4, 6.4_
  
  - [x] 2.5 Register chat commands in lib.rs
    - Add chat module to commands
    - Register all chat commands in tauri::Builder
    - _Requirements: 3.2_

- [x] 3. Checkpoint - Verify backend implementation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Frontend chat store and state management
  - [x] 4.1 Create ChatStore in src/store/chatStore.ts
    - Define ChatState interface with messages, loading, error, sessionId
    - Implement fetchMessages action
    - Implement sendMessage action with word context support
    - Implement clearHistory action
    - Implement retryLastMessage action
    - Handle loading and error states
    - _Requirements: 3.2, 4.2, 4.4, 5.2_
  
  - [x] 4.2 Add chat types to src/types/index.ts
    - Define ChatSession interface
    - Define ChatMessage interface
    - Define WordContext interface
    - _Requirements: 4.5, 5.3_

- [ ] 5. Frontend chat UI components
  - [x] 5.1 Create ChatMessage component in src/components/chat/ChatMessage.tsx
    - Display message content with user/AI styling
    - Support RTL/LTR text direction detection using getContentDirection
    - Render markdown formatting for AI responses (react-markdown)
    - Show timestamp on hover
    - _Requirements: 1.6, 3.3, 3.5_
  
  - [x] 5.2 Create ChatInput component in src/components/chat/ChatInput.tsx
    - Implement auto-resize textarea (max 5 lines)
    - Add send button with loading state
    - Handle Enter to send, Shift+Enter for newline
    - Disable input during AI response
    - Debounce input (300ms)
    - _Requirements: 1.4, 3.2, 3.4, 10.6_
  
  - [x] 5.3 Create ChatMessageList component in src/components/chat/ChatMessageList.tsx
    - Render scrollable list of messages
    - Implement message virtualization with react-window for 100+ messages
    - Group messages by date
    - Show typing indicator when AI is responding
    - Auto-scroll to latest message
    - _Requirements: 3.1, 3.5, 10.4_
  
  - [x] 5.4 Create ChatPage in src/pages/ChatPage.tsx
    - Implement main container with header, message list, input area
    - Add clear history button in header
    - Manage scroll behavior
    - Handle word context from navigation state
    - Load chat history on mount
    - _Requirements: 1.1, 1.2, 1.3, 3.1, 4.2, 5.2_
  
  - [ ]* 5.5 Write unit tests for chat components
    - Test ChatMessage rendering with different props
    - Test ChatInput keyboard shortcuts and validation
    - Test ChatMessageList virtualization and scrolling
    - _Requirements: 3.3, 3.4, 3.5_

- [ ] 6. Enhanced Dashboard page implementation
  - [x] 6.1 Create DailyWordsSection component in src/components/dashboard/DailyWordsSection.tsx
    - Display today's word list with progress
    - Show word cards with learned status
    - Add "Explain with AI" button on each word
    - Handle click to navigate to word detail
    - Support RTL/LTR text direction
    - _Requirements: 2.2, 5.1, 5.2_
  
  - [x] 6.2 Create QuickActionsSection component in src/components/dashboard/QuickActionsSection.tsx
    - Add Generate Words button with loading state
    - Add Start Quiz button with loading state
    - Add Refresh Words button with loading state
    - Display error messages inline
    - _Requirements: 2.3_
  
  - [x] 6.3 Create DashboardStatsCards component in src/components/dashboard/DashboardStatsCards.tsx
    - Display four metric cards: Total Words, Accuracy, Streak, Today's Progress
    - Implement animated number transitions
    - Use consistent card styling
    - _Requirements: 2.4_
  
  - [x] 6.4 Create WeeklyActivityChart component in src/components/dashboard/WeeklyActivityChart.tsx
    - Implement bar chart with recharts library
    - Show words learned per day (7 days)
    - Make chart responsive
    - _Requirements: 2.5_
  
  - [x] 6.5 Create WordsReviewList component in src/components/dashboard/WordsReviewList.tsx
    - Display list of words needing review
    - Sort by priority based on quiz performance
    - Handle click to navigate to word detail
    - _Requirements: 2.6_
  
  - [x] 6.6 Refactor DashboardPage to integrate all sections
    - Reorganize layout with grid system (no vertical scroll on desktop)
    - Place Statistics_Section in top row (4 cards)
    - Place Daily_Words_Section and Quick_Actions_Section in middle area
    - Place Weekly_Activity_Chart and Words_Review_List in bottom row
    - Implement responsive layout for mobile/tablet
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 9.1, 9.2, 9.5_
  
  - [ ]* 6.7 Write unit tests for dashboard components
    - Test DailyWordsSection rendering and interactions
    - Test QuickActionsSection button states
    - Test DashboardStatsCards with various data
    - Test WeeklyActivityChart data formatting
    - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [x] 7. Checkpoint - Verify frontend components
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Routing and navigation updates
  - [x] 8.1 Update App.tsx routing configuration
    - Change HomePage route to render ChatPage at /
    - Keep DashboardPage route at /dashboard
    - Ensure all other routes remain unchanged
    - _Requirements: 1.1, 2.1, 7.1, 7.2_
  
  - [x] 8.2 Update AppShell navigation
    - Verify Home icon points to / (ChatPage)
    - Verify Dashboard icon points to /dashboard
    - Update tooltips if needed to reflect new page purposes
    - Ensure active page highlighting works correctly
    - _Requirements: 7.1, 7.2, 7.3, 7.5_

- [ ] 9. Word context integration and navigation
  - [x] 9.1 Add explainWordWithAI method to WordsStore
    - Implement navigation to ChatPage with word context
    - Pass word_id, word_text, translation, pronunciation
    - _Requirements: 5.1, 5.2_
  
  - [x] 9.2 Connect "Explain with AI" buttons in DailyWordsSection
    - Call explainWordWithAI when button clicked
    - Navigate to ChatPage with word context in state
    - _Requirements: 5.2_
  
  - [x] 9.3 Handle word context in ChatPage
    - Check for word context in navigation state on mount
    - Auto-generate AI explanation when word context present
    - Display word card before explanation
    - Support follow-up questions about the word
    - _Requirements: 5.2, 5.3, 5.4, 5.5_
  
  - [ ]* 9.4 Write integration tests for word context flow
    - Test navigation from dashboard to chat with word context
    - Test AI explanation generation
    - Test follow-up question handling
    - _Requirements: 5.2, 5.3, 5.5_

- [ ] 10. Error handling and edge cases
  - [x] 10.1 Implement API key validation in ChatPage
    - Check if Groq API key is configured on mount
    - Display message with link to settings if not configured
    - _Requirements: 6.4_
  
  - [x] 10.2 Add error handling for chat operations
    - Handle network timeout errors (30s) with retry button
    - Handle rate limit errors with friendly message
    - Handle invalid response errors with generic message
    - Log errors for debugging
    - _Requirements: 6.3, 6.5, 6.6_
  
  - [x] 10.3 Add error handling for dashboard operations
    - Handle failed stats loading with error card and retry button
    - Handle failed word generation with toast notification
    - Handle failed quiz start with inline error message
    - _Requirements: 2.2, 2.3_

- [ ] 11. Performance optimizations
  - [x] 11.1 Implement message virtualization in ChatMessageList
    - Use react-window for lists with 100+ messages
    - Configure proper item size and overscan
    - Test scroll performance
    - _Requirements: 10.4_
  
  - [x] 11.2 Add caching for dashboard statistics
    - Implement 5-minute TTL cache for dashboard stats
    - Invalidate cache on relevant data changes
    - _Requirements: 10.5_
  
  - [x] 11.3 Optimize dashboard database queries
    - Verify indexes are used for all queries
    - Test query performance with large datasets
    - _Requirements: 10.5_
  
  - [x] 11.4 Implement immediate UI updates for chat
    - Display user messages immediately without waiting for AI
    - Show loading indicator for AI response
    - _Requirements: 10.1_
  
  - [x] 11.5 Optimize dashboard update performance
    - Ensure statistics update within 500ms of data changes
    - Memoize chart components to prevent unnecessary re-renders
    - _Requirements: 10.2, 10.5_

- [ ] 12. Responsive design and accessibility
  - [x] 12.1 Implement responsive layout for ChatPage
    - Test full-height layout on all screen sizes
    - Adjust message width for optimal reading
    - Ensure input area is accessible on mobile
    - _Requirements: 9.3, 9.4_
  
  - [x] 12.2 Implement responsive layout for Enhanced Dashboard
    - Test grid layout on desktop (no scroll)
    - Adjust to 2-column grid on tablet
    - Stack sections vertically on mobile with scroll
    - Test chart scaling on different screen sizes
    - _Requirements: 9.1, 9.2, 9.5_
  
  - [x] 12.3 Add accessibility features to ChatPage
    - Add ARIA labels for input and send button
    - Implement keyboard navigation (Tab, Enter)
    - Add screen reader announcements for new messages
    - Manage focus appropriately
    - _Requirements: 1.4, 3.2_
  
  - [x] 12.4 Add accessibility features to Enhanced Dashboard
    - Use semantic HTML (sections, headings)
    - Add ARIA labels for charts
    - Implement keyboard navigation for word cards
    - Ensure color contrast compliance
    - _Requirements: 2.1, 2.2_

- [x] 13. Install required dependencies
  - [x] 13.1 Install frontend dependencies
    - Install react-window (^1.8.10) for message virtualization
    - Install react-markdown (^9.0.1) for AI response formatting
    - Install remark-gfm (^4.0.0) for markdown support
    - _Requirements: 3.3, 10.4_

- [ ] 14. Final integration and testing
  - [ ] 14.1 Test complete user flow: new user opens app
    - Verify new user sees ChatPage at /
    - Test sending first message and receiving response
    - Verify message persistence across sessions
    - _Requirements: 1.1, 3.2, 4.2_
  
  - [ ] 14.2 Test complete user flow: dashboard usage
    - Navigate to dashboard and verify all sections display
    - Test generating words and starting quiz
    - Verify statistics update correctly
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  
  - [ ] 14.3 Test complete user flow: word explanation
    - Click "Explain with AI" on a word in dashboard
    - Verify navigation to ChatPage with word context
    - Verify AI generates explanation
    - Test follow-up questions
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [ ] 14.4 Test complete user flow: chat history management
    - Send multiple messages and verify persistence
    - Close and reopen app, verify history loads
    - Clear chat history and verify messages removed
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [ ]* 14.5 Write end-to-end integration tests
    - Test full chat flow from user input to AI response
    - Test dashboard data loading and updates
    - Test word context integration
    - Test navigation between pages
    - _Requirements: 1.1, 2.1, 3.2, 5.2, 7.4_

- [ ] 15. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Implementation follows the phased migration strategy from the design document
- The design uses TypeScript for frontend and Rust for backend
- No property-based tests are included as the design does not define correctness properties
