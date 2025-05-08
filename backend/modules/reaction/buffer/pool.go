package buffer

import (
	"backend/internal/services/bufferedwriter"
	reactionDTO "backend/modules/reaction/models"
	"errors"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"log"
	"sync"
	"time"
)

type BufferedReactionPayload struct {
	UserID    uuid.UUID
	MessageID uuid.UUID
	Emoji     string
}

var (
	reactionPool      = make(map[uuid.UUID]*bufferedwriter.Writer[BufferedReactionPayload])
	reactionPoolMutex sync.Mutex
	flushImmediately  = true
)

func GetOrCreateWriter(tenantID uuid.UUID, db *gorm.DB) *bufferedwriter.Writer[BufferedReactionPayload] {
	reactionPoolMutex.Lock()
	defer reactionPoolMutex.Unlock()

	if writer, exists := reactionPool[tenantID]; exists {
		return writer
	}

	writer := bufferedwriter.NewWriter[BufferedReactionPayload](
		db,
		5*time.Second,
		50,
		FlushBufferedReactions,
		func(count int) {
			log.Printf("✅ [%s] Buffered %d reactions", tenantID, count)
		},
		func(err error) {
			log.Printf("❌ [%s] Reaction flush error: %v", tenantID, err)
		},
	)

	reactionPool[tenantID] = writer
	return writer
}

func AddReactionBuffered(tenantID uuid.UUID, db *gorm.DB, payload BufferedReactionPayload) {
	writer := GetOrCreateWriter(tenantID, db)
	writer.Add(payload)
	if flushImmediately {
		go writer.Flush()
	}
}

func FlushBufferedReactions(db *gorm.DB, payloads []BufferedReactionPayload) error {
	for _, p := range payloads {
		var existing reactionDTO.Reaction

		err := db.Where("user_id = ? AND message_id = ?", p.UserID, p.MessageID).
			First(&existing).Error

		if err == nil {
			// Якщо така ж emoji — видаляємо
			if existing.Emoji == p.Emoji {
				if err := db.Delete(&existing).Error; err != nil {
					log.Println("❌ delete reaction:", err)
				}
			} else {
				// Інакше — оновлюємо emoji
				existing.Emoji = p.Emoji
				if err := db.Save(&existing).Error; err != nil {
					log.Println("❌ update reaction:", err)
				}
			}
		} else if errors.Is(err, gorm.ErrRecordNotFound) {
			// Якщо нічого не знайшли — створюємо
			newReaction := reactionDTO.Reaction{
				UserId:    p.UserID,
				MessageID: p.MessageID,
				Emoji:     p.Emoji,
			}
			if err := db.Create(&newReaction).Error; err != nil {
				log.Println("❌ insert reaction:", err)
			}
		} else {
			log.Println("❌ select reaction:", err)
		}
	}
	return nil
}
