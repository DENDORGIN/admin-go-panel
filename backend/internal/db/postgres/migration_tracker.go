package postgres

import (
	"github.com/google/uuid"
	"sync"
)

var migratedTenants sync.Map

func MarkTenantMigrated(tenantID uuid.UUID) {
	migratedTenants.Store(tenantID, true)
}

func IsTenantMigrated(tenantID uuid.UUID) bool {
	_, ok := migratedTenants.Load(tenantID)
	return ok
}
