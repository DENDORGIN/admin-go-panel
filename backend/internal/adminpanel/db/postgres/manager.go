package postgres

import (
	"backend/internal/adminpanel/entities"
	"fmt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"sync"
)

type DBManager struct {
	mu          sync.RWMutex
	connections map[string]*gorm.DB
}

var Manager = &DBManager{
	connections: make(map[string]*gorm.DB),
}

func (m *DBManager) GetConnection(tenant entities.Tenant) (*gorm.DB, error) {
	m.mu.RLock()
	conn, exists := m.connections[tenant.Domain]
	m.mu.RUnlock()

	if exists {
		return conn, nil
	}

	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Europe/Warsaw",
		tenant.DBHost, tenant.DBUser, tenant.DBPassword, tenant.DBName, tenant.DBPort,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	m.mu.Lock()
	m.connections[tenant.Domain] = db
	m.mu.Unlock()

	return db, nil
}
