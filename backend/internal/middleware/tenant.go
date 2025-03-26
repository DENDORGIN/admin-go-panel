package middleware

import (
	"net/http"
	"strings"

	"backend/internal/adminpanel/db/postgres"
	"backend/internal/adminpanel/entities"
	"github.com/gin-gonic/gin"
)

func TenantMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		host := c.Request.Host
		host = strings.Split(host, ":")[0] // прибрати порт, якщо є

		subdomain := strings.Split(host, ".")[0] // беремо тільки субдомен

		var tenant entities.Tenant
		db := postgres.GetDB()

		if err := db.Where("domain = ?", subdomain).First(&tenant).Error; err != nil {
			c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "Tenant not found"})
			return
		}

		tenantDB, err := postgres.Manager.GetConnection(tenant)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "DB connection error"})
			return
		}

		c.Set("DB", tenantDB)
		c.Set("tenant", tenant)

		if !tenant.Migrated {
			postgres.InitDB(c)

			// Після успішної міграції позначаємо як завершену
			db.Model(&tenant).Update("migrated", true)
		}

		c.Next()
	}
}
