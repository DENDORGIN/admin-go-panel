package main

import (
	"backend/internal/adminpanel/db/postgres"
	"backend/internal/adminpanel/routes"
	"backend/internal/adminpanel/services/reminder"
	"backend/internal/middleware"
	"backend/modules/blog"
	"backend/modules/chat"
	"backend/modules/direct"
	"backend/modules/item"
	"backend/modules/property"
	"backend/modules/user"
	"backend/modules/user/handlers"
	"fmt"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"log"
	"net/http"
	_ "net/http/pprof"
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

	go func() {
		log.Println("Starting profiling server on :6060...")
		//http://localhost:6060/debug/pprof/
		log.Fatal(http.ListenAndServe(":6060", nil))
	}()

	postgres.InitAdminDB()

	port := os.Getenv("APP_RUN_PORT")
	fmt.Println(port)
	gin.SetMode(gin.ReleaseMode)

	r := gin.New()
	r.Use(gin.Logger())
	r.Use(redirectFromWWW())
	r.Use(CustomCors())

	// Login limiter middleware
	r.Use(middleware.LoginLimiterMiddleware())

	// Choose DB
	r.Use(middleware.TenantMiddleware())

	// Start reminder jobs
	reminder.StartAllTenantReminderJobs()

	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "Healthy",
		})
	})
	r.GET("/api/init", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "Init",
		})
	})

	//Auth
	r.POST("/v1/login/access-token", handlers.LoginHandler)

	// Password recovery
	r.POST("/v1/password-recovery/:email", handlers.RequestPasswordRecover)
	r.POST("/v1/reset-password/", handlers.ResetPassword)

	//Users
	//r.POST("/v1/users/signup", routes.CreateUser)

	// Chat routes
	r.GET("/ws/chat", chat.HandleWebSocket)

	//Direct messages
	hub := direct.NewHub()
	go hub.Run()
	r.GET("/ws/direct", direct.ServeWs(hub))

	// Link preview
	r.GET("/link-preview", routes.FetchLinkPreview)

	//Protecting routes with JWT middleware
	r.Use(middleware.AuthMiddleware())

	// User routes
	version := r.Group("/v1")
	user.RegisterRoutes(version)

	// Blogs routes
	blog.RegisterRoutes(version)

	// Items routes
	item.RegisterRoutes(version)

	// Properties routes
	property.RegisterRoutes(version)

	// Calendar
	r.GET("/v1/calendar/events", routes.GetAllEventsHandler)
	r.POST("/v1/calendar/events", routes.CreateEventHandler)
	r.PUT("/v1/calendar/events/:id", routes.UpdateCalendarEventHandler)
	r.DELETE("/v1/calendar/events/:id", routes.DeleteEvent)

	// Download files
	r.POST("/v1/media/:postId/images", routes.DownloadMediaHandler)
	r.POST("/v1/media/images", routes.DownloadMediaOneImageHandler)
	r.GET("/v1/media/images/:postId", routes.GetAllMediaByBlogIdHandler)
	r.DELETE("/v1/media/images/:postId", routes.DeleteMediaHandler)
	r.DELETE("/v1/media/images/url", routes.DeleteImageFromUrl)

	// Chat room routes
	r.POST("/v1/rooms/", routes.CreateRoomHandler)
	r.GET("/v1/rooms/", routes.GetAllRoomsHandler)
	r.GET("/v1/rooms/:id", routes.GetRoomByIdHandler)
	r.PUT("/v1/rooms/:id", routes.UpdateRoomByIdHandler)
	r.DELETE("/v1/rooms/:id", routes.DeleteRoomByIdHandler)

	// Direct messages routes
	r.GET("/v1/direct/users", direct.GetChatUsersHandler)
	r.GET("/v1/direct/:user_id/messages", direct.GetMessagesHandler)

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
	appHost := os.Getenv("APP_HOST")
	appUrl := os.Getenv("APP_URL")

	config := cors.Config{
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * 60 * 60, // 12 годин
		AllowOriginFunc: func(origin string) bool {

			if strings.HasSuffix(origin, "."+appHost) || origin == "http://"+appHost {
				return true
			}

			if strings.HasSuffix(origin, "."+appUrl) || origin == "https://"+appUrl {
				return true
			}

			return false
		},
	}
	return cors.New(config)
}
