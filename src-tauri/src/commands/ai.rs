use tauri::State;
use crate::db::Database;
use crate::db::queries;
use crate::models::WordExplanation;
use crate::services::groq;

#[tauri::command]
pub async fn generate_daily_words(db: State<'_, Database>, force_new: Option<bool>) -> Result<Vec<WordExplanation>, String> {
    let force_new = force_new.unwrap_or(false);
    
    let (api_key, user, exclude_words) = {
        let conn = db.conn.lock().map_err(|e| e.to_string())?;
        let api_key = queries::get_setting(&conn, "groq_api_key")?
            .ok_or_else(|| "API key not configured. Please set your Groq API key in Settings.".to_string())?;
        let user = queries::get_user(&conn)?
            .ok_or_else(|| "No user found. Please complete onboarding.".to_string())?;

        let today = chrono::Local::now().format("%Y-%m-%d").to_string();
        
        // If force_new is true, delete existing words for today
        if force_new {
            // Delete existing daily words for today
            queries::delete_daily_words_for_date(&conn, user.id, &today)?;
        } else {
            // Check if today already has words
            let existing = queries::get_daily_words(&conn, user.id, &today)?;
            if !existing.is_empty() {
                let words: Vec<WordExplanation> = existing.into_iter().map(|(w, _)| {
                    WordExplanation {
                        word_text: w.word_text,
                        translation: w.translation,
                        pronunciation: w.pronunciation,
                        explanation: w.explanation,
                        examples: w.examples,
                        word_type: w.word_type,
                        difficulty_score: w.difficulty_score,
                    }
                }).collect();
                return Ok(words);
            }
        }

        let exclude = queries::get_learned_word_texts(&conn, user.id)?;
        (api_key, user, exclude)
    };

    // Call Groq AI to generate words
    let words = groq::generate_words(
        &api_key,
        &user.target_language,
        &user.native_language,
        &user.level,
        user.daily_word_count,
        &user.interests,
        &exclude_words,
    )
    .await?;

    // Save words to database
    {
        let conn = db.conn.lock().map_err(|e| e.to_string())?;
        let today = chrono::Local::now().format("%Y-%m-%d").to_string();
        let set = queries::get_or_create_daily_set(&conn, user.id, &today)?;

        for (i, word) in words.iter().enumerate() {
            let word_id = queries::insert_word(&conn, word, &user.target_language)?;
            queries::add_word_to_set(&conn, set.id, word_id, i as i32)?;
        }
    }

    Ok(words)
}
