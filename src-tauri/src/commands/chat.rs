use tauri::State;
use crate::db::Database;
use crate::db::queries;
use crate::models::chat::{ChatMessage, ChatSession, UserContext, WordContext};
use crate::services::groq::{self, ChatHistoryMessage};

/// Maximum number of messages to include in AI context (5 exchanges = 10 messages)
const MAX_CHAT_HISTORY_MESSAGES: usize = 10;

fn get_active_session_id(conn: &rusqlite::Connection, user_id: i64) -> Result<i64, String> {
    let saved_active_session_id = queries::get_setting(conn, "active_chat_session_id")?
        .and_then(|value| value.parse::<i64>().ok());

    if let Some(session_id) = saved_active_session_id {
        if let Some(session) = queries::get_chat_session_by_id(conn, session_id)? {
            if session.user_id == user_id {
                return Ok(session_id);
            }
        }
    }

    let session_id = match queries::get_chat_session_by_user(conn, user_id)? {
        Some(session) => session.id,
        None => queries::create_chat_session(conn, user_id, Some("New Chat"))?,
    };

    queries::set_setting(conn, "active_chat_session_id", &session_id.to_string())?;
    Ok(session_id)
}

/// Verify that a session belongs to the given user, returning the session if valid
fn verify_session_ownership(
    conn: &rusqlite::Connection,
    session_id: i64,
    user_id: i64,
) -> Result<ChatSession, String> {
    let session = queries::get_chat_session_by_id(conn, session_id)?
        .ok_or_else(|| format!("Session {} not found", session_id))?;
    if session.user_id != user_id {
        return Err("Session does not belong to current user".to_string());
    }
    Ok(session)
}

/// Send a chat message and get AI response
#[tauri::command]
pub async fn send_chat_message(
    db: State<'_, Database>,
    content: String,
    word_context_id: Option<i64>,
    session_id: Option<i64>,
) -> Result<ChatMessage, String> {
    // Phase 1: All pre-API database work in a single lock
    let (resolved_session_id, messages, user_context, word_context, api_key) = {
        let conn = db.conn.lock().map_err(|e| e.to_string())?;

        let user = queries::get_user(&conn)?
            .ok_or_else(|| "User not found. Please complete onboarding first.".to_string())?;

        let resolved_session_id = match session_id {
            Some(id) => {
                verify_session_ownership(&conn, id, user.id)?;
                id
            }
            None => get_active_session_id(&conn, user.id)?,
        };

        queries::set_setting(&conn, "active_chat_session_id", &resolved_session_id.to_string())?;

        // Save user message to database
        queries::insert_chat_message(&conn, resolved_session_id, "user", &content, word_context_id)?;

        // Get conversation history for AI context
        let chat_messages = queries::get_chat_messages_by_session(&conn, resolved_session_id)?;

        // Convert to AI format (last N messages)
        let messages: Vec<ChatHistoryMessage> = chat_messages
            .iter()
            .rev()
            .take(MAX_CHAT_HISTORY_MESSAGES)
            .rev()
            .map(|msg| ChatHistoryMessage {
                role: msg.role.clone(),
                content: msg.content.clone(),
            })
            .collect();

        // Build user context
        let user_context = UserContext {
            target_language: user.target_language.clone(),
            native_language: user.native_language.clone(),
            level: user.level.clone(),
            interests: user.interests.clone(),
        };

        // Get word context if provided
        let word_context = if let Some(word_id) = word_context_id {
            let word = queries::get_word_by_id(&conn, word_id)?
                .ok_or_else(|| format!("Word with id {} not found", word_id))?;

            Some(WordContext {
                word_id: word.id,
                word_text: word.word_text,
                translation: word.translation,
                pronunciation: word.pronunciation,
                explanation: Some(word.explanation),
                word_type: Some(word.word_type),
                examples: Some(word.examples),
            })
        } else {
            None
        };

        // Get API key
        let api_key = queries::get_setting(&conn, "groq_api_key")?
            .ok_or_else(|| "API key not configured. Please set your Groq API key in settings.".to_string())?;

        (resolved_session_id, messages, user_context, word_context, api_key)
    };

    // Phase 2: Async API call (no lock held)
    let ai_response = groq::chat_completion(
        &api_key,
        messages,
        &user_context,
        word_context.as_ref(),
    ).await?;

    // Phase 3: Save AI response and read back from DB (single lock)
    let assistant_message = {
        let conn = db.conn.lock().map_err(|e| e.to_string())?;
        let message_id = queries::insert_chat_message(&conn, resolved_session_id, "assistant", &ai_response, None)?;

        // Read the message back from DB to get the real created_at timestamp
        queries::get_chat_message_by_id(&conn, message_id)?
            .ok_or_else(|| "Failed to retrieve saved assistant message".to_string())?
    };

    Ok(assistant_message)
}

