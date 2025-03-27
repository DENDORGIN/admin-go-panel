package tenant

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

func MigrateAllTenantsHandler(c *gin.Context) {
	//user, _ := c.Get("user") // припускаємо, що AuthMiddleware зберігає user
	//u := user.(YourUserStruct) // заміни на свою структуру
	//
	//if !u.IsSuperUser {
	//	c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
	//	return
	//}

	go MigrateAllTenants() // у фоновому режимі

	c.JSON(http.StatusOK, gin.H{"message": "Migration started"})
}

func GetMigrationStatusHandler(c *gin.Context) {
	//user, _ := c.Get("user")
	//u := user.(YourUserStruct) // заміни на свою структуру
	//
	//if !u.IsSuperUser {
	//	c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
	//	return
	//}

	statuses := GetMigrationLog()
	c.JSON(http.StatusOK, statuses)
}
