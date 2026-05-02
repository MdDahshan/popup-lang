use rusqlite::{Connection, Result};

pub fn run_migrations(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            native_language TEXT NOT NULL,
            target_language TEXT NOT NULL,
            level TEXT NOT NULL DEFAULT 'beginner',
            daily_word_count INTEGER NOT NULL DEFAULT 5,
            reminder_enabled INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS user_interests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            interest TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS words (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            word_text TEXT NOT NULL,
            target_language TEXT NOT NULL,
            translation TEXT,
            pronunciation TEXT,
            explanation TEXT,
            examples_json TEXT DEFAULT '[]',
            word_type TEXT,
            difficulty_score REAL DEFAULT 0.5,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS daily_word_sets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'active',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS daily_words (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            set_id INTEGER NOT NULL,
            word_id INTEGER NOT NULL,
            order_index INTEGER NOT NULL DEFAULT 0,
            review_priority REAL DEFAULT 1.0,
            learned INTEGER DEFAULT 0,
            FOREIGN KEY (set_id) REFERENCES daily_word_sets(id),
            FOREIGN KEY (word_id) REFERENCES words(id)
        );

        CREATE TABLE IF NOT EXISTS quiz_attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            word_id INTEGER NOT NULL,
            question_type TEXT NOT NULL,
            user_answer TEXT,
            is_correct INTEGER NOT NULL DEFAULT 0,
            ai_feedback TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (word_id) REFERENCES words(id)
        );

        CREATE TABLE IF NOT EXISTS review_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            word_id INTEGER NOT NULL,
            priority REAL NOT NULL DEFAULT 1.0,
            next_review_at TEXT NOT NULL DEFAULT (datetime('now')),
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (word_id) REFERENCES words(id)
        );

        CREATE TABLE IF NOT EXISTS app_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_daily_word_sets_date ON daily_word_sets(user_id, date);
        CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id, word_id);
        CREATE INDEX IF NOT EXISTS idx_review_queue_user ON review_queue(user_id, next_review_at);

        CREATE TABLE IF NOT EXISTS chat_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id, updated_at DESC);

        CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
            content TEXT NOT NULL,
            word_context_id INTEGER,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
            FOREIGN KEY (word_context_id) REFERENCES words(id)
        );

        CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id, created_at);
        "
    )?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    #[test]
    fn test_chat_sessions_table_creation() {
        let conn = Connection::open_in_memory().unwrap();
        
        // Run migrations
        run_migrations(&conn).unwrap();
        
        // Verify chat_sessions table exists
        let table_exists: bool = conn
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='chat_sessions'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        
        assert!(table_exists, "chat_sessions table should exist");
        
        // Verify table structure
        let mut stmt = conn
            .prepare("PRAGMA table_info(chat_sessions)")
            .unwrap();
        
        let columns: Vec<String> = stmt
            .query_map([], |row| row.get::<_, String>(1))
            .unwrap()
            .map(|r| r.unwrap())
            .collect();
        
        assert!(columns.contains(&"id".to_string()));
        assert!(columns.contains(&"user_id".to_string()));
        assert!(columns.contains(&"title".to_string()));
        assert!(columns.contains(&"created_at".to_string()));
        assert!(columns.contains(&"updated_at".to_string()));
    }

    #[test]
    fn test_chat_sessions_foreign_key() {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute("PRAGMA foreign_keys = ON", []).unwrap();
        
        run_migrations(&conn).unwrap();
        
        // Insert a test user
        conn.execute(
            "INSERT INTO users (native_language, target_language, level) VALUES (?, ?, ?)",
            ["en", "ar", "beginner"],
        )
        .unwrap();
        
        // Insert a chat session with valid user_id
        let result = conn.execute(
            "INSERT INTO chat_sessions (user_id, title) VALUES (?, ?)",
            rusqlite::params![1, "Test Session"],
        );
        
        assert!(result.is_ok(), "Should insert chat session with valid user_id");
        
        // Try to insert with invalid user_id (should fail with foreign key constraint)
        let result = conn.execute(
            "INSERT INTO chat_sessions (user_id, title) VALUES (?, ?)",
            rusqlite::params![999, "Invalid Session"],
        );
        
        assert!(result.is_err(), "Should fail with invalid user_id due to foreign key constraint");
    }

    #[test]
    fn test_chat_sessions_index() {
        let conn = Connection::open_in_memory().unwrap();
        
        run_migrations(&conn).unwrap();
        
        // Verify index exists
        let index_exists: bool = conn
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND name='idx_chat_sessions_user'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        
        assert!(index_exists, "idx_chat_sessions_user index should exist");
    }

    #[test]
    fn test_chat_messages_table_creation() {
        let conn = Connection::open_in_memory().unwrap();
        
        run_migrations(&conn).unwrap();
        
        // Verify chat_messages table exists
        let table_exists: bool = conn
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='chat_messages'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        
        assert!(table_exists, "chat_messages table should exist");
        
        // Verify table structure
        let mut stmt = conn
            .prepare("PRAGMA table_info(chat_messages)")
            .unwrap();
        
        let columns: Vec<String> = stmt
            .query_map([], |row| row.get::<_, String>(1))
            .unwrap()
            .map(|r| r.unwrap())
            .collect();
        
        assert!(columns.contains(&"id".to_string()));
        assert!(columns.contains(&"session_id".to_string()));
        assert!(columns.contains(&"role".to_string()));
        assert!(columns.contains(&"content".to_string()));
        assert!(columns.contains(&"word_context_id".to_string()));
        assert!(columns.contains(&"created_at".to_string()));
    }

    #[test]
    fn test_chat_messages_role_check_constraint() {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute("PRAGMA foreign_keys = ON", []).unwrap();
        
        run_migrations(&conn).unwrap();
        
        // Insert test user and session
        conn.execute(
            "INSERT INTO users (native_language, target_language, level) VALUES (?, ?, ?)",
            ["en", "ar", "beginner"],
        )
        .unwrap();
        
        conn.execute(
            "INSERT INTO chat_sessions (user_id, title) VALUES (?, ?)",
            rusqlite::params![1, "Test Session"],
        )
        .unwrap();
        
        // Valid roles should work
        let result = conn.execute(
            "INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)",
            rusqlite::params![1, "user", "Hello"],
        );
        assert!(result.is_ok(), "Should insert message with role 'user'");
        
        let result = conn.execute(
            "INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)",
            rusqlite::params![1, "assistant", "Hi there"],
        );
        assert!(result.is_ok(), "Should insert message with role 'assistant'");
        
        let result = conn.execute(
            "INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)",
            rusqlite::params![1, "system", "System message"],
        );
        assert!(result.is_ok(), "Should insert message with role 'system'");
        
        // Invalid role should fail
        let result = conn.execute(
            "INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)",
            rusqlite::params![1, "invalid_role", "Test"],
        );
        assert!(result.is_err(), "Should fail with invalid role due to CHECK constraint");
    }

    #[test]
    fn test_chat_messages_foreign_keys() {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute("PRAGMA foreign_keys = ON", []).unwrap();
        
        run_migrations(&conn).unwrap();
        
        // Insert test user, session, and word
        conn.execute(
            "INSERT INTO users (native_language, target_language, level) VALUES (?, ?, ?)",
            ["en", "ar", "beginner"],
        )
        .unwrap();
        
        conn.execute(
            "INSERT INTO chat_sessions (user_id, title) VALUES (?, ?)",
            rusqlite::params![1, "Test Session"],
        )
        .unwrap();
        
        conn.execute(
            "INSERT INTO words (word_text, target_language, translation) VALUES (?, ?, ?)",
            rusqlite::params!["مرحبا", "ar", "Hello"],
        )
        .unwrap();
        
        // Valid foreign keys should work
        let result = conn.execute(
            "INSERT INTO chat_messages (session_id, role, content, word_context_id) VALUES (?, ?, ?, ?)",
            rusqlite::params![1, "user", "Explain this word", 1],
        );
        assert!(result.is_ok(), "Should insert message with valid foreign keys");
        
        // Invalid session_id should fail
        let result = conn.execute(
            "INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)",
            rusqlite::params![999, "user", "Test"],
        );
        assert!(result.is_err(), "Should fail with invalid session_id due to foreign key constraint");
        
        // Invalid word_context_id should fail
        let result = conn.execute(
            "INSERT INTO chat_messages (session_id, role, content, word_context_id) VALUES (?, ?, ?, ?)",
            rusqlite::params![1, "user", "Test", 999],
        );
        assert!(result.is_err(), "Should fail with invalid word_context_id due to foreign key constraint");
    }

    #[test]
    fn test_chat_messages_cascade_delete() {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute("PRAGMA foreign_keys = ON", []).unwrap();
        
        run_migrations(&conn).unwrap();
        
        // Insert test user and session
        conn.execute(
            "INSERT INTO users (native_language, target_language, level) VALUES (?, ?, ?)",
            ["en", "ar", "beginner"],
        )
        .unwrap();
        
        conn.execute(
            "INSERT INTO chat_sessions (user_id, title) VALUES (?, ?)",
            rusqlite::params![1, "Test Session"],
        )
        .unwrap();
        
        // Insert messages
        conn.execute(
            "INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)",
            rusqlite::params![1, "user", "Message 1"],
        )
        .unwrap();
        
        conn.execute(
            "INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)",
            rusqlite::params![1, "assistant", "Message 2"],
        )
        .unwrap();
        
        // Verify messages exist
        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM chat_messages WHERE session_id = ?",
                [1],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 2, "Should have 2 messages");
        
        // Delete session
        conn.execute("DELETE FROM chat_sessions WHERE id = ?", [1])
            .unwrap();
        
        // Verify messages were cascade deleted
        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM chat_messages WHERE session_id = ?",
                [1],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 0, "Messages should be cascade deleted when session is deleted");
    }

    #[test]
    fn test_chat_messages_index() {
        let conn = Connection::open_in_memory().unwrap();
        
        run_migrations(&conn).unwrap();
        
        // Verify index exists
        let index_exists: bool = conn
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND name='idx_chat_messages_session'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        
        assert!(index_exists, "idx_chat_messages_session index should exist");
    }
}
