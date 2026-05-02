use tauri::State;
use crate::db::Database;
use crate::db::queries;
use crate::models::{Word, DailyWord};
use serde::Serialize;

#[derive(Serialize)]
pub struct DailyWordEntry {
    pub word: Word,
    pub daily_word: DailyWord,
}

#[tauri::command]
pub fn get_daily_words(db: State<Database>) -> Result<Vec<DailyWordEntry>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let user = queries::get_user(&conn)?
        .ok_or_else(|| "No user found. Please complete onboarding.".to_string())?;

    let today = chrono::Local::now().format("%Y-%m-%d").to_string();
    let results = queries::get_daily_words(&conn, user.id, &today)?;

    Ok(results
        .into_iter()
        .map(|(word, daily_word)| DailyWordEntry { word, daily_word })
        .collect())
}

#[tauri::command]
pub fn get_word_detail(db: State<Database>, word_id: i64) -> Result<Option<Word>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    queries::get_word_by_id(&conn, word_id)
}

#[tauri::command]
pub fn mark_word_learned(db: State<Database>, daily_word_id: i64) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    queries::mark_word_learned(&conn, daily_word_id)
}

#[tauri::command]
pub fn get_learned_words(db: State<Database>) -> Result<Vec<Word>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let user = queries::get_user(&conn)?
        .ok_or_else(|| "No user found.".to_string())?;
    queries::get_all_learned_words(&conn, user.id)
}
