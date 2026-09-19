mod db;
mod models;

use models::{List, Settings, Snapshot, Tag, Task};
use rusqlite::Connection;
use std::sync::Mutex;
use tauri::{Manager, State};

struct AppState {
    db: Mutex<Connection>,
}

#[derive(Debug, thiserror::Error)]
enum AppError {
    #[error("{0}")]
    Db(#[from] rusqlite::Error),
    #[error("{0}")]
    Io(#[from] std::io::Error),
    #[error("{0}")]
    Lock(String),
    #[error("{0}")]
    Path(String),
}

impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

#[tauri::command]
fn load_snapshot(state: State<AppState>) -> Result<Snapshot, AppError> {
    let conn = state.db.lock().map_err(|e| AppError::Lock(e.to_string()))?;
    Ok(db::load_snapshot(&conn)?)
}

#[tauri::command]
fn save_list(state: State<AppState>, list: List) -> Result<(), AppError> {
    let conn = state.db.lock().map_err(|e| AppError::Lock(e.to_string()))?;
    db::save_list(&conn, &list)?;
    Ok(())
}

#[tauri::command]
fn delete_list(state: State<AppState>, id: String) -> Result<(), AppError> {
    let conn = state.db.lock().map_err(|e| AppError::Lock(e.to_string()))?;
    db::delete_list(&conn, &id)?;
    Ok(())
}

#[tauri::command]
fn save_tag(state: State<AppState>, tag: Tag) -> Result<(), AppError> {
    let conn = state.db.lock().map_err(|e| AppError::Lock(e.to_string()))?;
    db::save_tag(&conn, &tag)?;
    Ok(())
}

#[tauri::command]
fn delete_tag(state: State<AppState>, id: String) -> Result<(), AppError> {
    let conn = state.db.lock().map_err(|e| AppError::Lock(e.to_string()))?;
    db::delete_tag(&conn, &id)?;
    Ok(())
}

#[tauri::command]
fn save_task(state: State<AppState>, task: Task) -> Result<(), AppError> {
    let conn = state.db.lock().map_err(|e| AppError::Lock(e.to_string()))?;
    db::save_task(&conn, &task)?;
    Ok(())
}

#[tauri::command]
fn delete_task(state: State<AppState>, id: String) -> Result<(), AppError> {
    let conn = state.db.lock().map_err(|e| AppError::Lock(e.to_string()))?;
    db::delete_task(&conn, &id)?;
    Ok(())
}

#[tauri::command]
fn save_settings(state: State<AppState>, settings: Settings) -> Result<(), AppError> {
    let conn = state.db.lock().map_err(|e| AppError::Lock(e.to_string()))?;
    db::save_settings(&conn, &settings)?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let dir = app
                .path()
                .app_data_dir()
                .map_err(|e| AppError::Path(e.to_string()))?;
            std::fs::create_dir_all(&dir)?;
            let conn = Connection::open(dir.join("cortex.db"))?;
            db::migrate(&conn)?;
            app.manage(AppState {
                db: Mutex::new(conn),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            load_snapshot,
            save_list,
            delete_list,
            save_tag,
            delete_tag,
            save_task,
            delete_task,
            save_settings
        ])
        .run(tauri::generate_context!())
        .expect("error while running Cortex");
}
