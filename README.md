# Handoff

Handoff is a minimal internal tool designed to track projects, client payments, and safely manage the delivery of source code and live links. It acts as a "delivery escrow," keeping source code and live links private until payments are settled (conceptually, or via manual release).

## Key Features

### Project Management
-   **Structured Input**: Clean, sectioned form for capturing project details.
-   **Type Tracking**: Classify projects as Software, Hardware, or Mixed.
-   **Context**: Store repository, design, and live links in one place.

### Financial Tracking
-   **Payment Flow**: Track Total Amount, Advance Received, and Total Received.
-   **Due Calculation**: Instantly see what is owed.
-   **Partner Share**: Record internal partner splits separately from client payments.
-   **Currency**: strictly INR (₹) integers for simplicity.

### Timeline & Status
-   **Deadlines**: Clear due dates for every project.
-   **Status Logic**: Automated status (Active, Completed, Settled) based on payments and deliverables.

### Delivery Controls
-   **Gated Access**: Store completion videos, repo links, and live URLs.
-   **Deliverables**: List out specific items agreed upon (JSON format).

## Tech Stack

### Frontend
-   **Framework**: React + Vite
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS + shadcn/ui
-   **State**: Context API for simplified state management

### Backend
-   **Language**: Go 1.24
-   **Router**: Gorilla Mux
-   **Database**: SQLite (via `modernc.org/sqlite` - CGO-free)
-   **Architecture**: Simple REST API with `net/http`.

## Getting Started

### Prerequisites
-   Go 1.24+
-   Node.js 18+

### 1. Run Backend
The backend runs on port `:8080`. It will auto-create a `data/projects.db` file.

```bash
cd backend
go run main.go
```

### 2. Run Frontend
The frontend runs on port `:5173` (default Vite port) and proxies API calls to localhost:8080.

```bash
cd frontend
npm install
npm run dev
```

## API Reference

| Method | Endpoint         | Description           |
| :----- | :--------------- | :-------------------- |
| GET    | `/projects`      | List all projects     |
| GET    | `/projects/{id}` | Get single project    |
| POST   | `/projects`      | Create new project    |
| PUT    | `/projects/{id}` | Update project        |
| DELETE | `/projects/{id}` | Delete project        |

