package main

import (
	"backend/cmd/chat"
	"backend/cmd/chat/direct"
	"backend/internal/adminpanel/db/postgres"
	"backend/internal/adminpanel/routes"
	"backend/internal/adminpanel/services/reminder"
	"backend/internal/adminpanel/services/tenant"
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
)

func init() {
	err := godotenv.Load(".env")
	if err != nil {
		_ = fmt.Errorf("error loading .env file: %v", err)
	}
	//_ = os.Setenv("TZ", "UTC")
	//time.Local = time.UTC
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
	r.Use(redirectFromWWW())
	r.Use(CustomCors())

	r.POST("/api/v1/tenant", tenant.TenantHandler)
	r.POST("/admin/migrate-all", tenant.MigrateAllTenantsHandler)
	r.GET("/admin/migrate-all/status", tenant.GetMigrationStatusHandler)

	// Choose DB
	r.Use(middleware.TenantMiddleware())

	// Запуск планувальника
	reminder.StartAllTenantReminderJobs()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "Healthy",
		})
	})

	//Auth
	r.POST("/v1/login/access-token", routes.LoginHandler)

	// Password recovery
	r.POST("/v1/password-recovery/:email", routes.RequestPasswordRecover)
	r.POST("/v1/reset-password/", routes.ResetPassword)

	//Users
	r.POST("/v1/users/signup", routes.CreateUser)

	// Chat routes
	r.GET("/ws/chat", chat.HandleWebSocket)

	hub := direct.NewHub()
	go hub.Run()
	r.GET("/ws/direct", direct.ServeWs(hub))

	// Link preview
	r.GET("/link-preview", routes.FetchLinkPreview)

	//Protecting routes with JWT middleware
	r.Use(middleware.AuthMiddleware())

	// User routes
	r.GET("/v1/users/me", routes.ReadUserMe)
	r.GET("/v1/users/", routes.ReadAllUsers)
	r.POST("/v1/users/", routes.CreateUser)
	r.PATCH("/v1/users/me", routes.UpdateCurrentUser)
	r.PATCH("v1/users/me/password/", routes.UpdatePasswordCurrentUser)
	r.DELETE("/v1/users/:id", routes.DeleteUser)

	// Calendar
	r.GET("/v1/calendar/events", routes.GetAllEventsHandler)
	r.POST("/v1/calendar/events", routes.CreateEventHandler)
	r.PUT("/v1/calendar/events/:id", routes.UpdateCalendarEventHandler)
	r.DELETE("/v1/calendar/events/:id", routes.DeleteEvent)

	//reminder.StartReminderJobs()

	// Blogs routes
	r.POST("/v1/blog/", routes.CreateBlogHandler)
	r.GET("/v1/blog/", routes.GetAllBlogsHandler)
	r.GET("/v1/blog/:id", routes.GetBlogByIdHandler)
	r.PUT("/v1/blog/:id", routes.UpdateBlogByIdHandler)
	r.DELETE("/v1/blog/:id", routes.DeleteBlogByIdHandler)

	// Items routes
	r.POST("/v1/items/", routes.CreateItemHandler)
	r.GET("/v1/items/", routes.GetAllItemsHandler)
	r.GET("/v1/items/:id", routes.GetItemByID)
	r.GET("/v1/items/languages", routes.GetAvailableLanguages)
	r.GET("/v1/items/categories", routes.GetAvailableCategories)
	r.PATCH("/v1/items/:id", routes.UpdateItemByIdHandler)
	r.DELETE("/v1/items/:id", routes.DeleteItemByIdHandler)

	// Download files
	r.POST("/v1/media/:postId/images", routes.DownloadMediaHandler)
	r.POST("/v1/media/images", routes.DownloadMediaOneImageHandler)
	r.GET("/v1/media/images/:postId", routes.GetAllMediaByBlogIdHandler)
	r.DELETE("/v1/media/images/:postId", routes.DeleteMediaHandler)
	r.DELETE("/v1/media/images/url", routes.DeleteImageFromUrl)

	// Properties routes
	r.POST("/v1/properties/", routes.CreatePropertiesHandler)
	//r.GET("/api/v1/properties/", routes.GetAllPropertiesHandler)
	r.GET("/v1/properties/:id", routes.GetPropertyByIDHandler)
	r.PUT("/v1/properties/:id", routes.UpdatePropertyHandler)
	r.DELETE("/v1/properties/:id", routes.DeletePropertyHandler)

	// Chat room routes
	r.POST("/v1/rooms/", routes.CreateRoomHandler)
	r.GET("/v1/rooms/", routes.GetAllRoomsHandler)
	r.GET("/v1/rooms/:id", routes.GetRoomByIdHandler)
	r.PUT("/v1/rooms/:id", routes.UpdateRoomByIdHandler)
	r.DELETE("/v1/rooms/:id", routes.DeleteRoomByIdHandler)

	// Direct messages routes
	r.GET("/v1/direct/:user_id/messages", routes.GetMessagesHandler)

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

			if strings.HasSuffix(origin, ".localhost:5173") || origin == "http://localhost:5173" {
				return true
			}

			if strings.HasSuffix(origin, ".dbgone.com") || origin == "https://dbgone.com" {
				return true
			}

			return false
		},
	}
	return cors.New(config)
}
