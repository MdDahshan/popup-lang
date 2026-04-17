use tauri::State;
use crate::db::Database;
use crate::db::queries;
use crate::models::User;

#[tauri::command]
pub fn get_user(db: State<Database>) -> Result<Option<User>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    queries::get_user(&conn)
}

#[tauri::command]
pub fn save_user(db: State<Database>, user: User) -> Result<i64, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    queries::save_user(&conn, &user)
}
