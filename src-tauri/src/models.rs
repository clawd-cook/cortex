use serde::{Deserialize, Serialize};

fn default_kind() -> String {
    "task".into()
}

fn default_true() -> bool {
    true
}

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
    #[serde(default)]
    pub start_time: Option<String>,
    #[serde(default)]
    pub end_time: Option<String>,
    #[serde(default = "default_kind")]
    pub kind: String,
    /// Clarified / left inbox. Missing on deserialize defaults true; SQL migrate backfills.
    #[serde(default = "default_true")]
    pub processed: bool,
    #[serde(default = "default_true")]
    pub actionable: bool,
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
    #[serde(default = "default_true")]
    pub show_lunar: bool,
    #[serde(default = "default_true")]
    pub show_week_numbers: bool,
    #[serde(default = "default_true")]
    pub show_holidays: bool,
    #[serde(default = "default_true")]
    pub show_habits: bool,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            week_starts_on: 1,
            show_completed: false,
            show_lunar: true,
            show_week_numbers: true,
            show_holidays: true,
            show_habits: true,
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
