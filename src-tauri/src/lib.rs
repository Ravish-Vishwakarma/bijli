use arboard::Clipboard;
use image::GenericImageView;
use tauri::Manager;
use walkdir::WalkDir;

// ---------------- COMMANDS ----------------

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

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

// ---------------- RUN ----------------

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_tray::init()) // ✅ tray is a plugin in v2
        .invoke_handler(tauri::generate_handler![greet, scan_memes, copy_image])
        .setup(|app| {
            let handle = app.handle();

            // TRAY
            use tauri_plugin_tray::{TrayIconBuilder, TrayIconEvent};

            TrayIconBuilder::new(app)
                .on_tray_icon_event(move |_, event| {
                    if let TrayIconEvent::Click { .. } = event {
                        if let Some(window) = handle.get_webview_window("main") {
                            if window.is_visible().unwrap() {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build()?;

            // GLOBAL SHORTCUT
            use tauri_plugin_global_shortcut::GlobalShortcutExt;

            app.global_shortcut().register("Ctrl+Space", move || {
                if let Some(window) = handle.get_webview_window("main") {
                    if window.is_visible().unwrap() {
                        let _ = window.hide();
                    } else {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            })?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
