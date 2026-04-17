pub mod migrations;
pub mod queries;

use rusqlite::Connection;
use std::sync::Mutex;

pub struct Database {
    pub conn: Mutex<Connection>,
}

impl Database {
    pub fn new(app_dir: &std::path::Path) -> Result<Self, String> {
        std::fs::create_dir_all(app_dir).map_err(|e| format!("Failed to create app dir: {}", e))?;
        let db_path = app_dir.join("popuplang.db");
        let conn = Connection::open(&db_path)
            .map_err(|e| format!("Failed to open database: {}", e))?;

        conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")
            .map_err(|e| format!("Failed to set pragmas: {}", e))?;

        migrations::run_migrations(&conn)
            .map_err(|e| format!("Failed to run migrations: {}", e))?;

        Ok(Database {
            conn: Mutex::new(conn),
        })
    }
}
