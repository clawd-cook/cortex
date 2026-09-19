use crate::models::{List, Settings, Snapshot, Tag, Task};
use rusqlite::{params, Connection, OptionalExtension};

pub type DbResult<T> = Result<T, rusqlite::Error>;

pub fn migrate(conn: &Connection) -> DbResult<()> {
    conn.execute_batch(
        "
        PRAGMA foreign_keys = ON;
        CREATE TABLE IF NOT EXISTS lists (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            emoji TEXT NOT NULL DEFAULT '',
            color TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS tags (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            color TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            list_id TEXT,
            start_date TEXT,
            due_date TEXT,
            all_day INTEGER NOT NULL DEFAULT 1,
            start_time TEXT,
            end_time TEXT,
            kind TEXT NOT NULL DEFAULT 'task',
            processed INTEGER NOT NULL DEFAULT 1,
            actionable INTEGER NOT NULL DEFAULT 1,
            priority INTEGER NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'open',
            notes TEXT NOT NULL DEFAULT '',
            completed_at TEXT,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(list_id) REFERENCES lists(id)
        );
        CREATE TABLE IF NOT EXISTS task_tags (
            task_id TEXT NOT NULL,
            tag_id TEXT NOT NULL,
            PRIMARY KEY (task_id, tag_id),
            FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE,
            FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_tasks_list ON tasks(list_id);
        CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
        CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_date);
        ",
    )?;
    ensure_task_columns(conn)?;
    Ok(())
}

fn column_names(conn: &Connection, table: &str) -> DbResult<Vec<String>> {
    let mut stmt = conn.prepare(&format!("PRAGMA table_info({table})"))?;
    let rows = stmt.query_map([], |row| row.get::<_, String>(1))?;
    rows.collect()
}

fn ensure_task_columns(conn: &Connection) -> DbResult<()> {
    let cols = column_names(conn, "tasks")?;
    if !cols.iter().any(|name| name == "kind") {
        conn.execute(
            "ALTER TABLE tasks ADD COLUMN kind TEXT NOT NULL DEFAULT 'task'",
            [],
        )?;
    }
    if !cols.iter().any(|name| name == "start_time") {
        conn.execute("ALTER TABLE tasks ADD COLUMN start_time TEXT", [])?;
    }
    if !cols.iter().any(|name| name == "end_time") {
        conn.execute("ALTER TABLE tasks ADD COLUMN end_time TEXT", [])?;
    }
    if !cols.iter().any(|name| name == "processed") {
        conn.execute(
            "ALTER TABLE tasks ADD COLUMN processed INTEGER NOT NULL DEFAULT 1",
            [],
        )?;
        conn.execute(
            "ALTER TABLE tasks ADD COLUMN actionable INTEGER NOT NULL DEFAULT 1",
            [],
        )?;
        // Phase A migration: only open undated independent non-habits stay unprocessed.
        conn.execute(
            "UPDATE tasks SET processed = 0
             WHERE status = 'open'
               AND list_id IS NULL
               AND start_date IS NULL
               AND due_date IS NULL
               AND kind != 'habit'",
            [],
        )?;
    } else if !cols.iter().any(|name| name == "actionable") {
        conn.execute(
            "ALTER TABLE tasks ADD COLUMN actionable INTEGER NOT NULL DEFAULT 1",
            [],
        )?;
    }
    Ok(())
}

pub fn load_snapshot(conn: &Connection) -> DbResult<Snapshot> {
    Ok(Snapshot {
        lists: load_lists(conn)?,
        tags: load_tags(conn)?,
        tasks: load_tasks(conn)?,
        settings: load_settings(conn)?,
    })
}

fn load_lists(conn: &Connection) -> DbResult<Vec<List>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, emoji, color, sort_order, created_at, updated_at
         FROM lists ORDER BY sort_order, created_at",
    )?;
    let rows = stmt.query_map([], |row| {
        Ok(List {
            id: row.get(0)?,
            name: row.get(1)?,
            emoji: row.get(2)?,
            color: row.get(3)?,
            sort_order: row.get(4)?,
            created_at: row.get(5)?,
            updated_at: row.get(6)?,
        })
    })?;
    rows.collect()
}

