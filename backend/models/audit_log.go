package models

type AuditLog struct {
	ID        string
	ProjectID string
	Action    string
	CreatedAt string
}
