package handlers

import (
	"database/sql"
	"encoding/json"
	"math/rand"
	"net/http"
	"regexp"
	"time"

	"github.com/gorilla/mux"
	"project-tracker/db"
	"project-tracker/models"
)

// validateISODate validates that a date string is in ISO 8601 format (YYYY-MM-DD or RFC3339)
// For internal tool, we trust frontend but validate format to prevent corruption
func validateISODate(dateStr string) bool {
	if dateStr == "" {
		return true // Empty dates are allowed (optional fields)
	}
	// Match YYYY-MM-DD format
	datePattern := regexp.MustCompile(`^\d{4}-\d{2}-\d{2}$`)
	// Match RFC3339 datetime format (YYYY-MM-DDTHH:MM:SSZ or with timezone)
	datetimePattern := regexp.MustCompile(`^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}`)
	return datePattern.MatchString(dateStr) || datetimePattern.MatchString(dateStr)
}

func GetProjects(w http.ResponseWriter, r *http.Request) {
	rows, err := db.DB.Query(`
		SELECT id, name, clientName, description, type, createdAt, startDate, deadline,
		       completedAt, deliveredAt, totalAmount, advanceReceived, totalReceived,
		       partnerShareGiven, partnerShareDate, completionVideoLink, completionNotes,
		       repoLink, liveLink, deliveryNotes, techStack, deliverables, internalNotes
		FROM projects
		ORDER BY createdAt DESC
	`)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch projects")
		return
	}
	defer rows.Close()

	var projects []models.Project
	for rows.Next() {
		var p models.Project
		if err := p.ScanRows(rows); err != nil {
			respondError(w, http.StatusInternalServerError, "Failed to scan project")
			return
		}
		projects = append(projects, p)
	}

	respondJSON(w, http.StatusOK, projects)
}

func GetProject(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	var p models.Project
	err := p.Scan(db.DB.QueryRow(`
		SELECT id, name, clientName, description, type, createdAt, startDate, deadline,
		       completedAt, deliveredAt, totalAmount, advanceReceived, totalReceived,
		       partnerShareGiven, partnerShareDate, completionVideoLink, completionNotes,
		       repoLink, liveLink, deliveryNotes, techStack, deliverables, internalNotes
		FROM projects
		WHERE id = ?
	`, id))

	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "Project not found")
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch project")
		return
	}

	respondJSON(w, http.StatusOK, p)
}

func CreateProject(w http.ResponseWriter, r *http.Request) {
	var p models.Project
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validation
	if p.Name == "" || p.Type == "" || p.Deadline == "" || p.TotalAmount == 0 {
		respondError(w, http.StatusBadRequest, "Missing required fields")
		return
	}

	if p.Type != "software" && p.Type != "hardware" && p.Type != "mixed" {
		respondError(w, http.StatusBadRequest, "Invalid project type")
		return
	}

	// Validate date formats (ISO 8601: YYYY-MM-DD or RFC3339 datetime)
	// All dates must be ISO strings (YYYY-MM-DD or ISO datetime)
	if !validateISODate(p.Deadline) {
		respondError(w, http.StatusBadRequest, "Deadline must be in ISO format (YYYY-MM-DD or RFC3339)")
		return
	}
	if p.StartDate != nil && !validateISODate(*p.StartDate) {
		respondError(w, http.StatusBadRequest, "StartDate must be in ISO format (YYYY-MM-DD or RFC3339)")
		return
	}
	if p.CompletedAt != nil && !validateISODate(*p.CompletedAt) {
		respondError(w, http.StatusBadRequest, "CompletedAt must be in ISO format (YYYY-MM-DD or RFC3339)")
		return
	}
	if p.DeliveredAt != nil && !validateISODate(*p.DeliveredAt) {
		respondError(w, http.StatusBadRequest, "DeliveredAt must be in ISO format (YYYY-MM-DD or RFC3339)")
		return
	}
	if p.PartnerShareDate != nil && !validateISODate(*p.PartnerShareDate) {
		respondError(w, http.StatusBadRequest, "PartnerShareDate must be in ISO format (YYYY-MM-DD or RFC3339)")
		return
	}

	// Set createdAt if not provided
	if p.CreatedAt == "" {
		p.CreatedAt = time.Now().UTC().Format(time.RFC3339)
	}

	// Generate ID if not provided
	if p.ID == "" {
		p.ID = generateID()
	}

	_, err := db.DB.Exec(`
		INSERT INTO projects (
			id, name, clientName, description, type, createdAt, startDate, deadline,
			completedAt, deliveredAt, totalAmount, advanceReceived, totalReceived,
			partnerShareGiven, partnerShareDate, completionVideoLink, completionNotes,
			repoLink, liveLink, deliveryNotes, techStack, deliverables, internalNotes
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`,
		p.ID, p.Name, p.ClientName, p.Description, p.Type, p.CreatedAt, p.StartDate,
		p.Deadline, p.CompletedAt, p.DeliveredAt, p.TotalAmount, p.AdvanceReceived,
		p.TotalReceived, p.PartnerShareGiven, p.PartnerShareDate, p.CompletionVideoLink,
		p.CompletionNotes, p.RepoLink, p.LiveLink, p.DeliveryNotes, p.TechStack,
		p.Deliverables, p.InternalNotes,
	)

	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create project")
		return
	}

	respondJSON(w, http.StatusCreated, p)
}

