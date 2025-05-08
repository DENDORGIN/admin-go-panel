package buffer

import (
	"backend/internal/services/bufferedwriter"
	"backend/modules/chat/messages/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"log"
	"sync"
	"time"
)

var (
	pool      = make(map[uuid.UUID]*bufferedwriter.Writer[models.Messages])
	poolMutex sync.Mutex
)

func GetOrCreateWriter(tenantID uuid.UUID, db *gorm.DB) *bufferedwriter.Writer[models.Messages] {
	poolMutex.Lock()
	defer poolMutex.Unlock()

	if writer, exists := pool[tenantID]; exists {
		return writer
	}

	writer := bufferedwriter.NewWriter[models.Messages](
		db,
		5*time.Second,
		30,
		func(tx *gorm.DB, items []models.Messages) error {
			return tx.Create(&items).Error
		},
		func(count int) {
			log.Printf("✅ [%s] збережено %d повідомлень", tenantID, count)
		},
		func(err error) {
			log.Printf("❌ [%s] помилка збереження повідомлень: %v", tenantID, err)
		},
	)

	pool[tenantID] = writer
	return writer
}
