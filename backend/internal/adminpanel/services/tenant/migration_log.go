package tenant

import (
	"sync"
)

type MigrationStatus struct {
	TenantName string `json:"tenant_name"`
	Status     string `json:"status"` // "ok", "error", "skipped"
	Message    string `json:"message,omitempty"`
}

var (
	migrationLog []MigrationStatus
	mu           sync.Mutex
)

func logMigration(status MigrationStatus) {
	mu.Lock()
	defer mu.Unlock()
	migrationLog = append(migrationLog, status)
}

func GetMigrationLog() []MigrationStatus {
	mu.Lock()
	defer mu.Unlock()
	return append([]MigrationStatus{}, migrationLog...) // копія
}

func ResetMigrationLog() {
	mu.Lock()
	defer mu.Unlock()
	migrationLog = []MigrationStatus{}
}
