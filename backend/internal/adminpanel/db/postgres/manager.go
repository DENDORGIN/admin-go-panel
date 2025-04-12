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
	tenantCache map[string]entities.Tenant
}

var Manager = &DBManager{
	connections: make(map[string]*gorm.DB),
	tenantCache: make(map[string]entities.Tenant),
}

// Отримати підключення до БД тентанта
func (m *DBManager) GetConnectionByDomain(domain string) (*gorm.DB, error) {
	var tenant entities.Tenant

	// 1. Шукаємо tenant у кеші
	m.mu.RLock()
	cachedTenant, found := m.tenantCache[domain]
	m.mu.RUnlock()

	if found {
		tenant = cachedTenant
	} else {
		// 2. Якщо нема — тягнемо з головної БД
		err := GetDB().Where("domain = ?", domain).First(&tenant).Error
		if err != nil {
			return nil, fmt.Errorf("tenant not found: %w", err)
		}

		// 3. Кладемо в кеш
		m.mu.Lock()
		m.tenantCache[domain] = tenant
		m.mu.Unlock()
	}

	// 4. Повертаємо з'єднання або створюємо нове
	m.mu.RLock()
	conn, exists := m.connections[domain]
	m.mu.RUnlock()

	if exists {
		return conn, nil
	}

	// 5. Формуємо DSN
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Europe/Warsaw",
		tenant.DBHost, tenant.DBUser, tenant.DBPassword, tenant.DBName, tenant.DBPort,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to tenant DB: %w", err)
	}

	// 6. Кешуємо з'єднання
	m.mu.Lock()
	m.connections[domain] = db
	m.mu.Unlock()

	return db, nil
}

// Очистити кеш тентанта за доменом
func (m *DBManager) ClearTenantCache(domain string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.tenantCache, domain)
	delete(m.connections, domain)
}

func (m *DBManager) TenantFromCache(domain string) entities.Tenant {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.tenantCache[domain]
}
