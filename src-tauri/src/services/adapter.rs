use std::path::Path;
use serde::{Deserialize, Serialize};
use async_trait::async_trait;
use tokio::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentCapabilities {
    pub streaming: bool,
    pub native_skill_loading: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelOption {
    pub id: String,
    pub label: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentDetection {
    pub id: String,
    pub display_name: String,
    pub executable_path: Option<String>,
    pub available: bool,
    pub models: Vec<ModelOption>,
}

pub struct AgentRunParams<'a> {
    pub cwd: &'a Path,
    pub system_prompt: &'a str,
    pub user_prompt: &'a str,
    pub config_dir: Option<&'a str>,
    pub model: Option<&'a str>,
}

#[async_trait]
pub trait AgentAdapter: Send + Sync {
    fn id(&self) -> &'static str;
    fn display_name(&self) -> &'static str;
    
    /// Return static list of models this provider supports
    fn available_models(&self) -> Vec<ModelOption>;
    
    /// Scan $PATH to detect if this CLI tool is installed
    async fn detect(&self) -> AgentDetection;
    
    /// Return what this agent supports
    fn capabilities(&self) -> AgentCapabilities;
    
    /// Execute the agent and capture its final output
    async fn run(&self, params: AgentRunParams<'_>) -> Result<String, String>;
}

/// Helper function to check if a binary exists in PATH
pub async fn check_binary_in_path(binary_name: &str) -> Option<String> {
    #[cfg(windows)]
    let check_cmd = "where";
    #[cfg(not(windows))]
    let check_cmd = "which";

    match Command::new(check_cmd).arg(binary_name).output().await {
        Ok(output) if output.status.success() => {
            let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if path.is_empty() {
                None
            } else {
                Some(path)
            }
        }
        _ => None,
    }
}
