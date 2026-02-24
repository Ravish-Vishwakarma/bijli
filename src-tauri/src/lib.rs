// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}
use walkdir::WalkDir;

#[tauri::command]
fn scan_memes(folder_path: String) -> Vec<String> {
    let mut files = Vec::new();

    for entry in WalkDir::new(folder_path).into_iter().filter_map(|e| e.ok()) {
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

    files
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![greet, scan_memes, copy_image])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

use arboard::Clipboard;
use image::GenericImageView;

#[tauri::command]
fn copy_image(path: String) -> Result<(), String> {
    let img = image::open(&path).map_err(|e| e.to_string())?;
    let rgba = img.to_rgba8();
    let (width, height) = img.dimensions();

    let mut clipboard = Clipboard::new().map_err(|e| e.to_string())?;

    clipboard
        .set_image(arboard::ImageData {
            width: width as usize,
            height: height as usize,
            bytes: std::borrow::Cow::Owned(rgba.into_raw()),
        })
        .map_err(|e| e.to_string())?;

    Ok(())
}
