package middleware

import (
	"backend/internal/db/postgres"
	"net/http"
	"strings"

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
			// якщо tenant.Status == false — повертаємо 403, інакше 404
			statusCode := http.StatusNotFound
			errMsg := "Tenant not found or DB error"
			if strings.Contains(err.Error(), "inactive") {
				statusCode = http.StatusForbidden
				errMsg = "Tenant is inactive"
			}
			if isWebSocketRequest(c) {
				c.AbortWithStatus(statusCode)
			} else {
				c.AbortWithStatusJSON(statusCode, gin.H{"error": errMsg})
			}
			return
		}

		// Дістаємо tenant із кешу після підключення
		tenant := postgres.Manager.TenantFromCache(subdomain)

		c.Set("DB", tenantDB)
		c.Set("tenant", tenant)

		c.Next()
	}
}
