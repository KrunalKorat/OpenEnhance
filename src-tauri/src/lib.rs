pub mod commands;
pub mod engines;
pub mod error;
pub mod events;
pub mod jobs;
pub mod media;
pub mod security;
pub mod storage;

use commands::{get_app_info, get_system_capabilities};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_app_info,
            get_system_capabilities
        ])
        .run(tauri::generate_context!())
        .expect("error while running OpenEnhance application");
}
