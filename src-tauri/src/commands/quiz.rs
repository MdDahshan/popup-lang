use tauri::State;
use crate::db::Database;
use crate::db::queries;
use crate::models::{QuizAttempt, AnswerFeedback, QuizQuestion};
use crate::services::groq;
use rand::seq::SliceRandom;

#[tauri::command]
pub fn generate_quiz(db: State<Database>, single_question: Option<bool>) -> Result<Vec<QuizQuestion>, String> {
    let single_question = single_question.unwrap_or(false);
    
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let user = queries::get_user(&conn)?
        .ok_or_else(|| "No user found".to_string())?;

    let today = chrono::Local::now().format("%Y-%m-%d").to_string();
    let daily_words = queries::get_daily_words(&conn, user.id, &today)?;

    if daily_words.is_empty() {
        return Err("No words available for today. Generate daily words first.".to_string());
    }

    let mut questions: Vec<QuizQuestion> = Vec::new();
    let question_types = vec!["translate", "multiple_choice", "fill_blank"];
    let mut rng = rand::thread_rng();

    // If single_question is true, pick one random word
    let words_to_quiz: Vec<_> = if single_question {
        daily_words.choose(&mut rng).into_iter().collect()
    } else {
        daily_words.iter().collect()
    };

    for (word, _daily_word) in &words_to_quiz {
        let qtype = question_types.choose(&mut rng).unwrap_or(&"translate");

        match *qtype {
            "translate" => {
                questions.push(QuizQuestion {
                    word_id: word.id,
                    question_type: "translate".to_string(),
                    prompt: format!("What does \"{}\" mean?", word.word_text),
                    options: None,
                    correct_answer: word.translation.clone(),
                });
            }
            "multiple_choice" => {
                let mut options: Vec<String> = daily_words
                    .iter()
                    .filter(|(w, _)| w.id != word.id)
                    .map(|(w, _)| w.translation.clone())
                    .take(3)
                    .collect();
                options.push(word.translation.clone());
                options.shuffle(&mut rng);

                questions.push(QuizQuestion {
                    word_id: word.id,
                    question_type: "multiple_choice".to_string(),
                    prompt: format!("Choose the correct meaning of \"{}\"", word.word_text),
                    options: Some(options),
                    correct_answer: word.translation.clone(),
                });
            }
            "fill_blank" => {
                let example = word.examples.first().cloned().unwrap_or_else(|| {
                    format!("Please use {} in a sentence.", word.word_text)
                });
                let mut blanked = example.replace(&word.word_text, "______");
                
                // Also handle capitalized versions (e.g. "Innovation" instead of "innovation")
                let mut chars = word.word_text.chars();
                let capitalized = match chars.next() {
                    None => String::new(),
                    Some(f) => f.to_uppercase().collect::<String>() + chars.as_str(),
                };
                blanked = blanked.replace(&capitalized, "______");
                blanked = blanked.replace(&word.word_text.to_lowercase(), "______");

                questions.push(QuizQuestion {
                    word_id: word.id,
                    question_type: "fill_blank".to_string(),
                    prompt: format!("Fill in the blank: {}", blanked),
                    options: None,
                    correct_answer: word.word_text.clone(),
                });
            }
            _ => {}
        }
    }

    questions.shuffle(&mut rng);
    Ok(questions)
}

#[tauri::command]
pub async fn submit_quiz_answer(
    db: State<'_, Database>,
    word_id: i64,
    question_type: String,
    user_answer: String,
    correct_answer: String,
) -> Result<AnswerFeedback, String> {
    let (api_key, user_data, word_data) = {
        let conn = db.conn.lock().map_err(|e| e.to_string())?;
        let api_key = queries::get_setting(&conn, "groq_api_key")?
            .ok_or_else(|| "API key not configured".to_string())?;
        let user = queries::get_user(&conn)?
            .ok_or_else(|| "No user found".to_string())?;
        let word = queries::get_word_by_id(&conn, word_id)?
            .ok_or_else(|| "Word not found".to_string())?;
        (api_key, user, word)
    };

    let feedback = groq::check_answer(
        &api_key,
        &word_data.word_text,
        &word_data.target_language,
        &user_data.native_language,
        &user_answer,
        &correct_answer,
        &user_data.level,
    )
    .await?;

    // Save attempt
    {
        let conn = db.conn.lock().map_err(|e| e.to_string())?;
        let attempt = QuizAttempt {
            id: 0,
            user_id: user_data.id,
            word_id,
            question_type,
            user_answer,
            is_correct: feedback.is_correct,
            ai_feedback: Some(feedback.explanation.clone()),
            created_at: String::new(),
        };
        queries::record_quiz_attempt(&conn, &attempt)?;
    }

    Ok(feedback)
}
