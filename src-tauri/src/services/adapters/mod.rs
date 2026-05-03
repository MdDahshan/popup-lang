pub mod claude;
pub mod gemini;
pub mod kiro;
pub mod pi;
pub mod aider;
pub mod opencode;
pub mod coder;
pub mod groq;

use crate::services::adapter::AgentAdapter;

pub fn get_all_adapters() -> Vec<Box<dyn AgentAdapter>> {
    vec![
        Box::new(claude::ClaudeAdapter),
        Box::new(pi::PiAdapter),
        Box::new(kiro::KiroAdapter),
        Box::new(gemini::GeminiAdapter),
        Box::new(aider::AiderAdapter),
        Box::new(opencode::OpenCodeAdapter),
        Box::new(coder::CodexAdapter),
        Box::new(groq::GroqFallbackAdapter),
    ]
}