func UpdateProject(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	var p models.Project
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	p.ID = id

	// Validation
	if p.Name == "" || p.Type == "" || p.Deadline == "" || p.TotalAmount == 0 {
		respondError(w, http.StatusBadRequest, "Missing required fields")
		return
	}

	if p.Type != "software" && p.Type != "hardware" && p.Type != "mixed" {
		respondError(w, http.StatusBadRequest, "Invalid project type")
		return
	}

	// Validate date formats (ISO 8601: YYYY-MM-DD or RFC3339 datetime)
	// All dates must be ISO strings (YYYY-MM-DD or ISO datetime)
	if !validateISODate(p.Deadline) {
		respondError(w, http.StatusBadRequest, "Deadline must be in ISO format (YYYY-MM-DD or RFC3339)")
		return
	}
	if p.StartDate != nil && !validateISODate(*p.StartDate) {
		respondError(w, http.StatusBadRequest, "StartDate must be in ISO format (YYYY-MM-DD or RFC3339)")
		return
	}
	if p.CompletedAt != nil && !validateISODate(*p.CompletedAt) {
		respondError(w, http.StatusBadRequest, "CompletedAt must be in ISO format (YYYY-MM-DD or RFC3339)")
		return
	}
	if p.DeliveredAt != nil && !validateISODate(*p.DeliveredAt) {
		respondError(w, http.StatusBadRequest, "DeliveredAt must be in ISO format (YYYY-MM-DD or RFC3339)")
		return
	}
	if p.PartnerShareDate != nil && !validateISODate(*p.PartnerShareDate) {
		respondError(w, http.StatusBadRequest, "PartnerShareDate must be in ISO format (YYYY-MM-DD or RFC3339)")
		return
	}

	result, err := db.DB.Exec(`
		UPDATE projects SET
			name = ?, clientName = ?, description = ?, type = ?, startDate = ?,
			deadline = ?, completedAt = ?, deliveredAt = ?, totalAmount = ?,
			advanceReceived = ?, totalReceived = ?, partnerShareGiven = ?,
			partnerShareDate = ?, completionVideoLink = ?, completionNotes = ?,
			repoLink = ?, liveLink = ?, deliveryNotes = ?, techStack = ?,
			deliverables = ?, internalNotes = ?
		WHERE id = ?
	`,
		p.Name, p.ClientName, p.Description, p.Type, p.StartDate, p.Deadline,
		p.CompletedAt, p.DeliveredAt, p.TotalAmount, p.AdvanceReceived, p.TotalReceived,
		p.PartnerShareGiven, p.PartnerShareDate, p.CompletionVideoLink, p.CompletionNotes,
		p.RepoLink, p.LiveLink, p.DeliveryNotes, p.TechStack, p.Deliverables,
		p.InternalNotes, p.ID,
	)

	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to update project")
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		respondError(w, http.StatusNotFound, "Project not found")
		return
	}

	respondJSON(w, http.StatusOK, p)
}

func DeleteProject(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	result, err := db.DB.Exec("DELETE FROM projects WHERE id = ?", id)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to delete project")
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		respondError(w, http.StatusNotFound, "Project not found")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "Project deleted"})
}

func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{"error": message})
}

func generateID() string {
	return time.Now().Format("20060102150405") + "-" + randomString(6)
}

func randomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return string(b)
}

