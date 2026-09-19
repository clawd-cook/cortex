use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct List {
    pub id: String,
    pub name: String,
    pub emoji: String,
    pub color: String,
    pub sort_order: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Tag {
    pub id: String,
    pub name: String,
    pub color: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Task {
    pub id: String,
    pub title: String,
    pub list_id: Option<String>,
    pub start_date: Option<String>,
    pub due_date: Option<String>,
    pub all_day: bool,
    pub priority: i32,
    pub status: String,
    pub notes: String,
    pub completed_at: Option<String>,
    pub tag_ids: Vec<String>,
    pub sort_order: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub week_starts_on: u8,
    pub show_completed: bool,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            week_starts_on: 1,
            show_completed: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Snapshot {
    pub lists: Vec<List>,
    pub tags: Vec<Tag>,
    pub tasks: Vec<Task>,
    pub settings: Settings,
}
