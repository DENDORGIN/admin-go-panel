package main

import (
	"backend/internal/adminpanel/models"
	"backend/internal/adminpanel/routes"
	"fmt"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"log"
	"net/http"
	"os"
	"strings"
)

func init() {
	err := godotenv.Load(".env")
	if err != nil {
		_ = fmt.Errorf("error loading .env file: %v", err)
	}
}

func main() {

	models.InitDB()

	port := os.Getenv("APP_RUN_PORT")
	fmt.Println(port)
	gin.SetMode(gin.ReleaseMode)

	r := gin.New()
	r.Use(redirectFromWWW())
	r.Use(CustomCors())

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "Healthy",
		})
	})

	//Auth
	r.POST("/api/v1/login/access-token", routes.LoginHandler)

	// Password recovery
	r.POST("/api/v1/password-recovery/:email", routes.RequestPasswordRecover)
	r.POST("/api/v1/reset-password/", routes.ResetPassword)

	//Users
	r.POST("/api/v1/users/signup", routes.CreateUser)

	//Protecting routes with JWT middleware
	r.Use(routes.AuthMiddleware())

	// User routes
	r.GET("/api/v1/users/me", routes.ReadUserMe)
	r.GET("/api/v1/users/", routes.ReadAllUsers)
	r.POST("/api/v1/users/", routes.CreateUser)
	r.PATCH("/api/v1/users/me", routes.UpdateCurrentUser)
	r.PATCH("/api/v1/users/me/password/", routes.UpdatePasswordCurrentUser)
	r.DELETE("/api/v1/users/:id", routes.DeleteUser)

	// Calendar
	r.GET("/api/v1/calendar/events", routes.GetAllEventsHandler)
	r.POST("/api/v1/calendar/events", routes.CreateEventHandler)
	r.DELETE("/api/v1/calendar/events/:id", routes.DeleteEvent)

	// Blogs routes
	r.POST("/api/v1/blog/", routes.CreateBlogHandler)
	r.GET("/api/v1/blog/", routes.GetAllBlogsHandler)

	// Run the server
	if err := r.Run(port); err != nil {
		fmt.Println("Failed to run server", err)
		os.Exit(1)
	}
	log.Printf("Server started on port %s\n", port)

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

func CustomCors() gin.HandlerFunc {
	config := cors.New(
		cors.Config{
			AllowOrigins:     []string{"http://localhost:3000", "http://localhost:5173"},
			AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "PATCH"},
			AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
			ExposeHeaders:    []string{"Content-Length"},
			AllowCredentials: true,
			MaxAge:           12 * 60 * 60, // 12 hours
		})
	return config
}
