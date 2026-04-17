use crate::models::{AnswerFeedback, WordExplanation};
use serde::{Deserialize, Serialize};

const GROQ_API_URL: &str = "https://api.groq.com/openai/v1/chat/completions";
const MODEL: &str = "openai/gpt-oss-120b";

#[derive(Serialize)]
struct ChatRequest {
    model: String,
    messages: Vec<Message>,
    temperature: f64,
    max_tokens: u32,
    response_format: ResponseFormat,
}

#[derive(Serialize)]
struct ResponseFormat {
    r#type: String,
}

#[derive(Serialize, Deserialize)]
struct Message {
    role: String,
    content: String,
}

#[derive(Deserialize)]
struct ChatResponse {
    choices: Vec<Choice>,
}

#[derive(Deserialize)]
struct Choice {
    message: MessageContent,
}

#[derive(Deserialize)]
struct MessageContent {
    content: String,
}

pub async fn generate_words(
    api_key: &str,
    target_language: &str,
    native_language: &str,
    level: &str,
    count: i32,
    interests: &[String],
    exclude_words: &[String],
) -> Result<Vec<WordExplanation>, String> {
    let interests_str = if interests.is_empty() {
        "general vocabulary".to_string()
    } else {
        interests.join(", ")
    };

    let exclude_str = if exclude_words.is_empty() {
        "none".to_string()
    } else {
        exclude_words.join(", ")
    };

    let prompt = format!(
        r#"You are a language teaching assistant. Generate exactly {count} vocabulary words for a {level} level student learning {target_language}. The student's native language is {native_language}.

Topics of interest: {interests_str}
Words to exclude (already learned): {exclude_str}

For each word, provide a JSON object with these fields:
- word_text: the word in {target_language}
- translation: translation in {native_language}
- pronunciation: phonetic pronunciation guide
- explanation: clear, simple explanation in {native_language} (2-3 sentences)
- examples: array of 2-3 example sentences using the word (in {target_language} with {native_language} translation in parentheses)
- word_type: noun, verb, adjective, adverb, phrase, etc.
- difficulty_score: 0.0 to 1.0 based on difficulty

Return a JSON object with a "words" array containing exactly {count} word objects. Only return valid JSON, no markdown."#
    );

    let request = ChatRequest {
        model: MODEL.to_string(),
        messages: vec![Message {
            role: "user".to_string(),
            content: prompt,
        }],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: ResponseFormat {
            r#type: "json_object".to_string(),
        },
    };

    let client = reqwest::Client::new();
    let response = client
        .post(GROQ_API_URL)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&request)
        .send()
        .await
        .map_err(|e| format!("Failed to call Groq API: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(format!("Groq API error ({}): {}", status, body));
    }

    let chat_response: ChatResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse Groq response: {}", e))?;

    let content = chat_response
        .choices
        .first()
        .map(|c| c.message.content.clone())
        .unwrap_or_default();

    #[derive(Deserialize)]
    struct WordsWrapper {
        words: Vec<WordExplanation>,
    }

    let parsed: WordsWrapper = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse AI word list: {}. Raw: {}", e, &content[..content.len().min(500)]))?;

    Ok(parsed.words)
}

pub async fn check_answer(
    api_key: &str,
    word_text: &str,
    target_language: &str,
    native_language: &str,
    user_answer: &str,
    correct_answer: &str,
    level: &str,
) -> Result<AnswerFeedback, String> {
    let prompt = format!(
        r#"You are a friendly language tutor. A {level} level student learning {target_language} (native: {native_language}) was asked about the word "{word_text}".

Their answer: "{user_answer}"
Expected answer: "{correct_answer}"

Evaluate their answer. Return a JSON object with:
- is_correct: boolean (true if substantially correct, allowing minor typos/variations)
- correct_answer: the correct answer string
- explanation: why the answer is right or wrong, in {native_language} (2-3 sentences, encouraging tone)
- extra_examples: array of 2 additional example sentences using "{word_text}"
- encouragement: a short encouraging message in {native_language}

Only return valid JSON, no markdown."#
    );

    let request = ChatRequest {
        model: MODEL.to_string(),
        messages: vec![Message {
            role: "user".to_string(),
            content: prompt,
        }],
        temperature: 0.3,
        max_tokens: 1500,
        response_format: ResponseFormat {
            r#type: "json_object".to_string(),
        },
    };

    let client = reqwest::Client::new();
    let response = client
        .post(GROQ_API_URL)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&request)
        .send()
        .await
        .map_err(|e| format!("Failed to call Groq API: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(format!("Groq API error ({}): {}", status, body));
    }

    let chat_response: ChatResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse Groq response: {}", e))?;

    let content = chat_response
        .choices
        .first()
        .map(|c| c.message.content.clone())
        .unwrap_or_default();

    let feedback: AnswerFeedback = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse AI feedback: {}. Raw: {}", e, &content[..content.len().min(500)]))?;

    Ok(feedback)
}