fn load_tags(conn: &Connection) -> DbResult<Vec<Tag>> {
    let mut stmt = conn.prepare("SELECT id, name, color, created_at FROM tags ORDER BY created_at")?;
    let rows = stmt.query_map([], |row| {
        Ok(Tag {
            id: row.get(0)?,
            name: row.get(1)?,
            color: row.get(2)?,
            created_at: row.get(3)?,
        })
    })?;
    rows.collect()
}

fn load_task_tag_ids(conn: &Connection, task_id: &str) -> DbResult<Vec<String>> {
    let mut stmt = conn.prepare("SELECT tag_id FROM task_tags WHERE task_id = ?1")?;
    let rows = stmt.query_map([task_id], |row| row.get(0))?;
    rows.collect()
}

fn load_tasks(conn: &Connection) -> DbResult<Vec<Task>> {
    let mut stmt = conn.prepare(
        "SELECT id, title, list_id, start_date, due_date, all_day, start_time, end_time, kind,
                processed, actionable, priority, status, notes, completed_at, sort_order,
                created_at, updated_at
         FROM tasks ORDER BY sort_order, created_at",
    )?;
    let rows = stmt.query_map([], |row| {
        Ok(Task {
            id: row.get(0)?,
            title: row.get(1)?,
            list_id: row.get(2)?,
            start_date: row.get(3)?,
            due_date: row.get(4)?,
            all_day: row.get::<_, i64>(5)? != 0,
            start_time: row.get(6)?,
            end_time: row.get(7)?,
            kind: row.get(8)?,
            processed: row.get::<_, i64>(9)? != 0,
            actionable: row.get::<_, i64>(10)? != 0,
            priority: row.get(11)?,
            status: row.get(12)?,
            notes: row.get(13)?,
            completed_at: row.get(14)?,
            tag_ids: Vec::new(),
            sort_order: row.get(15)?,
            created_at: row.get(16)?,
            updated_at: row.get(17)?,
        })
    })?;
    let mut tasks = Vec::new();
    for task in rows {
        let mut task = task?;
        task.tag_ids = load_task_tag_ids(conn, &task.id)?;
        tasks.push(task);
    }
    Ok(tasks)
}

fn load_settings(conn: &Connection) -> DbResult<Settings> {
    let mut settings = Settings::default();
    if let Some(value) = conn
        .query_row(
            "SELECT value FROM settings WHERE key = 'weekStartsOn'",
            [],
            |row| row.get::<_, String>(0),
        )
        .optional()?
    {
        if let Ok(n) = value.parse::<u8>() {
            settings.week_starts_on = n;
        }
    }
    if let Some(value) = conn
        .query_row(
            "SELECT value FROM settings WHERE key = 'showCompleted'",
            [],
            |row| row.get::<_, String>(0),
        )
        .optional()?
    {
        settings.show_completed = value == "true" || value == "1";
    }
    settings.show_lunar = load_bool_setting(conn, "showLunar", true)?;
    settings.show_week_numbers = load_bool_setting(conn, "showWeekNumbers", true)?;
    settings.show_holidays = load_bool_setting(conn, "showHolidays", true)?;
    settings.show_habits = load_bool_setting(conn, "showHabits", true)?;
    Ok(settings)
}

fn load_bool_setting(conn: &Connection, key: &str, default: bool) -> DbResult<bool> {
    if let Some(value) = conn
        .query_row(
            "SELECT value FROM settings WHERE key = ?1",
            [key],
            |row| row.get::<_, String>(0),
        )
        .optional()?
    {
        return Ok(value == "true" || value == "1");
    }
    Ok(default)
}

pub fn save_list(conn: &Connection, list: &List) -> DbResult<()> {
    conn.execute(
        "INSERT INTO lists (id, name, emoji, color, sort_order, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           emoji = excluded.emoji,
           color = excluded.color,
           sort_order = excluded.sort_order,
           updated_at = excluded.updated_at",
        params![
            list.id,
            list.name,
            list.emoji,
            list.color,
            list.sort_order,
            list.created_at,
            list.updated_at
        ],
    )?;
    Ok(())
}

pub fn delete_list(conn: &Connection, id: &str) -> DbResult<()> {
    conn.execute("UPDATE tasks SET list_id = NULL WHERE list_id = ?1", [id])?;
    conn.execute("DELETE FROM lists WHERE id = ?1", [id])?;
    Ok(())
}

pub fn save_tag(conn: &Connection, tag: &Tag) -> DbResult<()> {
    conn.execute(
        "INSERT INTO tags (id, name, color, created_at)
         VALUES (?1, ?2, ?3, ?4)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           color = excluded.color",
        params![tag.id, tag.name, tag.color, tag.created_at],
    )?;
    Ok(())
}

