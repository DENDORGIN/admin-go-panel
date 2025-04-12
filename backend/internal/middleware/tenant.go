package middleware

import (
	"net/http"
	"strings"

	"backend/internal/adminpanel/db/postgres"
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

		tenantDB, err := postgres.Manager.GetConnectionByDomain(subdomain)
		if err != nil {
			if isWebSocketRequest(c) {
				c.AbortWithStatus(http.StatusNotFound)
			} else {
				c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "Tenant not found or DB error"})
			}
			return
		}

		// Дістаємо tenant із кешу після підключення
		tenant := postgres.Manager.TenantFromCache(subdomain) // 👈 додай цей метод

		c.Set("DB", tenantDB)
		c.Set("tenant", tenant)

		if !tenant.Migrated {
			postgres.InitDB(c)
			postgres.GetDB().Model(&tenant).Update("migrated", true)
		}

		c.Next()
	}
}
