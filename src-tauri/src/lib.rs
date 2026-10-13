pub mod commands;
pub mod engines;
pub mod error;
pub mod events;
pub mod jobs;
pub mod media;
pub mod pipeline;
pub mod queue;
pub mod security;
pub mod storage;

use commands::{
    cancel_job, clear_completed_jobs, create_job, generate_thumbnail, get_app_info,
    get_engine_status, get_job, get_system_capabilities, inspect_media, list_jobs, list_models,
    open_output, pause_job, pause_queue, pick_video_files, plan_resolution, process_queue_step,
    recover_jobs, remove_job, resume_job, retry_job, reveal_in_folder, run_enhancement,
    run_frame_upscale, start_queue,
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
            create_job,
            list_jobs,
            get_job,
            cancel_job,
            pause_job,
            resume_job,
            retry_job,
            remove_job,
            clear_completed_jobs,
            start_queue,
            pause_queue,
            recover_jobs,
            process_queue_step,
        ])
        .run(tauri::generate_context!())
        .expect("error while running OpenEnhance application");
}
