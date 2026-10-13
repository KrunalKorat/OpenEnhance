pub mod commands;
pub mod engines;
pub mod error;
pub mod events;
pub mod jobs;
pub mod media;
pub mod pipeline;
pub mod security;
pub mod storage;

use commands::{
    generate_thumbnail, get_app_info, get_engine_status, get_system_capabilities, inspect_media,
    list_models, open_output, pick_video_files, plan_resolution, reveal_in_folder, run_enhancement,
    run_frame_upscale,
};

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
            get_system_capabilities,
            get_engine_status,
            list_models,
            inspect_media,
            generate_thumbnail,
            pick_video_files,
            run_frame_upscale,
            plan_resolution,
            run_enhancement,
            open_output,
            reveal_in_folder,
        ])
        .run(tauri::generate_context!())
        .expect("error while running OpenEnhance application");
}
