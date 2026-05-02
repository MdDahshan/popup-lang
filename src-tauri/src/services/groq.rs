use crate::models::{AnswerFeedback, WordExplanation, UserContext, WordContext};
use serde::{Deserialize, Serialize};
use std::time::Duration;

const GROQ_API_URL: &str = "https://api.groq.com/openai/v1/chat/completions";
const MODEL: &str = "openai/gpt-oss-120b";
const CHAT_TIMEOUT_SECS: u64 = 30;
const MAX_RETRIES: u32 = 2;

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

#[derive(Serialize, Deserialize, Clone)]
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

/// Chat message for conversation history
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatHistoryMessage {
    pub role: String,
    pub content: String,
}

/// Perform chat completion with conversation history and context
pub async fn chat_completion(
    api_key: &str,
    messages: Vec<ChatHistoryMessage>,
    user_context: &UserContext,
    word_context: Option<&WordContext>,
) -> Result<String, String> {
    // Build system prompt with user's language learning context
    let system_prompt = build_system_prompt(user_context, word_context);
    
    // Prepare messages with system prompt first
    let mut api_messages = vec![Message {
        role: "system".to_string(),
        content: system_prompt,
    }];
    
    // Add conversation history
    for msg in messages {
        api_messages.push(Message {
            role: msg.role,
            content: msg.content,
        });
    }
    
    // Attempt with retry logic
    let mut last_error = String::new();
    for attempt in 0..=MAX_RETRIES {
        if attempt > 0 {
            // Exponential backoff: 1s, 2s
            let delay = Duration::from_secs(2u64.pow(attempt - 1));
            tokio::time::sleep(delay).await;
        }
        
        match send_chat_request(api_key, &api_messages).await {
            Ok(response) => return Ok(response),
            Err(e) => {
                last_error = e.clone();
                
                // Don't retry on non-transient errors
                if is_non_retryable_error(&e) {
                    return Err(e);
                }
                
                // Continue to next retry
                if attempt < MAX_RETRIES {
                    continue;
                }
            }
        }
    }
    
    Err(format!("Failed after {} retries: {}", MAX_RETRIES, last_error))
}

/// Build system prompt with user context and optional word context
fn build_system_prompt(user_context: &UserContext, word_context: Option<&WordContext>) -> String {
    let mut prompt = format!(
        "You are a friendly and knowledgeable language tutor. You are helping a {} level student who is learning {} and speaks {} as their native language.",
        user_context.level,
        user_context.target_language,
        user_context.native_language
    );
    
    if !user_context.interests.is_empty() {
        prompt.push_str(&format!(
            " The student is interested in: {}.",
            user_context.interests.join(", ")
        ));
    }
    
    prompt.push_str(&format!(
        "\n\nCORE BEHAVIOR:\n\
        - You are a tool for the user. Do exactly what is asked and wait. Do NOT forcefully shift topics, unsolicitedly start new lessons, or try to run the conversation. The user is in charge.\n\
        - Be CLEVER and challenging. If quizzing or testing the user, NEVER reveal the answer inside the question wrapper. Make them think.\n\
        - Be EXTREMELY minimal and direct. NO conversational filler, NO \"sure I can help\", NO \"here is the answer\", NO yapping. Just output the content.\n\
        - FORMATTING: Exploit FULL rich Markdown to make output beautiful. Use `> blockquotes` for rules, Tables for comparisons, `**bold**` for highlighting, `- lists` for variations, and `code blocks` for syntax.\n\
        \n\
        INTERACTIVE QUIZZES:\n\
        - RULE 1: NEVER ask more than one question per turn under any circumstance. Do not bundle multiple challenges.\n\
        - RULE 2: ALWAYS write a clear descriptive question text BEFORE opening a ````mcq` or ````matching` block. Never throw choices without written context.\n\
        - A quiz session MUST default to 2-5 questions total. HOWEVER, if the user explicitly requests a specific test scale (e.g. 10 questions), you MUST rigidly obey their requested limit.\n\
        - VARY YOUR CHALLENGES: Do not strictly ask direct vocabulary choices. Use \"Matching pairs\", \"Fill in the blanks\", \"Translate this sentence\", \"Fix the grammar mistake\", \"Respond to this situation\", etc.\n\
        - If your challenge provides singular choices (MCQ, Picking), ALWAYS output the choices tightly in a code block with language `mcq`, with EXACTLY 4 options, exactly one option per line.\n\
          Example:\n\
          What is the synonym of Happy?\n\
          ```mcq\n\
          Sad\n\
          Joyful\n\
          ```\n\
        - If your challenge is a Matching challenge, ALWAYS output the pairs in a code block with language `matching`, where the target and its match are separated by a pipe `|`.\n\
          Example:\n\
          Match these words with their translations:\n\
          ```matching\n\
          Apple|تفاح\n\
          Car|سيارة\n\
          ```\n\
        - If your challenge is open-ended (Translation, Typing, Fixing), ALWAYS output the challenge text/sentence FIRST, then an empty code block with language `input` at the very end.\n\
          Example:\n\
          Translate this sentence to English: 'Je mange une pomme'\n\
          ```input\n\
          ```\n\
        \n\
        LANGUAGE RULES:\n\
        - Explain concepts in {}\n\
        - Provide examples in {} with {} translations\n\
        - Target {} level strictly",
        user_context.native_language,
        user_context.target_language,
        user_context.native_language,
        user_context.level
    ));
    
    // Add word context if provided
    if let Some(word) = word_context {
        prompt.push_str(&format!(
            "\n\nContext word:\n\
            - Word: {} ({})\n\
            - Translation: {}\n\
            - Pronunciation: {}",
            word.word_text,
            user_context.target_language,
            word.translation,
            word.pronunciation,
        ));

        if let Some(ref explanation) = word.explanation {
            prompt.push_str(&format!("\n- Explanation: {}", explanation));
        }
        if let Some(ref word_type) = word.word_type {
            prompt.push_str(&format!("\n- Word type: {}", word_type));
        }
        if let Some(ref examples) = word.examples {
            if !examples.is_empty() {
                prompt.push_str(&format!("\n- Examples: {}", examples.join("; ")));
            }
        }

        prompt.push_str(&format!(
            "\n\nTask: Provide a minimal, highly structured Markdown explanation including:\n\
            1. Short definition in {}\n\
            2. A Markdown TABLE with 2-3 usage examples (Columns: {}, {})\n\
            3. Key grammar note if applicable",
            user_context.native_language,
            user_context.target_language,
            user_context.native_language
        ));
    }
    
    prompt
}

