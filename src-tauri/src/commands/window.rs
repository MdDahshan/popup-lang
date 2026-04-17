use tauri::{AppHandle, Manager, Monitor, PhysicalPosition, PhysicalSize};

#[tauri::command]
pub async fn hide_popup_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("popup") {
        window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn show_popup_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("popup") {
        position_and_show_popup(&window).map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn position_and_show_popup(window: &tauri::WebviewWindow) -> tauri::Result<()> {
    if let Some(monitor) = window.current_monitor()? {
        let size = monitor.size();
        let scale_factor = monitor.scale_factor();
        let window_size = window.outer_size()?;
        
        let padding = 20.0 * scale_factor;
        
        let x = size.width as f64 - window_size.width as f64 - padding;
        let y = padding;
        
        window.set_position(tauri::Position::Physical(PhysicalPosition {
            x: x as i32,
            y: y as i32,
        }))?;
    }
    window.show()?;
    window.set_focus()?;
    Ok(())
}
