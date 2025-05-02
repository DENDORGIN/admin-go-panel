package postgres

import (
	"gorm.io/gorm"
	"sync"
)

type tenantPool struct {
	mu   sync.RWMutex
	pool map[string]*gorm.DB
}

var Pool = &tenantPool{
	pool: make(map[string]*gorm.DB),
}

// Get returns *gorm.DB from cache if exists
func (tp *tenantPool) Get(domain string) (*gorm.DB, bool) {
	tp.mu.RLock()
	defer tp.mu.RUnlock()
	conn, ok := tp.pool[domain]
	return conn, ok
}

// Set caches *gorm.DB for domain
func (tp *tenantPool) Set(domain string, db *gorm.DB) {
	tp.mu.Lock()
	defer tp.mu.Unlock()
	tp.pool[domain] = db
}

// Delete removes connection from cache
func (tp *tenantPool) Delete(domain string) {
	tp.mu.Lock()
	defer tp.mu.Unlock()
	delete(tp.pool, domain)
}
