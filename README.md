# Handoff

handoff is a minimal internal tool to track projects, client payments, and
payment-gated delivery of source code and deployed links.

## What it does
- Tracks projects and deadlines
- Records advance and total payments from clients
- Calculates due amount
- Locks final delivery (repo / live links) until payment is cleared
- Stores completion proof and deployment links

## What it does NOT do
- No authentication
- No users or roles
- No profit or expense tracking
- No time tracking
- No cloud dependency

handoff is designed for small teams or partners who want a simple, honest system
without ERP-style complexity.

## Tech Stack
- Frontend: React + Vite + Tailwind + shadcn/ui
- Backend: Go (net/http) + SQLite
- Database: Single local SQLite file

## Run locally

### Backend
```bash
cd backend
go run main.go
