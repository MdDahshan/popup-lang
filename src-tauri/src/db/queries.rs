use rusqlite::{params, Connection};
use crate::models::*;

// ─── User queries ───

pub fn get_user(conn: &Connection) -> Result<Option<User>, String> {
    let mut stmt = conn
        .prepare("SELECT id, native_language, target_language, level, daily_word_count, reminder_enabled, created_at, updated_at FROM users LIMIT 1")
        .map_err(|e| e.to_string())?;

    let user = stmt
        .query_row([], |row| {
            Ok(User {
                id: row.get(0)?,
                native_language: row.get(1)?,
                target_language: row.get(2)?,
                level: row.get(3)?,
                daily_word_count: row.get(4)?,
                reminder_enabled: row.get::<_, i32>(5)? == 1,
                interests: Vec::new(),
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })
        .ok();

    if let Some(mut user) = user {
        let mut stmt = conn
            .prepare("SELECT interest FROM user_interests WHERE user_id = ?1")
            .map_err(|e| e.to_string())?;
        let interests: Vec<String> = stmt
            .query_map(params![user.id], |row| row.get(0))
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();
        user.interests = interests;
        Ok(Some(user))
    } else {
        Ok(None)
    }
}

pub fn save_user(conn: &Connection, user: &User) -> Result<i64, String> {
    // Check if user exists
    let exists: bool = conn
        .query_row("SELECT COUNT(*) FROM users", [], |row| row.get::<_, i64>(0))
        .map_err(|e| e.to_string())?
        > 0;

    let user_id = if exists {
        conn.execute(
            "UPDATE users SET native_language=?1, target_language=?2, level=?3, daily_word_count=?4, reminder_enabled=?5, updated_at=datetime('now') WHERE id=?6",
            params![user.native_language, user.target_language, user.level, user.daily_word_count, user.reminder_enabled as i32, user.id],
        ).map_err(|e| e.to_string())?;
        user.id
    } else {
        conn.execute(
            "INSERT INTO users (native_language, target_language, level, daily_word_count, reminder_enabled) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![user.native_language, user.target_language, user.level, user.daily_word_count, user.reminder_enabled as i32],
        ).map_err(|e| e.to_string())?;
        conn.last_insert_rowid()
    };

    // Update interests
    conn.execute("DELETE FROM user_interests WHERE user_id = ?1", params![user_id])
        .map_err(|e| e.to_string())?;
    for interest in &user.interests {
        conn.execute(
            "INSERT INTO user_interests (user_id, interest) VALUES (?1, ?2)",
            params![user_id, interest],
        ).map_err(|e| e.to_string())?;
    }

    Ok(user_id)
}

// ─── Word queries ───

pub fn insert_word(conn: &Connection, word: &WordExplanation, target_language: &str) -> Result<i64, String> {
    let examples_json = serde_json::to_string(&word.examples).unwrap_or_else(|_| "[]".to_string());

    conn.execute(
        "INSERT INTO words (word_text, target_language, translation, pronunciation, explanation, examples_json, word_type, difficulty_score) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![word.word_text, target_language, word.translation, word.pronunciation, word.explanation, examples_json, word.word_type, word.difficulty_score],
    ).map_err(|e| e.to_string())?;

    Ok(conn.last_insert_rowid())
}

pub fn get_word_by_id(conn: &Connection, word_id: i64) -> Result<Option<Word>, String> {
    let mut stmt = conn
        .prepare("SELECT id, word_text, target_language, translation, pronunciation, explanation, examples_json, word_type, difficulty_score, created_at FROM words WHERE id = ?1")
        .map_err(|e| e.to_string())?;

    let word = stmt
        .query_row(params![word_id], |row| {
            let examples_json: String = row.get(6)?;
            let examples: Vec<String> = serde_json::from_str(&examples_json).unwrap_or_default();
            Ok(Word {
                id: row.get(0)?,
                word_text: row.get(1)?,
                target_language: row.get(2)?,
                translation: row.get(3)?,
                pronunciation: row.get(4)?,
                explanation: row.get(5)?,
                examples,
                word_type: row.get(7)?,
                difficulty_score: row.get(8)?,
                created_at: row.get(9)?,
            })
        })
        .ok();

    Ok(word)
}

// ─── Daily Word Set queries ───

pub fn get_or_create_daily_set(conn: &Connection, user_id: i64, date: &str) -> Result<DailyWordSet, String> {
    let existing = conn
        .query_row(
            "SELECT id, user_id, date, status, created_at FROM daily_word_sets WHERE user_id = ?1 AND date = ?2",
            params![user_id, date],
            |row| {
                Ok(DailyWordSet {
                    id: row.get(0)?,
                    user_id: row.get(1)?,
                    date: row.get(2)?,
                    status: row.get(3)?,
                    created_at: row.get(4)?,
                })
            },
        )
        .ok();

    if let Some(set) = existing {
        return Ok(set);
    }

    conn.execute(
        "INSERT INTO daily_word_sets (user_id, date, status) VALUES (?1, ?2, 'active')",
        params![user_id, date],
    ).map_err(|e| e.to_string())?;

    let set_id = conn.last_insert_rowid();
    Ok(DailyWordSet {
        id: set_id,
        user_id,
        date: date.to_string(),
        status: "active".to_string(),
        created_at: chrono::Utc::now().to_rfc3339(),
    })
}

pub fn add_word_to_set(conn: &Connection, set_id: i64, word_id: i64, order_index: i32) -> Result<(), String> {
    conn.execute(
        "INSERT INTO daily_words (set_id, word_id, order_index) VALUES (?1, ?2, ?3)",
        params![set_id, word_id, order_index],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn get_daily_words(conn: &Connection, user_id: i64, date: &str) -> Result<Vec<(Word, DailyWord)>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT w.id, w.word_text, w.target_language, w.translation, w.pronunciation, w.explanation, w.examples_json, w.word_type, w.difficulty_score, w.created_at,
                    dw.id, dw.set_id, dw.word_id, dw.order_index, dw.review_priority, dw.learned
             FROM daily_word_sets ds
             JOIN daily_words dw ON dw.set_id = ds.id
             JOIN words w ON w.id = dw.word_id
             WHERE ds.user_id = ?1 AND ds.date = ?2
             ORDER BY dw.order_index"
        )
        .map_err(|e| e.to_string())?;

    let results = stmt
        .query_map(params![user_id, date], |row| {
            let examples_json: String = row.get(6)?;
            let examples: Vec<String> = serde_json::from_str(&examples_json).unwrap_or_default();
            Ok((
                Word {
                    id: row.get(0)?,
                    word_text: row.get(1)?,
                    target_language: row.get(2)?,
                    translation: row.get(3)?,
                    pronunciation: row.get(4)?,
                    explanation: row.get(5)?,
                    examples,
                    word_type: row.get(7)?,
                    difficulty_score: row.get(8)?,
                    created_at: row.get(9)?,
                },
                DailyWord {
                    id: row.get(10)?,
                    set_id: row.get(11)?,
                    word_id: row.get(12)?,
                    order_index: row.get(13)?,
                    review_priority: row.get(14)?,
                    learned: row.get::<_, i32>(15)? == 1,
                },
            ))
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(results)
}

pub fn mark_word_learned(conn: &Connection, daily_word_id: i64) -> Result<(), String> {
    conn.execute(
        "UPDATE daily_words SET learned = 1 WHERE id = ?1",
        params![daily_word_id],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn delete_daily_words_for_date(conn: &Connection, user_id: i64, date: &str) -> Result<(), String> {
    // First, get the set_id for this date
    let set_id: Option<i64> = conn
        .query_row(
            "SELECT id FROM daily_word_sets WHERE user_id = ?1 AND date = ?2",
            params![user_id, date],
            |row| row.get(0),
        )
        .ok();

    if let Some(set_id) = set_id {
        // Delete daily_words entries
        conn.execute(
            "DELETE FROM daily_words WHERE set_id = ?1",
            params![set_id],
        ).map_err(|e| e.to_string())?;

        // Delete the set itself
        conn.execute(
            "DELETE FROM daily_word_sets WHERE id = ?1",
            params![set_id],
        ).map_err(|e| e.to_string())?;
    }

    Ok(())
}

// ─── Quiz queries ───

pub fn record_quiz_attempt(conn: &Connection, attempt: &QuizAttempt) -> Result<i64, String> {
    conn.execute(
        "INSERT INTO quiz_attempts (user_id, word_id, question_type, user_answer, is_correct, ai_feedback) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![attempt.user_id, attempt.word_id, attempt.question_type, attempt.user_answer, attempt.is_correct as i32, attempt.ai_feedback],
    ).map_err(|e| e.to_string())?;

    // Update review priority based on correctness
    if !attempt.is_correct {
        conn.execute(
            "UPDATE daily_words SET review_priority = review_priority + 0.5 WHERE word_id = ?1",
            params![attempt.word_id],
        ).map_err(|e| e.to_string())?;

        // Add to review queue or update priority
        conn.execute(
            "INSERT INTO review_queue (user_id, word_id, priority, next_review_at)
             VALUES (?1, ?2, 2.0, datetime('now', '+1 hour'))
             ON CONFLICT(user_id, word_id) DO UPDATE SET priority = priority + 1.0, next_review_at = datetime('now', '+1 hour'), updated_at = datetime('now')",
            params![attempt.user_id, attempt.word_id],
        ).ok(); // ignore uniqueness issues since we don't have a unique constraint yet
    }

    Ok(conn.last_insert_rowid())
}

// ─── Stats queries ───

pub fn get_dashboard_stats(conn: &Connection, user_id: i64) -> Result<DashboardStats, String> {
    let total_words_learned: i64 = conn
        .query_row(
            "SELECT COUNT(DISTINCT dw.word_id) FROM daily_words dw JOIN daily_word_sets ds ON ds.id = dw.set_id WHERE ds.user_id = ?1 AND dw.learned = 1",
            params![user_id],
            |row| row.get(0),
        )
        .unwrap_or(0);

    let today = chrono::Local::now().format("%Y-%m-%d").to_string();

    let today_total: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM daily_words dw JOIN daily_word_sets ds ON ds.id = dw.set_id WHERE ds.user_id = ?1 AND ds.date = ?2",
            params![user_id, today],
            |row| row.get(0),
        )
        .unwrap_or(0);

    let today_completed: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM daily_words dw JOIN daily_word_sets ds ON ds.id = dw.set_id WHERE ds.user_id = ?1 AND ds.date = ?2 AND dw.learned = 1",
            params![user_id, today],
            |row| row.get(0),
        )
        .unwrap_or(0);

    let total_correct: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM quiz_attempts WHERE user_id = ?1 AND is_correct = 1",
            params![user_id],
            |row| row.get(0),
        )
        .unwrap_or(0);

    let total_attempts: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM quiz_attempts WHERE user_id = ?1",
            params![user_id],
            |row| row.get(0),
        )
        .unwrap_or(0);

    let accuracy_rate = if total_attempts > 0 {
        (total_correct as f64) / (total_attempts as f64) * 100.0
    } else {
        0.0
    };

    // Weekly activity: count of words studied per day for last 7 days
    let mut weekly_activity = vec![0i64; 7];
    for i in 0..7 {
        let date = (chrono::Local::now() - chrono::Duration::days(6 - i))
            .format("%Y-%m-%d")
            .to_string();
        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM daily_words dw JOIN daily_word_sets ds ON ds.id = dw.set_id WHERE ds.user_id = ?1 AND ds.date = ?2 AND dw.learned = 1",
                params![user_id, date],
                |row| row.get(0),
            )
            .unwrap_or(0);
        weekly_activity[i as usize] = count;
    }

    // Streak calculation
    let mut streak_count: i64 = 0;
    let mut day_offset = 0i64;
    loop {
        let date = (chrono::Local::now() - chrono::Duration::days(day_offset))
            .format("%Y-%m-%d")
            .to_string();
        let has_activity: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM daily_words dw JOIN daily_word_sets ds ON ds.id = dw.set_id WHERE ds.user_id = ?1 AND ds.date = ?2 AND dw.learned = 1",
                params![user_id, date],
                |row| row.get(0),
            )
            .unwrap_or(0);

        if has_activity > 0 {
            streak_count += 1;
            day_offset += 1;
        } else if day_offset == 0 {
            // today might not have started yet, check yesterday
            day_offset += 1;
        } else {
            break;
        }

        if day_offset > 365 {
            break;
        }
    }

    // Hardest words
    let mut stmt = conn
        .prepare(
            "SELECT w.id, w.word_text, w.target_language, w.translation, w.pronunciation, w.explanation, w.examples_json, w.word_type, w.difficulty_score, w.created_at
             FROM words w
             JOIN quiz_attempts qa ON qa.word_id = w.id
             WHERE qa.user_id = ?1
             GROUP BY w.id
             HAVING CAST(SUM(CASE WHEN qa.is_correct = 0 THEN 1 ELSE 0 END) AS REAL) / COUNT(*) > 0.4
             ORDER BY CAST(SUM(CASE WHEN qa.is_correct = 0 THEN 1 ELSE 0 END) AS REAL) / COUNT(*) DESC
             LIMIT 10"
        )
        .map_err(|e| e.to_string())?;

    let hardest_words: Vec<Word> = stmt
        .query_map(params![user_id], |row| {
            let examples_json: String = row.get(6)?;
            let examples: Vec<String> = serde_json::from_str(&examples_json).unwrap_or_default();
            Ok(Word {
                id: row.get(0)?,
                word_text: row.get(1)?,
                target_language: row.get(2)?,
                translation: row.get(3)?,
                pronunciation: row.get(4)?,
                explanation: row.get(5)?,
                examples,
                word_type: row.get(7)?,
                difficulty_score: row.get(8)?,
                created_at: row.get(9)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(DashboardStats {
        total_words_learned,
        today_completed,
        today_total,
        weekly_activity,
        accuracy_rate,
        streak_count,
        hardest_words,
    })
}

// ─── Settings queries ───

pub fn get_setting(conn: &Connection, key: &str) -> Result<Option<String>, String> {
    let val = conn
        .query_row(
            "SELECT value FROM app_settings WHERE key = ?1",
            params![key],
            |row| row.get(0),
        )
        .ok();
    Ok(val)
}

pub fn set_setting(conn: &Connection, key: &str, value: &str) -> Result<(), String> {
    conn.execute(
        "INSERT INTO app_settings (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value = ?2",
        params![key, value],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn get_learned_word_texts(conn: &Connection, user_id: i64) -> Result<Vec<String>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT DISTINCT w.word_text FROM words w JOIN daily_words dw ON dw.word_id = w.id JOIN daily_word_sets ds ON ds.id = dw.set_id WHERE ds.user_id = ?1"
        )
        .map_err(|e| e.to_string())?;

    let words: Vec<String> = stmt
        .query_map(params![user_id], |row| row.get(0))
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(words)
}

// ─── Chat queries ───

fn map_chat_session(row: &rusqlite::Row<'_>) -> rusqlite::Result<ChatSession> {
    Ok(ChatSession {
        id: row.get(0)?,
        user_id: row.get(1)?,
        title: row.get(2)?,
        created_at: row.get(3)?,
        updated_at: row.get(4)?,
        message_count: row.get(5).unwrap_or(0),
    })
}

/// Create a new chat session for a user
pub fn create_chat_session(conn: &Connection, user_id: i64, title: Option<&str>) -> Result<i64, String> {
    conn.execute(
        "INSERT INTO chat_sessions (user_id, title) VALUES (?1, ?2)",
        params![user_id, title],
    ).map_err(|e| e.to_string())?;

    Ok(conn.last_insert_rowid())
}

pub fn get_chat_session_by_id(conn: &Connection, session_id: i64) -> Result<Option<ChatSession>, String> {
    let session = conn
        .query_row(
            "SELECT id, user_id, title, created_at, updated_at,
             (SELECT COUNT(*) FROM chat_messages WHERE session_id = chat_sessions.id) as message_count
             FROM chat_sessions WHERE id = ?1",
            params![session_id],
            map_chat_session,
        )
        .ok();

    Ok(session)
}

pub fn get_chat_sessions_by_user(conn: &Connection, user_id: i64) -> Result<Vec<ChatSession>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, user_id, title, created_at, updated_at,
             (SELECT COUNT(*) FROM chat_messages WHERE session_id = chat_sessions.id) as message_count
             FROM chat_sessions WHERE user_id = ?1 ORDER BY updated_at DESC, id DESC"
        )
        .map_err(|e| e.to_string())?;

    let sessions = stmt
        .query_map(params![user_id], map_chat_session)
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(sessions)
}

/// Get the most recent chat session for a user
pub fn get_chat_session_by_user(conn: &Connection, user_id: i64) -> Result<Option<ChatSession>, String> {
    let session = conn
        .query_row(
            "SELECT id, user_id, title, created_at, updated_at,
             (SELECT COUNT(*) FROM chat_messages WHERE session_id = chat_sessions.id) as message_count
             FROM chat_sessions WHERE user_id = ?1 ORDER BY updated_at DESC LIMIT 1",
            params![user_id],
            map_chat_session,
        )
        .ok();

    Ok(session)
}

pub fn rename_chat_session(conn: &Connection, session_id: i64, title: &str) -> Result<(), String> {
    conn.execute(
        "UPDATE chat_sessions SET title = ?1, updated_at = datetime('now') WHERE id = ?2",
        params![title, session_id],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

pub fn delete_chat_session(conn: &Connection, session_id: i64) -> Result<(), String> {
    conn.execute("DELETE FROM chat_sessions WHERE id = ?1", params![session_id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// Insert a new chat message into a session
pub fn insert_chat_message(
    conn: &Connection,
    session_id: i64,
    role: &str,
    content: &str,
    word_context_id: Option<i64>,
) -> Result<i64, String> {
    // Validate role using the enum
    let _role = ChatRole::from_str_checked(role)?;
    
    conn.execute(
        "INSERT INTO chat_messages (session_id, role, content, word_context_id) VALUES (?1, ?2, ?3, ?4)",
        params![session_id, role, content, word_context_id],
    ).map_err(|e| e.to_string())?;
    
    // Capture message ID immediately after INSERT, before the UPDATE
    let message_id = conn.last_insert_rowid();
    
    // Update session's updated_at timestamp
    conn.execute(
        "UPDATE chat_sessions SET updated_at = datetime('now') WHERE id = ?1",
        params![session_id],
    ).map_err(|e| e.to_string())?;
    
    Ok(message_id)
}

/// Get all chat messages for a session, ordered by creation time
pub fn get_chat_messages_by_session(conn: &Connection, session_id: i64) -> Result<Vec<ChatMessage>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, session_id, role, content, word_context_id, created_at FROM chat_messages WHERE session_id = ?1 ORDER BY created_at ASC"
        )
        .map_err(|e| e.to_string())?;
    
    let messages: Vec<ChatMessage> = stmt
        .query_map(params![session_id], |row| {
            Ok(ChatMessage {
                id: row.get(0)?,
                session_id: row.get(1)?,
                role: row.get(2)?,
                content: row.get(3)?,
                word_context_id: row.get(4)?,
                created_at: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();
    
    Ok(messages)
}

/// Get a single chat message by ID
pub fn get_chat_message_by_id(conn: &Connection, message_id: i64) -> Result<Option<ChatMessage>, String> {
    let message = conn
        .query_row(
            "SELECT id, session_id, role, content, word_context_id, created_at FROM chat_messages WHERE id = ?1",
            params![message_id],
            |row| {
                Ok(ChatMessage {
                    id: row.get(0)?,
                    session_id: row.get(1)?,
                    role: row.get(2)?,
                    content: row.get(3)?,
                    word_context_id: row.get(4)?,
                    created_at: row.get(5)?,
                })
            },
        )
        .ok();

    Ok(message)
}

/// Delete all chat messages for a session
pub fn delete_chat_messages_by_session(conn: &Connection, session_id: i64) -> Result<(), String> {
    conn.execute(
        "DELETE FROM chat_messages WHERE session_id = ?1",
        params![session_id],
    ).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[cfg(test)]
#[path = "queries_chat_tests.rs"]
mod queries_chat_tests;

pub fn get_all_learned_words(conn: &rusqlite::Connection, user_id: i64) -> Result<Vec<crate::models::Word>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT DISTINCT w.id, w.word_text, w.target_language, w.translation, w.pronunciation, w.explanation, w.examples_json, w.word_type, w.difficulty_score, w.created_at 
             FROM words w 
             JOIN daily_words dw ON dw.word_id = w.id 
             JOIN daily_word_sets ds ON ds.id = dw.set_id 
             WHERE ds.user_id = ?1 AND dw.learned = 1 AND ds.date >= date('now', '-7 days')"
        )
        .map_err(|e| e.to_string())?;

    let words: Vec<crate::models::Word> = stmt
        .query_map(rusqlite::params![user_id], |row| {
            let examples_json: String = row.get(6)?;
            let examples: Vec<String> = serde_json::from_str(&examples_json).unwrap_or_default();
            Ok(crate::models::Word {
                id: row.get(0)?,
                word_text: row.get(1)?,
                target_language: row.get(2)?,
                translation: row.get(3)?,
                pronunciation: row.get(4)?,
                explanation: row.get(5)?,
                examples,
                word_type: row.get(7)?,
                difficulty_score: row.get(8)?,
                created_at: row.get(9)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(words)
}

pub fn get_hardest_word_texts(conn: &rusqlite::Connection, user_id: i64) -> Result<Vec<String>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT w.word_text 
             FROM words w
             JOIN daily_words dw ON w.id = dw.word_id
             JOIN daily_word_sets dws ON dw.set_id = dws.id
             WHERE dws.user_id = ?1 AND dw.accuracy < 0.7 AND dw.status = 'learned'
             ORDER BY dw.accuracy ASC
             LIMIT 10",
        )
        .map_err(|e| e.to_string())?;

    let mut rows = stmt.query([user_id]).map_err(|e| e.to_string())?;
    let mut words = Vec::new();
    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        words.push(row.get(0).map_err(|e| e.to_string())?);
    }

    Ok(words)
}
