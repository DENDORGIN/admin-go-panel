package direct

//
import (
	"backend/modules/direct/handlers"
	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.RouterGroup) {

	directGroup := r.Group("/direct")
	{
		directGroup.GET("/users", handlers.GetDirectChatUsers)
		directGroup.POST("/chats", handlers.GetOrCreateDirectChat)
		directGroup.GET("/chats/:chatId/messages", handlers.GetDirectMessages)
		directGroup.GET("/chats/:chatId/messages/:messageId", handlers.GetDirectMessageById)
		directGroup.PATCH("/chats/:chatId/messages/:messageId", handlers.EditDirectMessage)
		directGroup.PATCH("/chats/:chatId/messages/:messageId/reaction", handlers.AddEmojiToMessage)

		directGroup.DELETE("/chats/:chatId/messages/:messageId", handlers.DeleteDirectMessage)

		//directGroup.GET("/ws/chats/:chatId", handlers.DirectChatWebSocket)
	}
}