pub fn delete_tag(conn: &Connection, id: &str) -> DbResult<()> {
    conn.execute("DELETE FROM task_tags WHERE tag_id = ?1", [id])?;
    conn.execute("DELETE FROM tags WHERE id = ?1", [id])?;
    Ok(())
}

pub fn save_task(conn: &Connection, task: &Task) -> DbResult<()> {
    conn.execute(
        "INSERT INTO tasks (
            id, title, list_id, start_date, due_date, all_day, start_time, end_time, kind,
            processed, actionable, priority, status, notes, completed_at, sort_order,
            created_at, updated_at
         ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18)
         ON CONFLICT(id) DO UPDATE SET
           title = excluded.title,
           list_id = excluded.list_id,
           start_date = excluded.start_date,
           due_date = excluded.due_date,
           all_day = excluded.all_day,
           start_time = excluded.start_time,
           end_time = excluded.end_time,
           kind = excluded.kind,
           processed = excluded.processed,
           actionable = excluded.actionable,
           priority = excluded.priority,
           status = excluded.status,
           notes = excluded.notes,
           completed_at = excluded.completed_at,
           sort_order = excluded.sort_order,
           updated_at = excluded.updated_at",
        params![
            task.id,
            task.title,
            task.list_id,
            task.start_date,
            task.due_date,
            if task.all_day { 1 } else { 0 },
            task.start_time,
            task.end_time,
            task.kind,
            if task.processed { 1 } else { 0 },
            if task.actionable { 1 } else { 0 },
            task.priority,
            task.status,
            task.notes,
            task.completed_at,
            task.sort_order,
            task.created_at,
            task.updated_at
        ],
    )?;
    conn.execute("DELETE FROM task_tags WHERE task_id = ?1", [&task.id])?;
    for tag_id in &task.tag_ids {
        conn.execute(
            "INSERT INTO task_tags (task_id, tag_id) VALUES (?1, ?2)",
            params![task.id, tag_id],
        )?;
    }
    Ok(())
}

pub fn delete_task(conn: &Connection, id: &str) -> DbResult<()> {
    conn.execute("DELETE FROM task_tags WHERE task_id = ?1", [id])?;
    conn.execute("DELETE FROM tasks WHERE id = ?1", [id])?;
    Ok(())
}

pub fn save_settings(conn: &Connection, settings: &Settings) -> DbResult<()> {
    conn.execute(
        "INSERT INTO settings (key, value) VALUES ('weekStartsOn', ?1)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        [settings.week_starts_on.to_string()],
    )?;
    conn.execute(
        "INSERT INTO settings (key, value) VALUES ('showCompleted', ?1)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        [if settings.show_completed {
            "true"
        } else {
            "false"
        }],
    )?;
    save_bool_setting(conn, "showLunar", settings.show_lunar)?;
    save_bool_setting(conn, "showWeekNumbers", settings.show_week_numbers)?;
    save_bool_setting(conn, "showHolidays", settings.show_holidays)?;
    save_bool_setting(conn, "showHabits", settings.show_habits)?;
    Ok(())
}

