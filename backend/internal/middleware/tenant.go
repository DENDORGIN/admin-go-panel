package middleware

import (
	"net/http"
	"strings"

	"backend/internal/adminpanel/db/postgres"
	"backend/internal/adminpanel/entities"
	"github.com/gin-gonic/gin"
)

// 🔹 Окрема утиліта
func isWebSocketRequest(c *gin.Context) bool {
	return strings.Contains(strings.ToLower(c.Request.Header.Get("Connection")), "upgrade") &&
		strings.ToLower(c.Request.Header.Get("Upgrade")) == "websocket"
}

// 🔸 Основний middleware
func TenantMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		host := c.Request.Host
		host = strings.Split(host, ":")[0]
		subdomain := strings.Split(host, ".")[0]

		var tenant entities.Tenant
		db := postgres.GetDB()

		if err := db.Where("domain = ?", subdomain).First(&tenant).Error; err != nil {
			if isWebSocketRequest(c) {
				c.AbortWithStatus(http.StatusNotFound)
			} else {
				c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "Tenant not found"})
			}
			return
		}

		tenantDB, err := postgres.Manager.GetConnection(tenant)
		if err != nil {
			if isWebSocketRequest(c) {
				c.AbortWithStatus(http.StatusInternalServerError)
			} else {
				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "DB connection error"})
			}
			return
		}

		c.Set("DB", tenantDB)
		c.Set("tenant", tenant)

		if !tenant.Migrated {
			postgres.InitDB(c)
			db.Model(&tenant).Update("migrated", true)
		}

		c.Next()
	}
}
