package rooms

import (
	"backend/modules/chat/rooms/handlers"
	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.RouterGroup) {
	roomGroup := r.Group("/rooms")
	{
		roomGroup.POST("/", handlers.CreateRoomHandler)
		roomGroup.GET("/", handlers.GetAllRoomsHandler)
		roomGroup.GET("/:id", handlers.GetRoomByIdHandler)
		roomGroup.PATCH("/:id", handlers.UpdateRoomByIdHandler)
		roomGroup.DELETE("/:id", handlers.DeleteRoomByIdHandler)
	}
}
