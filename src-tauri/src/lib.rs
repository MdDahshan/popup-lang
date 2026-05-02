mod commands;
mod db;
mod models;
mod services;

use db::Database;
use tauri::{Manager, menu::{Menu, MenuItem}, tray::TrayIconBuilder};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_dir = dirs::data_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("."))
        .join("com.popuplang.app");

    let database = Database::new(&app_dir)
        .expect("Failed to initialize database");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(database)
        .setup(|app| {
            // Configure System Tray
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let show_i = MenuItem::with_id(app, "show", "Open Dashboard", true, None::<&str>)?;
            let popup_i = MenuItem::with_id(app, "popup", "Quiz Now", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &popup_i, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                 .icon(app.default_window_icon().unwrap().clone())
                 .menu(&menu)
                 .on_menu_event(|app, event| match event.id.as_ref() {
                     "quit" => {
                         std::process::exit(0);
                     }
                     "show" => {
                         if let Some(window) = app.get_webview_window("main") {
                             window.show().unwrap();
                             window.set_focus().unwrap();
                         }
                     }
                     "popup" => {
                         let future = commands::window::show_popup_window(app.clone());
                         tauri::async_runtime::spawn(async move {
                             let _ = future.await;
                         });
                     }
                     _ => {}
                 })
                 .build(app)?;

            // Background Reminder Loop Component
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                // Wait 10 seconds before starting the loop (give app time to initialize)
                tokio::time::sleep(std::time::Duration::from_secs(10)).await;
                
                println!("[Background] Starting popup reminder loop...");
                
                loop {
                    let (reminder_enabled, interval_minutes) = {
                        let state = app_handle.state::<Database>();
                        let db = state.conn.lock().unwrap();
                        
                        let enabled: bool = db.query_row(
                            "SELECT reminder_enabled FROM users LIMIT 1",
                            [],
                            |row| Ok(row.get::<_, i32>(0)? == 1)
                        ).unwrap_or(true);
                        
                        let interval = db.query_row(
                            "SELECT value FROM app_settings WHERE key = 'popup_interval'",
                            [],
                            |row| {
                                let val: String = row.get(0)?;
                                Ok(val.parse::<u64>().unwrap_or(1))
                            }
                        ).unwrap_or(1); // default 1 minute
                        
                        (enabled, interval)
                    };
                    
                    let interval_seconds = interval_minutes * 60;
                    println!("[Background] Next popup in {} minutes ({} seconds) - Enabled: {}", interval_minutes, interval_seconds, reminder_enabled);
                    
                    // Wait for the configured interval
                    tokio::time::sleep(std::time::Duration::from_secs(interval_seconds)).await;
                    
                    if reminder_enabled {
                        println!("[Background] Showing popup now...");
                        
                        // Show popup window - don't spawn a new task, just call directly
                        if let Err(e) = commands::window::show_popup_window(app_handle.clone()).await {
                            eprintln!("[Background] Failed to show popup: {}", e);
                        }
                    } else {
                        println!("[Background] Reminders disabled, skipping popup.");
                    }
                }
            });

            Ok(())
        })
        .on_window_event(|window, event| match event {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                // Intercept close for both windows. Only hide them.
                window.hide().unwrap();
                api.prevent_close();
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            commands::user::get_user,
            commands::user::save_user,
            commands::words::get_daily_words,
            commands::words::get_word_detail,
            commands::words::mark_word_learned,
            commands::words::get_learned_words,
            commands::quiz::generate_quiz,
            commands::quiz::submit_quiz_answer,
            commands::ai::generate_daily_words,
            commands::settings::save_api_key,
            commands::settings::get_api_key,
            commands::settings::get_dashboard_stats,
            commands::settings::get_setting,
            commands::settings::set_setting,
            commands::window::hide_popup_window,
            commands::window::show_popup_window,
            commands::chat::send_chat_message,
            commands::chat::get_chat_messages,
            commands::chat::clear_chat_history,
            commands::chat::get_or_create_session,
            commands::chat::get_chat_sessions,
            commands::chat::create_chat_session,
            commands::chat::set_active_chat_session,
            commands::chat::rename_chat_session,
            commands::chat::delete_chat_session,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
