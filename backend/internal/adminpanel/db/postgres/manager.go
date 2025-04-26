package postgres

import (
	"backend/internal/adminpanel/entities"
	"backend/internal/adminpanel/services/utils"
	"fmt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"sync"
	"time"
)

const cacheTTL = 60 // час життя кешу в секундах

type CachedTenant struct {
	Tenant     entities.Tenant
	LastUpdate int64
}

type DBManager struct {
	mu          sync.RWMutex
	connections map[string]*gorm.DB
	tenantCache map[string]CachedTenant
}

var Manager = &DBManager{
	connections: make(map[string]*gorm.DB),
	tenantCache: make(map[string]CachedTenant),
}

// Отримати підключення до БД тентанта
func (m *DBManager) GetConnectionByDomain(domain string) (*gorm.DB, error) {
	var tenant entities.Tenant

	now := time.Now().Unix()

	m.mu.RLock()
	cachedTenant, found := m.tenantCache[domain]
	m.mu.RUnlock()

	if found && now-cachedTenant.LastUpdate < cacheTTL {
		tenant = cachedTenant.Tenant
	} else {
		// Оновлюємо tenant з БД
		if err := GetDB().Where("domain = ?", domain).First(&tenant).Error; err != nil {
			return nil, fmt.Errorf("tenant not found: %w", err)
		}

		m.mu.Lock()
		m.tenantCache[domain] = CachedTenant{
			Tenant:     tenant,
			LastUpdate: now,
		}
		m.mu.Unlock()
	}

	// Перевіряємо активність тентанта
	if !tenant.Status {
		return nil, fmt.Errorf("tenant inactive")
	}

	// Повертаємо чинне підключення або створюємо нове
	if conn, exists := Pool.Get(domain); exists {
		return conn, nil
	}

	tenantCreds, err := utils.DecryptTenantCreds(&tenant)
	if err != nil {
		return nil, fmt.Errorf("failed to decrypt tenant credentials: %w", err)
	}

	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Europe/Warsaw",
		tenantCreds.DBHost, tenantCreds.DBUser, tenantCreds.DBPassword, tenantCreds.DBName, tenant.DBPort,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to tenant DB: %w", err)
	}

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

// Дістати тентанта з кешу
func (m *DBManager) TenantFromCache(domain string) entities.Tenant {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.tenantCache[domain].Tenant
}
