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
		totalAmount INTEGER NOT NULL,
		advanceReceived INTEGER NOT NULL DEFAULT 0,
		totalReceived INTEGER NOT NULL DEFAULT 0,
		partnerShareGiven INTEGER DEFAULT 0,
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

	_, err := DB.Exec(migrationSQL)
	return err
}