/// Get all chat messages for a session
#[tauri::command]
pub fn get_chat_messages(
    db: State<'_, Database>,
    session_id: Option<i64>,
) -> Result<Vec<ChatMessage>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let user = queries::get_user(&conn)?
        .ok_or_else(|| "User not found. Please complete onboarding first.".to_string())?;

    let session_id = match session_id {
        Some(id) => {
            verify_session_ownership(&conn, id, user.id)?;
            id
        }
        None => get_active_session_id(&conn, user.id)?,
    };

    queries::get_chat_messages_by_session(&conn, session_id)
}

/// Clear all chat history for a session
#[tauri::command]
pub fn clear_chat_history(
    db: State<'_, Database>,
    session_id: Option<i64>,
) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let user = queries::get_user(&conn)?
        .ok_or_else(|| "User not found. Please complete onboarding first.".to_string())?;

    let session_id = match session_id {
        Some(id) => {
            verify_session_ownership(&conn, id, user.id)?;
            id
        }
        None => get_active_session_id(&conn, user.id)?,
    };

    queries::delete_chat_messages_by_session(&conn, session_id)?;
    Ok(())
}

/// Get or create a chat session for the current user
#[tauri::command]
pub fn get_or_create_session(
    db: State<'_, Database>,
    session_id: Option<i64>,
) -> Result<i64, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let user = queries::get_user(&conn)?
        .ok_or_else(|| "User not found. Please complete onboarding first.".to_string())?;

    let session_id = match session_id {
        Some(id) => {
            verify_session_ownership(&conn, id, user.id)?;
            id
        }
        None => get_active_session_id(&conn, user.id)?,
    };

    queries::set_setting(&conn, "active_chat_session_id", &session_id.to_string())?;
    Ok(session_id)
}

#[tauri::command]
pub fn get_chat_sessions(db: State<'_, Database>) -> Result<Vec<ChatSession>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let user = queries::get_user(&conn)?
        .ok_or_else(|| "User not found. Please complete onboarding first.".to_string())?;

    let sessions = queries::get_chat_sessions_by_user(&conn, user.id)?;
    if sessions.is_empty() {
        let session_id = queries::create_chat_session(&conn, user.id, Some("New Chat"))?;
        queries::set_setting(&conn, "active_chat_session_id", &session_id.to_string())?;
        return queries::get_chat_sessions_by_user(&conn, user.id);
    }

    Ok(sessions)
}

#[tauri::command]
pub fn create_chat_session(
    db: State<'_, Database>,
    title: Option<String>,
) -> Result<ChatSession, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let user = queries::get_user(&conn)?
        .ok_or_else(|| "User not found. Please complete onboarding first.".to_string())?;

    let session_id = queries::create_chat_session(&conn, user.id, title.as_deref().or(Some("New Chat")))?;
    queries::set_setting(&conn, "active_chat_session_id", &session_id.to_string())?;
    queries::get_chat_session_by_id(&conn, session_id)?.ok_or_else(|| "Failed to create chat session".to_string())
}

#[tauri::command]
pub fn set_active_chat_session(
    db: State<'_, Database>,
    session_id: i64,
) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let user = queries::get_user(&conn)?
        .ok_or_else(|| "User not found. Please complete onboarding first.".to_string())?;

    // Verify ownership before setting active
    verify_session_ownership(&conn, session_id, user.id)?;

    queries::set_setting(&conn, "active_chat_session_id", &session_id.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn rename_chat_session(
    db: State<'_, Database>,
    session_id: i64,
    title: String,
) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let user = queries::get_user(&conn)?
        .ok_or_else(|| "User not found. Please complete onboarding first.".to_string())?;

    // Verify ownership before renaming
    verify_session_ownership(&conn, session_id, user.id)?;

    queries::rename_chat_session(&conn, session_id, &title)?;
    Ok(())
}

