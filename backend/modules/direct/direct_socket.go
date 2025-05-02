package direct

import (
	utils2 "backend/internal/services/utils"
	"encoding/json"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"net/http"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func ServeWs(hub *Hub) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		token := ctx.Query("token")
		_, err := utils2.VerifyResetToken(token)
		if err != nil {
			ctx.JSON(401, gin.H{"error": "Invalid token"})
			return
		}

		db, ok := utils2.GetDBFromContext(ctx)
		if !ok {
			ctx.JSON(500, gin.H{"error": "DB not found in context"})
			return
		}

		user, err := utils2.ParseJWTToken(token)
		if err != nil {
			ctx.JSON(401, gin.H{"error": "Invalid token"})
			return
		}

		conn, err := upgrader.Upgrade(ctx.Writer, ctx.Request, nil)
		if err != nil {
			return
		}

		client := &Client{
			ID:   user.ID,
			Conn: conn,
			Send: make(chan []byte),
			Hub:  hub,
			DB:   db,
		}

		hub.Register <- client

		go client.Read()
		go client.Write()

		go func() {
			allChats, err := LoadAllConversations(db, user.ID)
			if err != nil {
				return
			}
			for _, history := range allChats {
				data, err := json.Marshal(history)
				if err != nil {
					continue
				}
				client.Send <- data
			}
		}()
	}
}