fn save_bool_setting(conn: &Connection, key: &str, value: bool) -> DbResult<()> {
    conn.execute(
        "INSERT INTO settings (key, value) VALUES (?1, ?2)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        params![key, if value { "true" } else { "false" }],
    )?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_task(id: &str, title: &str) -> Task {
        Task {
            id: id.into(),
            title: title.into(),
            list_id: None,
            start_date: Some("2026-09-19".into()),
            due_date: Some("2026-09-21".into()),
            all_day: true,
            start_time: None,
            end_time: None,
            kind: "task".into(),
            processed: true,
            actionable: true,
            priority: 2,
            status: "open".into(),
            notes: "hello".into(),
            completed_at: None,
            tag_ids: vec!["tag-1".into()],
            sort_order: 0,
            created_at: "2026-09-19T00:00:00.000Z".into(),
            updated_at: "2026-09-19T00:00:00.000Z".into(),
        }
    }

    #[test]
    fn persists_across_reload() {
        let conn = Connection::open_in_memory().unwrap();
        migrate(&conn).unwrap();

        save_list(
            &conn,
            &List {
                id: "list-1".into(),
                name: "项目清单".into(),
                emoji: "📦".into(),
                color: "#4f46e5".into(),
                sort_order: 0,
                created_at: "2026-09-19T00:00:00.000Z".into(),
                updated_at: "2026-09-19T00:00:00.000Z".into(),
            },
        )
        .unwrap();
        save_tag(
            &conn,
            &Tag {
                id: "tag-1".into(),
                name: "技术改造".into(),
                color: "#2563eb".into(),
                created_at: "2026-09-19T00:00:00.000Z".into(),
            },
        )
        .unwrap();
        let mut task = sample_task("task-1", "IDE 插件");
        task.list_id = Some("list-1".into());
        save_task(&conn, &task).unwrap();
        save_settings(
            &conn,
            &Settings {
                week_starts_on: 1,
                show_completed: true,
                show_lunar: true,
                show_week_numbers: true,
                show_holidays: true,
                show_habits: true,
            },
        )
        .unwrap();

        let snap = load_snapshot(&conn).unwrap();
        assert_eq!(snap.lists.len(), 1);
        assert_eq!(snap.tags[0].name, "技术改造");
        assert_eq!(snap.tasks[0].title, "IDE 插件");
        assert_eq!(snap.tasks[0].tag_ids, vec!["tag-1".to_string()]);
        assert_eq!(snap.tasks[0].due_date.as_deref(), Some("2026-09-21"));
        assert!(snap.settings.show_completed);
        assert_eq!(snap.settings.week_starts_on, 1);
        assert_eq!(snap.tasks[0].kind, "task");
        assert!(snap.tasks[0].processed);
        assert!(snap.settings.show_lunar);
    }

    #[test]
    fn migrates_legacy_task_columns() {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch(
            "
            CREATE TABLE lists (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                emoji TEXT NOT NULL DEFAULT '',
                color TEXT NOT NULL,
                sort_order INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE TABLE tasks (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                list_id TEXT,
                start_date TEXT,
                due_date TEXT,
                all_day INTEGER NOT NULL DEFAULT 1,
                priority INTEGER NOT NULL DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'open',
                notes TEXT NOT NULL DEFAULT '',
                completed_at TEXT,
                sort_order INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE TABLE task_tags (
                task_id TEXT NOT NULL,
                tag_id TEXT NOT NULL,
                PRIMARY KEY (task_id, tag_id)
            );
            INSERT INTO tasks (
                id, title, list_id, start_date, due_date, all_day, priority, status,
                notes, completed_at, sort_order, created_at, updated_at
            ) VALUES (
                'legacy', '旧库任务', NULL, '2026-09-19', '2026-09-19', 1, 0, 'open',
                '', NULL, 0, 't', 't'
            );
            INSERT INTO tasks (
                id, title, list_id, start_date, due_date, all_day, priority, status,
                notes, completed_at, sort_order, created_at, updated_at
            ) VALUES (
                'capture', '旧收集', NULL, NULL, NULL, 1, 0, 'open',
                '', NULL, 1, 't', 't'
            );
            ",
        )
        .unwrap();
        migrate(&conn).unwrap();
        let snap = load_snapshot(&conn).unwrap();
        let dated = snap.tasks.iter().find(|t| t.id == "legacy").unwrap();
        let capture = snap.tasks.iter().find(|t| t.id == "capture").unwrap();
        assert_eq!(dated.title, "旧库任务");
        assert_eq!(dated.kind, "task");
        assert_eq!(dated.start_time, None);
        assert!(dated.processed);
        assert!(dated.actionable);
        assert!(!capture.processed);
        assert!(capture.actionable);
    }

    #[test]
    fn deleting_list_moves_tasks_to_inbox() {
        let conn = Connection::open_in_memory().unwrap();
        migrate(&conn).unwrap();
        save_list(
            &conn,
            &List {
                id: "list-1".into(),
                name: "下一步".into(),
                emoji: "".into(),
                color: "#0f7a4a".into(),
                sort_order: 0,
                created_at: "t".into(),
                updated_at: "t".into(),
            },
        )
        .unwrap();
        let mut task = sample_task("task-1", "move me");
        task.list_id = Some("list-1".into());
        task.tag_ids = vec![];
        save_task(&conn, &task).unwrap();
        delete_list(&conn, "list-1").unwrap();
        let snap = load_snapshot(&conn).unwrap();
        assert!(snap.lists.is_empty());
        assert_eq!(snap.tasks[0].list_id, None);
    }
}
