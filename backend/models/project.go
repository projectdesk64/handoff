package models

import "database/sql"

// Project represents a project in the tracker.
//
// IMPORTANT MONEY FIELD RULE:
// - Money fields (TotalAmount, AdvanceReceived, TotalReceived, PartnerShareGiven) use INTEGER type
// - Values are stored in minor units (e.g., cents, paise)
// - Backend NEVER calculates derived amounts (e.g., dueAmount = totalAmount - totalReceived)
// - All money calculations MUST be done in the frontend only
// - This ensures backend remains a simple data store without business logic
type Project struct {
	ID                  string  `json:"id"`
	Name                string  `json:"name"`
	ClientName          *string `json:"clientName,omitempty"`
	Description         *string `json:"description,omitempty"`
	Type                string  `json:"type"`
	CreatedAt           string  `json:"createdAt"`                   // ISO 8601 format (RFC3339)
	StartDate           *string `json:"startDate,omitempty"`         // ISO 8601 format (YYYY-MM-DD or RFC3339)
	Deadline            string  `json:"deadline"`                    // ISO 8601 format (YYYY-MM-DD or RFC3339)
	CompletedAt         *string `json:"completedAt,omitempty"`       // ISO 8601 format (YYYY-MM-DD or RFC3339)
	DeliveredAt         *string `json:"deliveredAt,omitempty"`       // ISO 8601 format (YYYY-MM-DD or RFC3339)
	TotalAmount         int64   `json:"totalAmount"`                 // INTEGER type - stored in CONSTANT RUPEES (no minor units/paise)
	AdvanceReceived     int64   `json:"advanceReceived"`             // INTEGER type - stored in CONSTANT RUPEES (no minor units/paise)
	TotalReceived       int64   `json:"totalReceived"`               // INTEGER type - stored in CONSTANT RUPEES (no minor units/paise)
	PartnerShareGiven   *int64  `json:"partnerShareGiven,omitempty"` // INTEGER type - stored in CONSTANT RUPEES (no minor units/paise)
	PartnerShareDate    *string `json:"partnerShareDate,omitempty"`  // ISO 8601 format (YYYY-MM-DD or RFC3339)
	CompletionVideoLink *string `json:"completionVideoLink,omitempty"`
	CompletionNotes     *string `json:"completionNotes,omitempty"`
	RepoLink            *string `json:"repoLink,omitempty"`
	LiveLink            *string `json:"liveLink,omitempty"`
	DeliveryNotes       *string `json:"deliveryNotes,omitempty"`
	TechStack           *string `json:"techStack,omitempty"`
	Deliverables        *string `json:"deliverables,omitempty"`
	InternalNotes       *string `json:"internalNotes,omitempty"`
}

func (p *Project) Scan(row *sql.Row) error {
	return row.Scan(
		&p.ID,
		&p.Name,
		&p.ClientName,
		&p.Description,
		&p.Type,
		&p.CreatedAt,
		&p.StartDate,
		&p.Deadline,
		&p.CompletedAt,
		&p.DeliveredAt,
		&p.TotalAmount,
		&p.AdvanceReceived,
		&p.TotalReceived,
		&p.PartnerShareGiven,
		&p.PartnerShareDate,
		&p.CompletionVideoLink,
		&p.CompletionNotes,
		&p.RepoLink,
		&p.LiveLink,
		&p.DeliveryNotes,
		&p.TechStack,
		&p.Deliverables,
		&p.InternalNotes,
	)
}

func (p *Project) ScanRows(rows *sql.Rows) error {
	return rows.Scan(
		&p.ID,
		&p.Name,
		&p.ClientName,
		&p.Description,
		&p.Type,
		&p.CreatedAt,
		&p.StartDate,
		&p.Deadline,
		&p.CompletedAt,
		&p.DeliveredAt,
		&p.TotalAmount,
		&p.AdvanceReceived,
		&p.TotalReceived,
		&p.PartnerShareGiven,
		&p.PartnerShareDate,
		&p.CompletionVideoLink,
		&p.CompletionNotes,
		&p.RepoLink,
		&p.LiveLink,
		&p.DeliveryNotes,
		&p.TechStack,
		&p.Deliverables,
		&p.InternalNotes,
	)
}
