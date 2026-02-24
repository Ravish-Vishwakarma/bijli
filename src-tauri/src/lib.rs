// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}
use std::fs;
#[tauri::command]
fn scan_memes(folder_path: String) -> Vec<String> {
    let mut files = Vec::new();

    if let Ok(entries) = fs::read_dir(folder_path) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Some(ext) = path.extension() {
                    let ext = ext.to_string_lossy().to_lowercase();
                    if ["png", "jpg", "jpeg", "webp", "gif"].contains(&ext.as_str()) {
                        files.push(path.to_string_lossy().to_string());
                    }
                }
            }
        }
    }

    files
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, scan_memes])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
