package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"project-tracker/db"
	"project-tracker/handlers"

	"github.com/gorilla/mux"
)

var dbPath string

func main() {
	// Ensure data directory exists
	dataDir := filepath.Join(".", "data")
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		log.Fatal("Failed to create data directory:", err)
	}

	dbPath = filepath.Join(dataDir, "projects.db")

	// Initialize database
	if err := db.InitDB(dbPath); err != nil {
		log.Fatal("Failed to initialize database:", err)
	}

	// Setup routes
	r := mux.NewRouter()

	// API routes
	r.HandleFunc("/projects", handlers.GetProjects).Methods("GET")
	r.HandleFunc("/projects/{id}", handlers.GetProject).Methods("GET")
	r.HandleFunc("/projects", handlers.CreateProject).Methods("POST")
	r.HandleFunc("/projects/{id}", handlers.UpdateProject).Methods("PUT")
	r.HandleFunc("/projects/{id}", handlers.DeleteProject).Methods("DELETE")

	handler := corsMiddleware(r)

	log.Println("Starting handoff backend on :8080")
	log.Fatal(http.ListenAndServe(":8080", handler))
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
