use tauri::State;
use crate::db::Database;
use crate::db::queries;
use crate::models::DashboardStats;

#[tauri::command]
pub fn save_api_key(db: State<Database>, api_key: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    queries::set_setting(&conn, "groq_api_key", &api_key)
}

#[tauri::command]
pub fn get_api_key(db: State<Database>) -> Result<Option<String>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    queries::get_setting(&conn, "groq_api_key")
}

#[tauri::command]
pub fn get_dashboard_stats(db: State<Database>) -> Result<DashboardStats, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let user = queries::get_user(&conn)?
        .ok_or_else(|| "No user found".to_string())?;
    queries::get_dashboard_stats(&conn, user.id)
}

#[tauri::command]
pub fn get_setting(db: State<Database>, key: String) -> Result<Option<String>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    queries::get_setting(&conn, &key)
}

#[tauri::command]
pub fn set_setting(db: State<Database>, key: String, value: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    queries::set_setting(&conn, &key, &value)
}
