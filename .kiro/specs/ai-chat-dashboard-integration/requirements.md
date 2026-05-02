# Requirements Document

## Introduction

This feature reorganizes the application's main pages by moving the current Home page content (daily words, progress, quick actions) to the Dashboard page, and replacing the Home page with an AI-powered chat assistant. The goal is to provide users with immediate access to an AI tutor on the home page, while consolidating all learning statistics and word management into a comprehensive Dashboard.

## Glossary

- **AI_Chat_Page**: The new Home page (/) containing only the AI chat interface
- **Enhanced_Dashboard**: The Dashboard page (/dashboard) containing both old Home content and old Dashboard content
- **Daily_Words_Section**: Section showing today's words with progress (moved from Home to Dashboard)
- **Quick_Actions_Section**: Section with buttons for generating words, starting quiz (moved from Home to Dashboard)
- **Statistics_Section**: Section showing learning metrics (Total Words, Accuracy, Streak, Today's Progress)
- **Weekly_Activity_Chart**: Visual representation of learning activity over the past 7 days
- **Words_Review_List**: List of words that need review based on performance
- **Chat_Message**: A single message in the conversation (user or AI)
- **Chat_History**: The persistent record of all conversations between user and AI
- **Word_Context**: Information about a specific word sent to AI for explanation
- **RTL_Support**: Right-to-left text direction support for languages like Arabic and Hebrew
- **LTR_Support**: Left-to-right text direction support for languages like English and Spanish

## Requirements

### Requirement 1: New Home Page with AI Chat

**User Story:** As a language learner, I want the home page to be an AI chat interface, so that I can immediately get help with language learning when I open the app.

#### Acceptance Criteria

1. THE AI_Chat_Page SHALL be accessible at the root route (/)
2. THE AI_Chat_Page SHALL display only the AI chat interface without any dashboard elements
3. THE AI_Chat_Page SHALL occupy the full available content area
4. THE AI_Chat_Page SHALL provide an input field for user to type messages
5. THE AI_Chat_Page SHALL display conversation history with user and AI messages
6. THE AI_Chat_Page SHALL support RTL and LTR text direction based on message content

### Requirement 2: Enhanced Dashboard Page

**User Story:** As a language learner, I want all my learning statistics and daily words in one dashboard page, so that I can manage my learning activities in a centralized location.

#### Acceptance Criteria

1. THE Enhanced_Dashboard SHALL be accessible at the /dashboard route
2. THE Enhanced_Dashboard SHALL display Daily_Words_Section with today's words and progress (content from old Home page)
3. THE Enhanced_Dashboard SHALL display Quick_Actions_Section with buttons for generating words, starting quiz, and refreshing words
4. THE Enhanced_Dashboard SHALL display Statistics_Section with learning metrics (Total Words, Accuracy, Streak, Today's Progress)
5. THE Enhanced_Dashboard SHALL display Weekly_Activity_Chart showing words learned per day
6. THE Enhanced_Dashboard SHALL display Words_Review_List showing words that need review
7. THE Enhanced_Dashboard SHALL organize all sections in a cohesive layout without scrolling

### Requirement 3: AI Chat Functionality

**User Story:** As a language learner, I want to chat with an AI tutor, so that I can get explanations, practice conversation, and ask questions about the language.

#### Acceptance Criteria

1. THE AI_Chat_Page SHALL display a conversation interface with message history
2. WHEN user submits a message, THE AI_Chat_Page SHALL send the message to the AI service and display the response
3. THE AI_Chat_Page SHALL display user messages and AI responses with distinct visual styling
4. THE AI_Chat_Page SHALL show a loading indicator while waiting for AI response
5. THE AI_Chat_Page SHALL scroll automatically to show the latest message
6. THE AI_Chat_Page SHALL support explaining words and grammar concepts
7. THE AI_Chat_Page SHALL support conversation practice in the target language
8. THE AI_Chat_Page SHALL correct user mistakes and provide constructive feedback

### Requirement 4: Chat History Persistence

**User Story:** As a language learner, I want my chat conversations to be saved, so that I can review previous explanations and conversations.

#### Acceptance Criteria

1. THE AI_Chat_Page SHALL save all Chat_Message entries to Chat_History
2. WHEN user opens the AI_Chat_Page, THE system SHALL load and display Chat_History
3. THE Chat_History SHALL persist across application sessions
4. THE AI_Chat_Page SHALL provide a way to clear Chat_History
5. THE Chat_History SHALL store message timestamp, sender, and content
6. THE Chat_History SHALL be associated with the current user account

### Requirement 5: Word Context Integration

**User Story:** As a language learner, I want to send a word from my daily list to the AI for detailed explanation, so that I can understand it better.

#### Acceptance Criteria

1. THE Daily_Words_Section in Enhanced_Dashboard SHALL display an action button on each word entry
2. WHEN user clicks the action button on a word, THE system SHALL navigate to AI_Chat_Page with Word_Context
3. WHEN Word_Context is received, THE AI_Chat_Page SHALL generate a detailed explanation including definition, usage examples, and related words
4. THE AI_Chat_Page SHALL format word explanations with clear structure and examples
5. THE AI_Chat_Page SHALL support follow-up questions about the explained word

### Requirement 6: AI Service Integration

**User Story:** As a developer, I want to integrate the AI chat with the existing Groq service, so that we can leverage the same AI infrastructure for chat functionality.

#### Acceptance Criteria

1. THE AI_Chat_Page SHALL use the existing Groq API service for generating responses
2. THE AI_Chat_Page SHALL include user's target language, native language, and proficiency level in AI requests
3. THE AI_Chat_Page SHALL handle API rate limits gracefully
4. IF the Groq API key is not configured, THEN THE AI_Chat_Page SHALL display a message prompting user to configure it in settings
5. THE AI_Chat_Page SHALL implement retry logic for transient API failures
6. THE AI_Chat_Page SHALL timeout requests after 30 seconds

### Requirement 7: Navigation Updates

**User Story:** As a language learner, I want clear navigation between the AI chat and my dashboard, so that I can easily switch between getting help and managing my learning.

#### Acceptance Criteria

1. THE AppShell navigation SHALL keep Home (/) route pointing to AI_Chat_Page
2. THE AppShell navigation SHALL keep Dashboard (/dashboard) route pointing to Enhanced_Dashboard
3. THE AppShell navigation SHALL update icons and labels to reflect new page purposes
4. WHEN user navigates between pages, THE system SHALL preserve the state of each page
5. THE AppShell navigation SHALL highlight the active page

### Requirement 8: Dashboard Layout Organization

**User Story:** As a language learner, I want the dashboard to be well-organized and fit on one screen, so that I can see all my learning information at a glance.

#### Acceptance Criteria

1. THE Enhanced_Dashboard SHALL organize content in a grid layout without vertical scrolling
2. THE Enhanced_Dashboard SHALL display Statistics_Section in the top row with 4 metric cards
3. THE Enhanced_Dashboard SHALL display Daily_Words_Section and Quick_Actions_Section in the middle area
4. THE Enhanced_Dashboard SHALL display Weekly_Activity_Chart and Words_Review_List in the bottom row
5. THE Enhanced_Dashboard SHALL adapt layout for different screen sizes while maintaining no-scroll design
6. THE Enhanced_Dashboard SHALL use consistent spacing and visual hierarchy

### Requirement 9: Responsive Design

**User Story:** As a language learner using different devices, I want both pages to adapt to my screen size, so that I can use them comfortably on any device.

#### Acceptance Criteria

1. WHEN screen width is below 768px, THE Enhanced_Dashboard SHALL adjust grid layout to stack sections vertically
2. WHEN screen width is below 768px, THE Enhanced_Dashboard MAY allow vertical scrolling
3. THE AI_Chat_Page SHALL maintain full-height layout on all screen sizes
4. THE AI_Chat_Page SHALL adjust message width for optimal reading on different screen sizes
5. THE Enhanced_Dashboard charts SHALL scale appropriately for different screen sizes

### Requirement 10: Performance and User Experience

**User Story:** As a language learner, I want both pages to be fast and responsive, so that my learning flow is not interrupted.

#### Acceptance Criteria

1. THE AI_Chat_Page SHALL display user messages immediately without waiting for AI response
2. THE Enhanced_Dashboard SHALL update statistics within 500ms of data changes
3. THE AI_Chat_Page SHALL load initial content within 2 seconds
4. THE AI_Chat_Page SHALL implement message virtualization for conversations with more than 100 messages
5. THE Enhanced_Dashboard SHALL cache statistics to reduce database queries
6. THE AI_Chat_Page SHALL debounce user input to prevent excessive API calls
