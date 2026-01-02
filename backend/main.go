package main

import (
	"context"
	"io"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"project-tracker/db"
	"project-tracker/handlers"

	"github.com/gorilla/mux"
)

var dbPath string

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

func main() {
	// Setup logging
	logFile, err := os.OpenFile(
		"logs/app.log",
		os.O_APPEND|os.O_CREATE|os.O_WRONLY,
		0644,
	)
	if err != nil {
		log.Fatalf("failed to open log file: %v", err)
	}
	log.SetOutput(io.MultiWriter(os.Stdout, logFile))
	log.SetFlags(log.Ldate | log.Ltime | log.Lshortfile)

	// Configure Database Path
	dbPath = getEnv("DB_PATH", "data/projects.db")

	dbDir := filepath.Dir(dbPath)
	// Ensure database directory exists
	if err := os.MkdirAll(dbDir, 0755); err != nil {
		log.Fatalf("failed to create database directory %s: %v", dbDir, err)
	}

	log.Println("Using database at:", dbPath)

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
	frontendDir := getEnv("FRONTEND_DIR", "../frontend/dist")
	spa := spaHandler{staticPath: frontendDir, indexPath: "index.html"}
	r.PathPrefix("/").Handler(spa)

	handler := r

	port := getEnv("PORT", "8080")
	srv := &http.Server{
		Addr:    "127.0.0.1:" + port,
		Handler: handler,
	}

	go func() {
		log.Println("Server starting on :" + port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen error: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	<-quit
	log.Println("Shutdown signal received")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("Server forced to shutdown: %v", err)
	}

	if err := db.Close(); err != nil {
		log.Printf("Error closing database: %v", err)
	}

	log.Println("Server exited gracefully")
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
