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
	api := r.PathPrefix("/api").Subrouter()
	api.HandleFunc("/projects", handlers.GetProjects).Methods("GET")
	api.HandleFunc("/projects/{id}", handlers.GetProject).Methods("GET")
	api.HandleFunc("/projects", handlers.CreateProject).Methods("POST")
	api.HandleFunc("/projects/{id}", handlers.UpdateProject).Methods("PUT")
	api.HandleFunc("/projects/{id}", handlers.DeleteProject).Methods("DELETE")

	// Serve frontend static files
	frontendDir := "../frontend/dist"
	spa := spaHandler{staticPath: frontendDir, indexPath: "index.html"}
	r.PathPrefix("/").Handler(spa)

	handler := corsMiddleware(r)

	log.Println("Starting handoff backend on :8080")
	log.Fatal(http.ListenAndServe(":8080", handler))
}

type spaHandler struct {
	staticPath string
	indexPath  string
}

func (h spaHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	path := filepath.Join(h.staticPath, r.URL.Path)

	// check if file exists
	_, err := os.Stat(path)
	if os.IsNotExist(err) {
		// file does not exist, serve index.html
		http.ServeFile(w, r, filepath.Join(h.staticPath, h.indexPath))
		return
	} else if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// otherwise, serve the file
	http.FileServer(http.Dir(h.staticPath)).ServeHTTP(w, r)
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
