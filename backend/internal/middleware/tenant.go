package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"backend/internal/adminpanel/entities"
	"backend/internal/adminpanel/database"
	"backend/pkg/postgres"
)

func TenantMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		host := c.Request.Host
		domain := strings.Split(host, ":")[0] // прибираємо порт

		var tenant entities.Tenant
		db := postgres.GetDB()

		if err := db.Where("domain = ?", domain).First(&tenant).Error; err != nil {
			c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "Tenant not found"})
			return
		}

		tenantDB, err := database.Manager.GetConnection(tenant)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "DB connection error"})
			return
		}

		c.Set("DB", tenantDB)
		c.Next()
	}
}
