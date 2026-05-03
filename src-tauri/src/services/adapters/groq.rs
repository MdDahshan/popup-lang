use crate::services::adapter::{AgentAdapter, AgentCapabilities, AgentDetection, AgentRunParams, ModelOption};
use async_trait::async_trait;

pub struct GroqFallbackAdapter;

#[async_trait]
impl AgentAdapter for GroqFallbackAdapter {
    fn id(&self) -> &'static str {
        "groq-api"
    }

    fn display_name(&self) -> &'static str {
        "Groq API (Fallback)"
    }

    fn available_models(&self) -> Vec<ModelOption> {
        vec![
            ModelOption { id: "llama-3.3-70b-versatile".into(), label: "Llama 3.3 70B Versatile".into() },
            ModelOption { id: "llama-3.1-8b-instant".into(), label: "Llama 3.1 8B Instant".into() },
            ModelOption { id: "mixtral-8x7b-32768".into(), label: "Mixtral 8x7B".into() },
            ModelOption { id: "gemma2-9b-it".into(), label: "Gemma 2 9B".into() },
        ]
    }

    async fn detect(&self) -> AgentDetection {
        AgentDetection {
            id: self.id().to_string(),
            display_name: self.display_name().to_string(),
            available: true,
            executable_path: None,
            models: self.available_models(),
        }
    }

    fn capabilities(&self) -> AgentCapabilities {
        AgentCapabilities {
            streaming: false,
            native_skill_loading: false,
        }
    }

    async fn run(&self, params: AgentRunParams<'_>) -> Result<String, String> {
        let api_key = params.config_dir.ok_or_else(|| "Groq API key not provided".to_string())?;

        // Determine model: use user-selected model, or default
        let model = params.model.unwrap_or("llama-3.3-70b-versatile");

        let api_messages = vec![
            serde_json::json!({
                "role": "system",
                "content": params.system_prompt
            }),
            serde_json::json!({
                "role": "user",
                "content": params.user_prompt
            })
        ];

        let request = serde_json::json!({
            "model": model,
            "messages": api_messages,
            "temperature": 0.7,
            "max_tokens": 4000,
        });

        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(60))
            .build()
            .map_err(|e| format!("Failed to create client: {}", e))?;

        let response = client
            .post("https://api.groq.com/openai/v1/chat/completions")
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

        let chat_response: serde_json::Value = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        let content = chat_response["choices"][0]["message"]["content"]
            .as_str()
            .ok_or_else(|| "No content in response".to_string())?;

        Ok(content.to_string())
    }
}
