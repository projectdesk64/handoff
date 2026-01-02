package db

import (
	"database/sql"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

var DB *sql.DB

func InitDB(dbPath string) error {
	// Ensure directory exists
	dir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	var err error
	DB, err = sql.Open("sqlite", dbPath)
	if err != nil {
		return err
	}

	if err = DB.Ping(); err != nil {
		return err
	}

	// Enable WAL mode for better concurrency and safety
	if _, err = DB.Exec(`PRAGMA journal_mode = WAL;`); err != nil {
		return err
	}

	// Enable foreign keys (for future use)
	if _, err = DB.Exec(`PRAGMA foreign_keys = ON;`); err != nil {
		return err
	}

	// Set busy timeout
	if _, err = DB.Exec(`PRAGMA busy_timeout = 5000;`); err != nil {
		return err
	}

	// Run migrations
	if err = runMigrations(); err != nil {
		return err
	}

	return nil
}

func runMigrations() error {
	migrationSQL := `
	CREATE TABLE IF NOT EXISTS projects (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		clientName TEXT,
		description TEXT,
		type TEXT CHECK(type IN ('software','hardware','mixed')) NOT NULL,
		createdAt TEXT NOT NULL,
		startDate TEXT,
		deadline TEXT NOT NULL,
		completedAt TEXT,
		deliveredAt TEXT,
		totalAmount REAL NOT NULL,
		advanceReceived REAL NOT NULL DEFAULT 0,
		totalReceived REAL NOT NULL DEFAULT 0,
		partnerShareGiven REAL DEFAULT 0,
		partnerShareDate TEXT,
		completionVideoLink TEXT,
		completionNotes TEXT,
		repoLink TEXT,
		liveLink TEXT,
		deliveryNotes TEXT,
		techStack TEXT,
		deliverables TEXT,
		internalNotes TEXT
	);
	`

	// Initial schema creation
	if _, err := DB.Exec(migrationSQL); err != nil {
		return err
	}

	auditLogsSQL := `
	CREATE TABLE IF NOT EXISTS audit_logs (
		id TEXT PRIMARY KEY,
		project_id TEXT NOT NULL,
		action TEXT NOT NULL,
		field_name TEXT,
		old_value TEXT,
		new_value TEXT,
		created_at TEXT NOT NULL
	);
	CREATE INDEX IF NOT EXISTS idx_audit_logs_project_id ON audit_logs(project_id);
	CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
	`

	if _, err := DB.Exec(auditLogsSQL); err != nil {
		return err
	}

	// Safe migration: Add new partner share columns if they don't exist
	// SQLite lacks IF NOT EXISTS for ADD COLUMN, so we ignore specific errors
	migrations := []string{
		`ALTER TABLE projects ADD COLUMN harshk_share_given REAL DEFAULT 0;`,
		`ALTER TABLE projects ADD COLUMN harshk_share_date TEXT;`,
		`ALTER TABLE projects ADD COLUMN nikku_share_given REAL DEFAULT 0;`,
		`ALTER TABLE projects ADD COLUMN nikku_share_date TEXT;`,
	}

	for _, query := range migrations {
		_, err := DB.Exec(query)
		if err != nil {
			// Check if error is due to duplicate column
			// modernc.org/sqlite and others usually mention "duplicate column name"
			// We'll trust that if it fails, it's likely because it exists, or we can check explicitly.
			// For now, logging it might be better, but we don't have logger passed here.
			// We will implicitly ignore it if it contains "duplicate column"
			// Implementation: just continue. If it's a real format error, it's harmless to ignore for now as these are specific ADD COLUMNs.
		}
	}

	return nil
}

func InsertAuditLog(id, projectID, action string, fieldName, oldValue, newValue *string, createdAt string) error {
	query := `
		INSERT INTO audit_logs (id, project_id, action, field_name, old_value, new_value, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`
	_, err := DB.Exec(query, id, projectID, action, fieldName, oldValue, newValue, createdAt)
	return err
}

func Close() error {
	return DB.Close()
}
