#[cfg(test)]
mod tests {
    use crate::db::{migrations::run_migrations, queries::*};
    use rusqlite::Connection;

    fn setup_test_db() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute("PRAGMA foreign_keys = ON", []).unwrap();
        run_migrations(&conn).unwrap();
        
        // Insert a test user
        conn.execute(
            "INSERT INTO users (native_language, target_language, level) VALUES (?, ?, ?)",
            ["en", "ar", "beginner"],
        )
        .unwrap();
        
        conn
    }

    #[test]
    fn test_create_chat_session() {
        let conn = setup_test_db();
        
        // Create a session with title
        let session_id = create_chat_session(&conn, 1, Some("Test Session")).unwrap();
        assert!(session_id > 0, "Session ID should be positive");
        
        // Verify session was created
        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM chat_sessions WHERE id = ?",
                [session_id],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 1, "Session should exist in database");
        
        // Create a session without title
        let session_id2 = create_chat_session(&conn, 1, None).unwrap();
        assert!(session_id2 > session_id, "Second session ID should be greater");
    }

    #[test]
    fn test_get_chat_session_by_user() {
        let conn = setup_test_db();
        
        // No session exists initially
        let result = get_chat_session_by_user(&conn, 1).unwrap();
        assert!(result.is_none(), "Should return None when no session exists");
        
        // Create sessions
        create_chat_session(&conn, 1, Some("First Session")).unwrap();
        std::thread::sleep(std::time::Duration::from_secs(1)); // Ensure different timestamps
        let session_id2 = create_chat_session(&conn, 1, Some("Second Session")).unwrap();
        
        // Should return the most recent session
        let session = get_chat_session_by_user(&conn, 1).unwrap().unwrap();
        assert_eq!(session.id, session_id2, "Should return most recent session");
        assert_eq!(session.user_id, 1);
        assert_eq!(session.title, Some("Second Session".to_string()));
        assert!(!session.created_at.is_empty());
        assert!(!session.updated_at.is_empty());
    }

    #[test]
    fn test_insert_chat_message() {
        let conn = setup_test_db();
        
        // Create a session
        let session_id = create_chat_session(&conn, 1, Some("Test Session")).unwrap();
        
        // Insert user message
        let msg_id = insert_chat_message(&conn, session_id, "user", "Hello", None).unwrap();
        assert!(msg_id > 0, "Message ID should be positive");
        
        // Insert assistant message
        let msg_id2 = insert_chat_message(&conn, session_id, "assistant", "Hi there!", None).unwrap();
        assert!(msg_id2 > msg_id, "Second message ID should be greater");
        
        // Insert system message
        let msg_id3 = insert_chat_message(&conn, session_id, "system", "System prompt", None).unwrap();
        assert!(msg_id3 > msg_id2, "Third message ID should be greater");
        
        // Verify messages were created
        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM chat_messages WHERE session_id = ?",
                [session_id],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 3, "Should have 3 messages");
    }

    #[test]
    fn test_insert_chat_message_with_word_context() {
        let conn = setup_test_db();
        
        // Create a session and a word
        let session_id = create_chat_session(&conn, 1, Some("Test Session")).unwrap();
        conn.execute(
            "INSERT INTO words (word_text, target_language, translation) VALUES (?, ?, ?)",
            ["مرحبا", "ar", "Hello"],
        )
        .unwrap();
        let word_id = conn.last_insert_rowid();
        
        // Insert message with word context
        let msg_id = insert_chat_message(&conn, session_id, "user", "Explain this word", Some(word_id)).unwrap();
        
        // Verify word_context_id was saved
        let saved_word_id: Option<i64> = conn
            .query_row(
                "SELECT word_context_id FROM chat_messages WHERE id = ?",
                [msg_id],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(saved_word_id, Some(word_id), "Word context ID should be saved");
    }

    #[test]
    fn test_insert_chat_message_invalid_role() {
        let conn = setup_test_db();
        let session_id = create_chat_session(&conn, 1, Some("Test Session")).unwrap();
        
        // Try to insert message with invalid role
        let result = insert_chat_message(&conn, session_id, "invalid_role", "Test", None);
        assert!(result.is_err(), "Should fail with invalid role");
        assert!(result.unwrap_err().contains("Invalid role"), "Error should mention invalid role");
    }

    #[test]
    fn test_insert_chat_message_updates_session_timestamp() {
        let conn = setup_test_db();
        let session_id = create_chat_session(&conn, 1, Some("Test Session")).unwrap();
        
        // Get initial updated_at
        let initial_updated_at: String = conn
            .query_row(
                "SELECT updated_at FROM chat_sessions WHERE id = ?",
                [session_id],
                |row| row.get(0),
            )
            .unwrap();
        
        // Wait a bit and insert a message
        std::thread::sleep(std::time::Duration::from_secs(1));
        insert_chat_message(&conn, session_id, "user", "Hello", None).unwrap();
        
        // Get updated updated_at
        let new_updated_at: String = conn
            .query_row(
                "SELECT updated_at FROM chat_sessions WHERE id = ?",
                [session_id],
                |row| row.get(0),
            )
            .unwrap();
        
        assert_ne!(initial_updated_at, new_updated_at, "Session updated_at should be updated");
    }

    #[test]
    fn test_get_chat_messages_by_session() {
        let conn = setup_test_db();
        let session_id = create_chat_session(&conn, 1, Some("Test Session")).unwrap();
        
        // Empty session
        let messages = get_chat_messages_by_session(&conn, session_id).unwrap();
        assert_eq!(messages.len(), 0, "Should return empty vector for new session");
        
        // Insert messages
        insert_chat_message(&conn, session_id, "user", "Hello", None).unwrap();
        insert_chat_message(&conn, session_id, "assistant", "Hi there!", None).unwrap();
        insert_chat_message(&conn, session_id, "user", "How are you?", None).unwrap();
        
        // Get messages
        let messages = get_chat_messages_by_session(&conn, session_id).unwrap();
        assert_eq!(messages.len(), 3, "Should return 3 messages");
        
        // Verify order (should be chronological)
        assert_eq!(messages[0].role, "user");
        assert_eq!(messages[0].content, "Hello");
        assert_eq!(messages[1].role, "assistant");
        assert_eq!(messages[1].content, "Hi there!");
        assert_eq!(messages[2].role, "user");
        assert_eq!(messages[2].content, "How are you?");
        
        // Verify all fields are populated
        for msg in &messages {
            assert_eq!(msg.session_id, session_id);
            assert!(!msg.created_at.is_empty());
        }
    }

    #[test]
    fn test_get_chat_messages_by_session_with_word_context() {
        let conn = setup_test_db();
        let session_id = create_chat_session(&conn, 1, Some("Test Session")).unwrap();
        
        // Create a word
        conn.execute(
            "INSERT INTO words (word_text, target_language, translation) VALUES (?, ?, ?)",
            ["مرحبا", "ar", "Hello"],
        )
        .unwrap();
        let word_id = conn.last_insert_rowid();
        
        // Insert messages with and without word context
        insert_chat_message(&conn, session_id, "user", "Regular message", None).unwrap();
        insert_chat_message(&conn, session_id, "user", "Explain this word", Some(word_id)).unwrap();
        
        // Get messages
        let messages = get_chat_messages_by_session(&conn, session_id).unwrap();
        assert_eq!(messages.len(), 2);
        assert_eq!(messages[0].word_context_id, None);
        assert_eq!(messages[1].word_context_id, Some(word_id));
    }

    #[test]
    fn test_delete_chat_messages_by_session() {
        let conn = setup_test_db();
        let session_id = create_chat_session(&conn, 1, Some("Test Session")).unwrap();
        
        // Insert messages
        insert_chat_message(&conn, session_id, "user", "Message 1", None).unwrap();
        insert_chat_message(&conn, session_id, "assistant", "Message 2", None).unwrap();
        insert_chat_message(&conn, session_id, "user", "Message 3", None).unwrap();
        
        // Verify messages exist
        let messages = get_chat_messages_by_session(&conn, session_id).unwrap();
        assert_eq!(messages.len(), 3, "Should have 3 messages before deletion");
        
        // Delete messages
        delete_chat_messages_by_session(&conn, session_id).unwrap();
        
        // Verify messages were deleted
        let messages = get_chat_messages_by_session(&conn, session_id).unwrap();
        assert_eq!(messages.len(), 0, "Should have 0 messages after deletion");
        
        // Verify session still exists
        let session = get_chat_session_by_user(&conn, 1).unwrap();
        assert!(session.is_some(), "Session should still exist after deleting messages");
    }

    #[test]
    fn test_delete_chat_messages_by_session_empty() {
        let conn = setup_test_db();
        let session_id = create_chat_session(&conn, 1, Some("Test Session")).unwrap();
        
        // Delete from empty session (should not error)
        let result = delete_chat_messages_by_session(&conn, session_id);
        assert!(result.is_ok(), "Should succeed even when no messages exist");
    }

    #[test]
    fn test_multiple_users_sessions() {
        let conn = setup_test_db();
        
        // Create second user
        conn.execute(
            "INSERT INTO users (native_language, target_language, level) VALUES (?, ?, ?)",
            ["es", "en", "intermediate"],
        )
        .unwrap();
        
        // Create sessions for both users
        let session1 = create_chat_session(&conn, 1, Some("User 1 Session")).unwrap();
        let session2 = create_chat_session(&conn, 2, Some("User 2 Session")).unwrap();
        
        // Insert messages for both sessions
        insert_chat_message(&conn, session1, "user", "User 1 message", None).unwrap();
        insert_chat_message(&conn, session2, "user", "User 2 message", None).unwrap();
        
        // Verify each user gets their own session
        let user1_session = get_chat_session_by_user(&conn, 1).unwrap().unwrap();
        assert_eq!(user1_session.id, session1);
        
        let user2_session = get_chat_session_by_user(&conn, 2).unwrap().unwrap();
        assert_eq!(user2_session.id, session2);
        
        // Verify each session has only its own messages
        let user1_messages = get_chat_messages_by_session(&conn, session1).unwrap();
        assert_eq!(user1_messages.len(), 1);
        assert_eq!(user1_messages[0].content, "User 1 message");
        
        let user2_messages = get_chat_messages_by_session(&conn, session2).unwrap();
        assert_eq!(user2_messages.len(), 1);
        assert_eq!(user2_messages[0].content, "User 2 message");
    }
}
