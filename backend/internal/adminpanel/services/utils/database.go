package utils

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"log"
)

func GetDBFromContext(ctx *gin.Context) (*gorm.DB, bool) {
	dbRaw, exists := ctx.Get("DB")
	if !exists {
		log.Println("❌ DB connection missing")
		return nil, false
	}

	db, ok := dbRaw.(*gorm.DB)
	if !ok {
		log.Println("❌ Invalid DB format")
		return nil, false
	}

	return db, true
}
