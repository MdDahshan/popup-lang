use serde::{Deserialize, Serialize};
use std::fmt;

/// Type-safe chat role enum
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ChatRole {
    User,
    Assistant,
    System,
}

impl ChatRole {
    /// Parse a role string from the database
    pub fn from_str_checked(s: &str) -> Result<Self, String> {
        match s {
            "user" => Ok(ChatRole::User),
            "assistant" => Ok(ChatRole::Assistant),
            "system" => Ok(ChatRole::System),
            _ => Err(format!("Invalid role: '{}'. Must be 'user', 'assistant', or 'system'", s)),
        }
    }

    /// Get the string representation for DB storage
    pub fn as_str(&self) -> &'static str {
        match self {
            ChatRole::User => "user",
            ChatRole::Assistant => "assistant",
            ChatRole::System => "system",
        }
    }
}

impl fmt::Display for ChatRole {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.as_str())
    }
}

/// Represents a chat session for a user
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatSession {
    pub id: i64,
    pub user_id: i64,
    pub title: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

/// Represents a single message in a chat conversation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub id: i64,
    pub session_id: i64,
    pub role: String,
    pub content: String,
    pub word_context_id: Option<i64>,
    pub created_at: String,
}

/// User context information for AI prompts
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserContext {
    pub target_language: String,
    pub native_language: String,
    pub level: String,
    pub interests: Vec<String>,
}

/// Word context for AI explanations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WordContext {
    pub word_id: i64,
    pub word_text: String,
    pub translation: String,
    pub pronunciation: String,
    pub explanation: Option<String>,
    pub word_type: Option<String>,
    pub examples: Option<Vec<String>>,
}
