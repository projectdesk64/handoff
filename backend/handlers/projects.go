package handlers

import (
	"database/sql"
	"encoding/json"
	"math/rand"
	"net/http"
	"regexp"
	"time"

	"project-tracker/db"
	"project-tracker/models"

	"github.com/gorilla/mux"
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
		       partnerShareGiven, partnerShareDate, harshk_share_given, harshk_share_date,
		       nikku_share_given, nikku_share_date, completionVideoLink, completionNotes,
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
		       partnerShareGiven, partnerShareDate, harshk_share_given, harshk_share_date,
		       nikku_share_given, nikku_share_date, completionVideoLink, completionNotes,
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
	if p.HarshkShareDate != nil && !validateISODate(*p.HarshkShareDate) {
		respondError(w, http.StatusBadRequest, "HarshkShareDate must be in ISO format (YYYY-MM-DD or RFC3339)")
		return
	}
	if p.NikkuShareDate != nil && !validateISODate(*p.NikkuShareDate) {
		respondError(w, http.StatusBadRequest, "NikkuShareDate must be in ISO format (YYYY-MM-DD or RFC3339)")
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
			partnerShareGiven, partnerShareDate, harshk_share_given, harshk_share_date,
			nikku_share_given, nikku_share_date, completionVideoLink, completionNotes,
			repoLink, liveLink, deliveryNotes, techStack, deliverables, internalNotes
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`,
		p.ID, p.Name, p.ClientName, p.Description, p.Type, p.CreatedAt, p.StartDate,
		p.Deadline, p.CompletedAt, p.DeliveredAt, p.TotalAmount, p.AdvanceReceived,
		p.TotalReceived, p.PartnerShareGiven, p.PartnerShareDate, p.HarshkShareGiven,
		p.HarshkShareDate, p.NikkuShareGiven, p.NikkuShareDate, p.CompletionVideoLink,
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

	// Decode partial update as map to handle only provided fields
	var updates map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if len(updates) == 0 {
		respondError(w, http.StatusBadRequest, "No fields to update")
		return
	}

	// Check if project exists
	var exists bool
	err := db.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM projects WHERE id = ?)", id).Scan(&exists)
	if err != nil || !exists {
		respondError(w, http.StatusNotFound, "Project not found")
		return
	}

	// Build dynamic UPDATE query with only provided fields
	setParts := []string{}
	args := []interface{}{}

	// Field mapping: JSON field name -> database column name
	fieldMap := map[string]string{
		"name":                "name",
		"clientName":          "clientName",
		"description":         "description",
		"type":                "type",
		"startDate":           "startDate",
		"deadline":            "deadline",
		"completedAt":         "completedAt",
		"deliveredAt":         "deliveredAt",
		"totalAmount":         "totalAmount",
		"advanceReceived":    "advanceReceived",
		"totalReceived":       "totalReceived",
		"partnerShareGiven":  "partnerShareGiven",
		"partnerShareDate":    "partnerShareDate",
		"harshkShareGiven":    "harshk_share_given",
		"harshkShareDate":     "harshk_share_date",
		"nikkuShareGiven":     "nikku_share_given",
		"nikkuShareDate":      "nikku_share_date",
		"completionVideoLink": "completionVideoLink",
		"completionNotes":     "completionNotes",
		"repoLink":            "repoLink",
		"liveLink":            "liveLink",
		"deliveryNotes":       "deliveryNotes",
		"techStack":           "techStack",
		"deliverables":        "deliverables",
		"internalNotes":       "internalNotes",
	}

	// Validate and build SET clauses for provided fields
	for jsonField, value := range updates {
		// Skip id and createdAt (not updatable)
		if jsonField == "id" || jsonField == "createdAt" {
			continue
		}

		dbField, ok := fieldMap[jsonField]
		if !ok {
			respondError(w, http.StatusBadRequest, "Unknown field: "+jsonField)
			return
		}

		// Validate field-specific rules
		switch jsonField {
		case "name":
			if str, ok := value.(string); !ok || str == "" {
				respondError(w, http.StatusBadRequest, "name must be a non-empty string")
				return
			}
		case "type":
			if str, ok := value.(string); !ok {
				respondError(w, http.StatusBadRequest, "type must be a string")
				return
			} else if str != "software" && str != "hardware" && str != "mixed" {
				respondError(w, http.StatusBadRequest, "type must be 'software', 'hardware', or 'mixed'")
				return
			}
		case "deadline":
			if str, ok := value.(string); !ok || str == "" {
				respondError(w, http.StatusBadRequest, "deadline must be a non-empty string")
				return
			} else if !validateISODate(str) {
				respondError(w, http.StatusBadRequest, "deadline must be in ISO format (YYYY-MM-DD or RFC3339)")
				return
			}
		case "totalAmount":
			var amount float64
			switch v := value.(type) {
			case float64:
				amount = v
			case int:
				amount = float64(v)
			default:
				respondError(w, http.StatusBadRequest, "totalAmount must be a number")
				return
			}
			if amount <= 0 {
				respondError(w, http.StatusBadRequest, "totalAmount must be greater than 0")
				return
			}
		case "startDate", "completedAt", "deliveredAt", "partnerShareDate", "harshkShareDate", "nikkuShareDate":
			if value != nil {
				if str, ok := value.(string); ok && str != "" {
					if !validateISODate(str) {
						respondError(w, http.StatusBadRequest, jsonField+" must be in ISO format (YYYY-MM-DD or RFC3339)")
						return
					}
				} else if str != "" {
					respondError(w, http.StatusBadRequest, jsonField+" must be a string or null")
					return
				}
			}
		}

		setParts = append(setParts, dbField+" = ?")
		args = append(args, value)
	}

	if len(setParts) == 0 {
		respondError(w, http.StatusBadRequest, "No valid fields to update")
		return
	}

	// Execute UPDATE query
	query := "UPDATE projects SET " + setParts[0]
	for i := 1; i < len(setParts); i++ {
		query += ", " + setParts[i]
	}
	query += " WHERE id = ?"
	args = append(args, id)

	result, err := db.DB.Exec(query, args...)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to update project")
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		respondError(w, http.StatusNotFound, "Project not found")
		return
	}

	// Fetch and return updated project
	var p models.Project
	err = p.Scan(db.DB.QueryRow(`
		SELECT id, name, clientName, description, type, createdAt, startDate, deadline,
		       completedAt, deliveredAt, totalAmount, advanceReceived, totalReceived,
		       partnerShareGiven, partnerShareDate, harshk_share_given, harshk_share_date,
		       nikku_share_given, nikku_share_date, completionVideoLink, completionNotes,
		       repoLink, liveLink, deliveryNotes, techStack, deliverables, internalNotes
		FROM projects
		WHERE id = ?
	`, id))

	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch updated project")
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
