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
        "
    )?;

    Ok(())
}
