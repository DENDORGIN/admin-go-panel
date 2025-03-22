package main

import (
	"backend/cmd/chat"
	"backend/cmd/chat/rooms"
	"backend/internal/adminpanel/db/postgres"
	"backend/internal/adminpanel/routes"
	"backend/internal/middleware"
	"fmt"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"log"
	"net/http"
	_ "net/http/pprof"
	"os"
	"strings"
	"time"
)

func init() {
	err := godotenv.Load(".env")
	if err != nil {
		_ = fmt.Errorf("error loading .env file: %v", err)
	}
	_ = os.Setenv("TZ", "UTC")
	time.Local = time.UTC
}

func main() {

	go func() {
		log.Println("Starting profiling server on :6060...")
		//http://localhost:6060/debug/pprof/
		log.Fatal(http.ListenAndServe(":6060", nil))
	}()

	//postgres.InitDB()
	postgres.InitAdminDB()

	port := os.Getenv("APP_RUN_PORT")
	fmt.Println(port)
	gin.SetMode(gin.ReleaseMode)

	// Запуск планувальника
	//reminder.StartReminderJobs()

	r := gin.New()
	r.Use(redirectFromWWW())
	r.Use(CustomCors())

	// Choose DB
	r.Use(middleware.TenantMiddleware())

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

	// Chat routes
	r.GET("/ws/chat", chat.HandleWebSocket)

	//Protecting routes with JWT middleware
	r.Use(middleware.AuthMiddleware())

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
	r.PUT("/api/v1/calendar/events/:id", routes.UpdateCalendarEventHandler)
	r.DELETE("/api/v1/calendar/events/:id", routes.DeleteEvent)

	// Blogs routes
	r.POST("/api/v1/blog/", routes.CreateBlogHandler)
	r.GET("/api/v1/blog/", routes.GetAllBlogsHandler)
	r.GET("/api/v1/blog/:id", routes.GetBlogByIdHandler)
	r.PUT("/api/v1/blog/:id", routes.UpdateBlogByIdHandler)
	r.DELETE("/api/v1/blog/:id", routes.DeleteBlogByIdHandler)

	// Items routes
	r.POST("/api/v1/items/", routes.CreateItemHandler)
	r.GET("/api/v1/items/", routes.GetAllItemsHandler)
	r.GET("/api/v1/items/:id", routes.GetItemByID)
	r.PUT("/api/v1/items/:id", routes.UpdateItemByIdHandler)
	r.DELETE("/api/v1/items/:id", routes.DeleteItemByIdHandler)

	// Download files
	r.POST("/api/v1/media/:postId/images", routes.DownloadMediaHandler)
	r.POST("/api/v1/media/images", routes.DownloadMediaOneImageHandler)
	r.GET("/api/v1/media/images/:postId", routes.GetAllMediaByBlogIdHandler)
	r.DELETE("/api/v1/media/images/:postId", routes.DeleteMediaHandler)
	r.DELETE("/api/v1/media/images/url", routes.DeleteImageFromUrl)

	// Properties routes
	r.POST("/api/v1/properties/", routes.CreatePropertiesHandler)
	//r.GET("/api/v1/properties/", routes.GetAllPropertiesHandler)
	r.GET("/api/v1/properties/:id", routes.GetPropertyByIDHandler)
	r.PUT("/api/v1/properties/:id", routes.UpdatePropertyHandler)
	r.DELETE("/api/v1/properties/:id", routes.DeletePropertyHandler)

	// Chat room routes
	r.POST("/api/v1/rooms/", rooms.CreateRoomHandler)
	r.GET("/api/v1/rooms/", rooms.GetAllRoomsHandler)
	r.PUT("/api/v1/rooms/:id", rooms.UpdateRoomByIdHandler)
	r.DELETE("/api/v1/rooms/:id", rooms.DeleteRoomByIdHandler)

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
	config := cors.Config{
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * 60 * 60, // 12 годин
		AllowOriginFunc: func(origin string) bool {
			// дозволяємо всі субдомени localhost:5173
			if strings.HasSuffix(origin, ".localhost:5173") {
				return true
			}
			// або прямий localhost
			if origin == "http://localhost:5173" {
				return true
			}
			return false
		},
	}
	return cors.New(config)
}
