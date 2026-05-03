use crate::services::adapter::{AgentAdapter, AgentCapabilities, AgentDetection, AgentRunParams, ModelOption, check_binary_in_path};
use async_trait::async_trait;
use tokio::process::Command;
use std::process::Stdio;

pub struct PiAdapter;

#[async_trait]
impl AgentAdapter for PiAdapter {
    fn id(&self) -> &'static str {
        "pi-agent"
    }

    fn display_name(&self) -> &'static str {
        "Pi Agent"
    }

    fn available_models(&self) -> Vec<ModelOption> {
        vec![
            ModelOption { id: "default".into(), label: "Default (CLI config)".into() },
            ModelOption { id: "anthropic/claude-sonnet-4-5".into(), label: "Claude Sonnet 4.5 (Anthropic)".into() },
            ModelOption { id: "anthropic/claude-opus-4-5".into(), label: "Claude Opus 4.5 (Anthropic)".into() },
            ModelOption { id: "openai/gpt-5".into(), label: "GPT-5 (OpenAI)".into() },
            ModelOption { id: "openai/o4-mini".into(), label: "o4-mini (OpenAI)".into() },
            ModelOption { id: "google/gemini-2.5-pro".into(), label: "Gemini 2.5 Pro (Google)".into() },
            ModelOption { id: "google/gemini-2.5-flash".into(), label: "Gemini 2.5 Flash (Google)".into() },
        ]
    }

    async fn detect(&self) -> AgentDetection {
        let path = check_binary_in_path("pi").await;
        AgentDetection {
            id: self.id().to_string(),
            display_name: self.display_name().to_string(),
            available: path.is_some(),
            executable_path: path,
            models: self.available_models(),
        }
    }

    fn capabilities(&self) -> AgentCapabilities {
        AgentCapabilities {
            streaming: true,
            native_skill_loading: false,
        }
    }

    async fn run(&self, params: AgentRunParams<'_>) -> Result<String, String> {
        let mut cmd = Command::new("pi");
        cmd.arg("-p").arg(params.user_prompt);
        
        if let Some(model) = params.model {
            if model != "default" {
                cmd.arg("--model").arg(model);
            }
        }
        
        cmd.current_dir(params.cwd)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        let child = cmd.spawn()
            .map_err(|e| format!("Failed to spawn pi agent: {}", e))?;

        let output = child.wait_with_output().await
            .map_err(|e| format!("Failed to wait on pi agent: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Pi Agent error ({}): {}", output.status, stderr));
        }

        let stdout = String::from_utf8_lossy(&output.stdout);
        let clean_stdout = strip_ansi_escapes(&stdout);
        Ok(clean_stdout.trim().to_string())
    }
}

fn strip_ansi_escapes(s: &str) -> String {
    let re = regex::Regex::new(r"\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K]").unwrap();
    re.replace_all(s, "").to_string()
}
