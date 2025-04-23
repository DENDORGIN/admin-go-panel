package postgres

import (
	"backend/internal/adminpanel/entities"
	"backend/internal/adminpanel/services/utils"
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
	if !tenant.Status {
		return nil, fmt.Errorf("tenant inactive")
	}

	// 4. Повертаємо з'єднання або створюємо нове
	if conn, exists := Pool.Get(domain); exists {
		return conn, nil
	}

	// 5. Розшифровуємо дані
	tenantCreds, err := utils.DecryptTenantCreds(&tenant)
	if err != nil {
		return nil, fmt.Errorf("failed to decrypt tenant credentials: %w", err)
	}

	// 6 Формуємо DSN
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Europe/Warsaw",
		tenantCreds.DBHost, tenantCreds.DBUser, tenantCreds.DBPassword, tenantCreds.DBName, tenant.DBPort,
	)

	// 7. Підключення
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to tenant DB: %w", err)
	}

	// 8. Кешуємо через пул
	Pool.Set(domain, db)
	return db, nil
}

// Очистити кеш тентанта за доменом
func (m *DBManager) ClearTenantCache(domain string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.tenantCache, domain)
	Pool.Delete(domain) // 💡 очищаємо і пул
}

func (m *DBManager) TenantFromCache(domain string) entities.Tenant {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.tenantCache[domain]
}
