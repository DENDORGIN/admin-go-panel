package utils

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"net/http"
)

func GetDBFromContext(ctx *gin.Context) (*gorm.DB, bool) {
	dbRaw, exists := ctx.Get("DB")
	if !exists {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "DB connection missing"})
		return nil, false
	}

	db, ok := dbRaw.(*gorm.DB)
	if !ok {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid DB format"})
		return nil, false
	}

	return db, true
}
