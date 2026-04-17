use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: i64,
    pub native_language: String,
    pub target_language: String,
    pub level: String,
    pub daily_word_count: i32,
    pub reminder_enabled: bool,
    pub interests: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Word {
    pub id: i64,
    pub word_text: String,
    pub target_language: String,
    pub translation: String,
    pub pronunciation: String,
    pub explanation: String,
    pub examples: Vec<String>,
    pub word_type: String,
    pub difficulty_score: f64,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DailyWordSet {
    pub id: i64,
    pub user_id: i64,
    pub date: String,
    pub status: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DailyWord {
    pub id: i64,
    pub set_id: i64,
    pub word_id: i64,
    pub order_index: i32,
    pub review_priority: f64,
    pub learned: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuizAttempt {
    pub id: i64,
    pub user_id: i64,
    pub word_id: i64,
    pub question_type: String,
    pub user_answer: String,
    pub is_correct: bool,
    pub ai_feedback: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DashboardStats {
    pub total_words_learned: i64,
    pub today_completed: i64,
    pub today_total: i64,
    pub weekly_activity: Vec<i64>,
    pub accuracy_rate: f64,
    pub streak_count: i64,
    pub hardest_words: Vec<Word>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub api_key: Option<String>,
    pub reminder_interval_minutes: i32,
    pub theme: String,
}

// Request/response types for AI
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerateWordsRequest {
    pub target_language: String,
    pub native_language: String,
    pub level: String,
    pub count: i32,
    pub interests: Vec<String>,
    pub exclude_words: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WordExplanation {
    pub word_text: String,
    pub translation: String,
    pub pronunciation: String,
    pub explanation: String,
    pub examples: Vec<String>,
    pub word_type: String,
    pub difficulty_score: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuizQuestion {
    pub word_id: i64,
    pub question_type: String,
    pub prompt: String,
    pub options: Option<Vec<String>>,
    pub correct_answer: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnswerFeedback {
    pub is_correct: bool,
    pub correct_answer: String,
    pub explanation: String,
    pub extra_examples: Vec<String>,
    pub encouragement: String,
}
