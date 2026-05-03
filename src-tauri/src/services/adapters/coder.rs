use crate::services::adapter::{AgentAdapter, AgentCapabilities, AgentDetection, AgentRunParams, ModelOption, check_binary_in_path};
use async_trait::async_trait;
use tokio::process::Command;
use std::process::Stdio;

pub struct CodexAdapter;

#[async_trait]
impl AgentAdapter for CodexAdapter {
    fn id(&self) -> &'static str {
        "codex"
    }

    fn display_name(&self) -> &'static str {
        "Codex CLI"
    }

    fn available_models(&self) -> Vec<ModelOption> {
        vec![
            ModelOption { id: "default".into(), label: "Default (CLI config)".into() },
            ModelOption { id: "gpt-5-codex".into(), label: "GPT-5 Codex".into() },
            ModelOption { id: "gpt-5".into(), label: "GPT-5".into() },
            ModelOption { id: "o3".into(), label: "o3".into() },
            ModelOption { id: "o4-mini".into(), label: "o4-mini".into() },
        ]
    }

    async fn detect(&self) -> AgentDetection {
        let path = check_binary_in_path("codex").await;
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
            streaming: false,
            native_skill_loading: false,
        }
    }

    async fn run(&self, params: AgentRunParams<'_>) -> Result<String, String> {
        let mut cmd = Command::new("codex");
        cmd.arg("exec")
            .arg("--json")
            .arg("--full-auto");
        
        if let Some(model) = params.model {
            if model != "default" {
                cmd.arg("--model").arg(model);
            }
        }
        
        cmd.arg(params.user_prompt)
            .current_dir(params.cwd)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        let child = cmd.spawn()
            .map_err(|e| format!("Failed to spawn codex: {}", e))?;

        let output = child.wait_with_output().await
            .map_err(|e| format!("Failed to wait on codex: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Codex CLI error ({}): {}", output.status, stderr));
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
