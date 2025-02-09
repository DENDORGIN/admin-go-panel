package main

import (
	"backend/internal/adminpanel/routes"
	"fmt"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"net/http"
	"os"
	"strings"
)

func main() {

	port := os.Getenv("APP_RUN_PORT")
	fmt.Println(port)
	gin.SetMode(gin.ReleaseMode)

	r := gin.New()
	r.Use(redirectFromWWW())
	r.Use(cors.Default())

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "Healthy",
		})
	})
	r.POST("/api/v1/users/", routes.CreateUser)
	r.POST("/api/v1/login/access-token", routes.LoginHandler)

	if err := r.Run(port); err != nil {
		fmt.Println("Failed to run server", err)
		os.Exit(1)
	}
	fmt.Printf("Server started on port %s\n", port)

}

func redirectFromWWW() gin.HandlerFunc {
	return func(c *gin.Context) {
		if strings.HasPrefix(c.Request.Host, "www.") {
			newHost := "https://" + c.Request.Host[len("www."):]
			c.Redirect(http.StatusMovedPermanently, newHost+c.Request.URL.String())
			return
		}
		c.Next()
	}
}