/// Send chat request to Groq API with timeout
async fn send_chat_request(api_key: &str, messages: &[Message]) -> Result<String, String> {
    let request = ChatRequest {
        model: MODEL.to_string(),
        messages: messages.to_vec(),
        temperature: 0.7,
        max_tokens: 2000,
        response_format: ResponseFormat {
            r#type: "text".to_string(),
        },
    };
    
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(CHAT_TIMEOUT_SECS))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;
    
    let response = client
        .post(GROQ_API_URL)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&request)
        .send()
        .await
        .map_err(|e| {
            if e.is_timeout() {
                "Request timed out after 30 seconds. Please try again.".to_string()
            } else if e.is_connect() {
                "Network connection error. Please check your internet connection.".to_string()
            } else {
                format!("Failed to call Groq API: {}", e)
            }
        })?;
    
    let status = response.status();
    if !status.is_success() {
        let body = response.text().await.unwrap_or_default();
        
        // Parse error for better messages
        if status.as_u16() == 401 {
            return Err("Invalid API key. Please check your settings.".to_string());
        } else if status.as_u16() == 429 {
            return Err("Rate limit exceeded. Please wait a moment and try again.".to_string());
        } else if status.as_u16() >= 500 {
            return Err(format!("Groq service error ({}). This is a temporary issue, please try again.", status));
        }
        
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
        .ok_or_else(|| "No response from AI".to_string())?;
    
    Ok(content)
}

/// Check if error is non-retryable (don't retry on auth, validation errors)
fn is_non_retryable_error(error: &str) -> bool {
    error.contains("Invalid API key")
        || error.contains("Rate limit exceeded")
        || error.contains("timed out")
}


#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_build_system_prompt_basic() {
        let user_context = UserContext {
            target_language: "Spanish".to_string(),
            native_language: "English".to_string(),
            level: "beginner".to_string(),
            interests: vec![],
        };

        let prompt = build_system_prompt(&user_context, None);

        assert!(prompt.contains("Spanish"));
        assert!(prompt.contains("English"));
        assert!(prompt.contains("beginner"));
        assert!(prompt.contains("language tutor"));
    }

    #[test]
    fn test_build_system_prompt_with_interests() {
        let user_context = UserContext {
            target_language: "French".to_string(),
            native_language: "English".to_string(),
            level: "intermediate".to_string(),
            interests: vec!["cooking".to_string(), "travel".to_string()],
        };

        let prompt = build_system_prompt(&user_context, None);

        assert!(prompt.contains("cooking"));
        assert!(prompt.contains("travel"));
        assert!(prompt.contains("intermediate"));
    }

    #[test]
    fn test_build_system_prompt_with_word_context() {
        let user_context = UserContext {
            target_language: "Arabic".to_string(),
            native_language: "English".to_string(),
            level: "beginner".to_string(),
            interests: vec![],
        };

        let word_context = WordContext {
            word_id: 1,
            word_text: "مرحبا".to_string(),
            translation: "hello".to_string(),
            pronunciation: "marhaba".to_string(),
            explanation: Some("A common Arabic greeting".to_string()),
            word_type: Some("noun".to_string()),
            examples: Some(vec!["مرحبا يا صديقي".to_string()]),
        };

        let prompt = build_system_prompt(&user_context, Some(&word_context));

        assert!(prompt.contains("مرحبا"));
        assert!(prompt.contains("hello"));
        assert!(prompt.contains("marhaba"));
        assert!(prompt.contains("detailed explanation"));
    }

    #[test]
    fn test_is_non_retryable_error() {
        assert!(is_non_retryable_error("Invalid API key"));
        assert!(is_non_retryable_error("Rate limit exceeded"));
        assert!(is_non_retryable_error("Request timed out"));
        assert!(!is_non_retryable_error("Network connection error"));
        assert!(!is_non_retryable_error("Groq service error (500)"));
    }
}