#[tauri::command]
pub fn delete_chat_session(
    db: State<'_, Database>,
    session_id: i64,
) -> Result<Option<i64>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let user = queries::get_user(&conn)?
        .ok_or_else(|| "User not found. Please complete onboarding first.".to_string())?;

    // Verify ownership before deleting
    verify_session_ownership(&conn, session_id, user.id)?;

    // Messages are cascade-deleted by the DB, but explicitly delete for safety
    queries::delete_chat_messages_by_session(&conn, session_id)?;
    queries::delete_chat_session(&conn, session_id)?;

    // Set next available session as active
    let next_session_id = queries::get_chat_session_by_user(&conn, user.id)?.map(|s| s.id);
    if let Some(id) = next_session_id {
        queries::set_setting(&conn, "active_chat_session_id", &id.to_string())?;
    }
    Ok(next_session_id)
}


#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::{migrations::run_migrations, queries};
    use rusqlite::Connection;
    use std::sync::Mutex;

    fn setup_test_db() -> Database {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute("PRAGMA foreign_keys = ON", []).unwrap();
        run_migrations(&conn).unwrap();
        
        // Insert a test user
        conn.execute(
            "INSERT INTO users (native_language, target_language, level) VALUES (?, ?, ?)",
            ["English", "Arabic", "beginner"],
        )
        .unwrap();
        
        // Insert test interests
        let user_id = conn.last_insert_rowid();
        conn.execute(
            "INSERT INTO user_interests (user_id, interest) VALUES (?, ?)",
            [&user_id as &dyn rusqlite::ToSql, &"technology" as &dyn rusqlite::ToSql],
        )
        .unwrap();
        
        // Set API key (dummy for testing)
        conn.execute(
            "INSERT INTO app_settings (key, value) VALUES (?, ?)",
            ["groq_api_key", "test_api_key"],
        )
        .unwrap();
        
        Database {
            conn: Mutex::new(conn),
        }
    }

    #[test]
    fn test_session_creation_and_retrieval() {
        let db = setup_test_db();
        let conn = db.conn.lock().unwrap();
        
        // Get user
        let user = queries::get_user(&conn).unwrap().unwrap();
        
        // First call should create a session
        let session_id1 = match queries::get_chat_session_by_user(&conn, user.id).unwrap() {
            Some(session) => session.id,
            None => queries::create_chat_session(&conn, user.id, None).unwrap(),
        };
        assert!(session_id1 > 0, "Session ID should be positive");
        
        // Second call should return the same session
        let session_id2 = match queries::get_chat_session_by_user(&conn, user.id).unwrap() {
            Some(session) => session.id,
            None => queries::create_chat_session(&conn, user.id, None).unwrap(),
        };
        assert_eq!(session_id1, session_id2, "Should return the same session ID");
    }

    #[test]
    fn test_message_retrieval_empty() {
        let db = setup_test_db();
        let conn = db.conn.lock().unwrap();
        
        // Get user and create session
        let user = queries::get_user(&conn).unwrap().unwrap();
        let session_id = queries::create_chat_session(&conn, user.id, None).unwrap();
        
        // Get messages from empty session
        let messages = queries::get_chat_messages_by_session(&conn, session_id).unwrap();
        assert_eq!(messages.len(), 0, "Should return empty vector for new session");
    }

    #[test]
    fn test_clear_history() {
        let db = setup_test_db();
        let conn = db.conn.lock().unwrap();
        
        // Get user and create session
        let user = queries::get_user(&conn).unwrap().unwrap();
        let session_id = queries::create_chat_session(&conn, user.id, None).unwrap();
        queries::insert_chat_message(&conn, session_id, "user", "Test message", None).unwrap();
        
        // Verify message exists
        let messages = queries::get_chat_messages_by_session(&conn, session_id).unwrap();
        assert_eq!(messages.len(), 1, "Should have 1 message");
        
        // Clear history
        queries::delete_chat_messages_by_session(&conn, session_id).unwrap();
        
        // Verify messages were cleared
        let messages = queries::get_chat_messages_by_session(&conn, session_id).unwrap();
        assert_eq!(messages.len(), 0, "Should have 0 messages after clearing");
    }

    #[test]
    fn test_messages_with_word_context() {
        let db = setup_test_db();
        let conn = db.conn.lock().unwrap();
        
        // Create a word
        conn.execute(
            "INSERT INTO words (word_text, target_language, translation, pronunciation) VALUES (?, ?, ?, ?)",
            ["مرحبا", "Arabic", "Hello", "marhaba"],
        )
        .unwrap();
        let word_id = conn.last_insert_rowid();
        
        // Get user and create session
        let user = queries::get_user(&conn).unwrap().unwrap();
        let session_id = queries::create_chat_session(&conn, user.id, None).unwrap();
        queries::insert_chat_message(&conn, session_id, "user", "Explain this word", Some(word_id)).unwrap();
        
        // Get messages
        let messages = queries::get_chat_messages_by_session(&conn, session_id).unwrap();
        assert_eq!(messages.len(), 1);
        assert_eq!(messages[0].word_context_id, Some(word_id));
    }

    #[test]
    fn test_user_context_building() {
        let db = setup_test_db();
        let conn = db.conn.lock().unwrap();
        
        // Get user
        let user = queries::get_user(&conn).unwrap().unwrap();
        
        // Build user context
        let user_context = UserContext {
            target_language: user.target_language.clone(),
            native_language: user.native_language.clone(),
            level: user.level.clone(),
            interests: user.interests.clone(),
        };
        
        assert_eq!(user_context.target_language, "Arabic");
        assert_eq!(user_context.native_language, "English");
        assert_eq!(user_context.level, "beginner");
        assert_eq!(user_context.interests, vec!["technology"]);
    }

    #[test]
    fn test_word_context_building() {
        let db = setup_test_db();
        let conn = db.conn.lock().unwrap();
        
        // Create a word with all required fields
        conn.execute(
            "INSERT INTO words (word_text, target_language, translation, pronunciation, explanation, examples_json, word_type, difficulty_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            rusqlite::params!["مرحبا", "Arabic", "Hello", "marhaba", "A greeting", "[]", "noun", 0.5],
        )
        .unwrap();
        let word_id = conn.last_insert_rowid();
        
        // Get word
        let word = queries::get_word_by_id(&conn, word_id).unwrap().unwrap();
        
        // Build word context
        let word_context = WordContext {
            word_id: word.id,
            word_text: word.word_text.clone(),
            translation: word.translation.clone(),
            pronunciation: word.pronunciation.clone(),
            explanation: Some(word.explanation.clone()),
            word_type: Some(word.word_type.clone()),
            examples: Some(word.examples.clone()),
        };
        
        assert_eq!(word_context.word_text, "مرحبا");
        assert_eq!(word_context.translation, "Hello");
        assert_eq!(word_context.pronunciation, "marhaba");
        assert_eq!(word_context.explanation, Some("A greeting".to_string()));
        assert_eq!(word_context.word_type, Some("noun".to_string()));
    }

    #[test]
    fn test_session_ownership_validation() {
        let db = setup_test_db();
        let conn = db.conn.lock().unwrap();

        let user = queries::get_user(&conn).unwrap().unwrap();
        let session_id = queries::create_chat_session(&conn, user.id, Some("My Session")).unwrap();

        // Ownership check should pass for the correct user
        let result = verify_session_ownership(&conn, session_id, user.id);
        assert!(result.is_ok(), "Should pass ownership check for correct user");

        // Ownership check should fail for a different user
        let result = verify_session_ownership(&conn, session_id, user.id + 999);
        assert!(result.is_err(), "Should fail ownership check for wrong user");
    }

    #[test]
    fn test_nonexistent_session_ownership() {
        let db = setup_test_db();
        let conn = db.conn.lock().unwrap();

        let user = queries::get_user(&conn).unwrap().unwrap();

        // Ownership check should fail for nonexistent session
        let result = verify_session_ownership(&conn, 99999, user.id);
        assert!(result.is_err(), "Should fail for nonexistent session");
    }

    #[test]
    fn test_message_id_correctness() {
        let db = setup_test_db();
        let conn = db.conn.lock().unwrap();

        let user = queries::get_user(&conn).unwrap().unwrap();
        let session_id = queries::create_chat_session(&conn, user.id, Some("Test")).unwrap();

        // Insert a message and verify the returned ID matches
        let msg_id = queries::insert_chat_message(&conn, session_id, "user", "Hello", None).unwrap();
        let msg = queries::get_chat_message_by_id(&conn, msg_id).unwrap().unwrap();
        assert_eq!(msg.id, msg_id);
        assert_eq!(msg.content, "Hello");
        assert_eq!(msg.role, "user");
    }
}
