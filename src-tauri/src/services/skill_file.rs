use crate::models::chat::UserContext;
use std::path::PathBuf;
use std::fs;
use std::io::Write;

pub struct SkillFileContext<'a> {
    pub target_language: &'a str,
    pub native_language: &'a str,
    pub level: &'a str,
    pub interests: &'a [String],
    pub total_words_learned: i64,
    pub quiz_accuracy: f64,
    pub streak_days: i64,
    pub recent_vocabulary: &'a [String],
    pub hardest_words: &'a [String],
}

pub fn generate_skill_content(ctx: &SkillFileContext) -> String {
    let mut prompt = format!(
        "# PopupLang — Language Tutor Agent\n\n\
        You are an expert, adaptive language tutor embedded in a desktop language-learning app.\n\n\
        ## Student Profile\n\
        - **Learning:** {}\n\
        - **Native language:** {}\n\
        - **Level:** {}\n",
        ctx.target_language,
        ctx.native_language,
        ctx.level
    );

    if !ctx.interests.is_empty() {
        prompt.push_str(&format!("- **Interests:** {}\n", ctx.interests.join(", ")));
    }

    prompt.push_str(&format!(
        "- **Words learned:** {}\n\
        - **Quiz accuracy:** {:.1}%\n\
        - **Current streak:** {} days\n\n",
        ctx.total_words_learned,
        ctx.quiz_accuracy,
        ctx.streak_days
    ));

    if !ctx.recent_vocabulary.is_empty() {
        prompt.push_str("## Known Vocabulary\n\
        The student has already learned these words (use them, build on them, don't re-teach):\n");
        prompt.push_str(&ctx.recent_vocabulary.join(", "));
        prompt.push_str("\n\n");
    }

    if !ctx.hardest_words.is_empty() {
        prompt.push_str("## Weak Areas\n\
        These words the student struggles with (reinforce naturally):\n");
        prompt.push_str(&ctx.hardest_words.join(", "));
        prompt.push_str("\n\n");
    }

    prompt.push_str("## Adaptive Behavior\n");
    if ctx.quiz_accuracy < 50.0 {
        prompt.push_str("Their accuracy is low. Simplify explanations. Use more native-language scaffolding. Shorter examples.\n\n");
    } else if ctx.quiz_accuracy < 80.0 {
        prompt.push_str("Their accuracy is good. Balanced mix of target and native language. Standard difficulty.\n\n");
    } else {
        prompt.push_str("Their accuracy is excellent. Challenge them. Use complex sentences, idioms, and subtle grammar.\n\n");
    }

    prompt.push_str(
        "## Core Rules\n\
        - You are a TOOL. Do exactly what is asked, then wait. Do NOT forcefully shift topics, unsolicitedly start new lessons, or try to run the conversation. The user is in charge.\n\
        - Be EXTREMELY minimal and direct. NO conversational filler, NO \"sure I can help\", NO \"here is the answer\", NO yapping. Just output the content.\n\
        - Use RICH MARKDOWN: tables, blockquotes, bold, lists, code blocks.\n\
        - ONE question per turn maximum. Do not bundle multiple challenges.\n\n\
        ## Interactive Quiz Formats\n\
        - If your challenge provides singular choices (MCQ, Picking), ALWAYS output the choices tightly in a code block with language `mcq`, with EXACTLY 4 options, exactly one option per line.\n\
        - If your challenge is a Matching challenge, ALWAYS output the pairs in a code block with language `matching`, where the target and its match are separated by a pipe `|`.\n\
        - If your challenge is open-ended (Translation, Typing, Fixing), ALWAYS output the challenge text/sentence FIRST, then an empty code block with language `input` at the very end.\n\n\
        ## Current Task\n\
        Respond to the user's latest message below.\n"
    );

    prompt
}

pub fn create_temp_work_dir(session_id: i64, content: &str) -> Result<PathBuf, String> {
    let tmp_dir = std::env::temp_dir().join(format!("popuplang-agent-{}", session_id));
    
    if !tmp_dir.exists() {
        fs::create_dir_all(&tmp_dir).map_err(|e| format!("Failed to create temp dir: {}", e))?;
    }

    // Write the various agent context files
    let file_names = ["CLAUDE.md", "GEMINI.md", "AGENTS.md"];
    
    for name in &file_names {
        let path = tmp_dir.join(name);
        fs::write(&path, content).map_err(|e| format!("Failed to write {}: {}", name, e))?;
    }

    // Write Kiro specific file
    let kiro_dir = tmp_dir.join(".kiro");
    if !kiro_dir.exists() {
        fs::create_dir_all(&kiro_dir).map_err(|e| format!("Failed to create .kiro dir: {}", e))?;
    }
    fs::write(kiro_dir.join("steering.md"), content)
        .map_err(|e| format!("Failed to write steering.md: {}", e))?;

    Ok(tmp_dir)
}
