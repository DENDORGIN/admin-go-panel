package direct

import (
	"backend/internal/adminpanel/services/utils"
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
		_, err := utils.VerifyResetToken(token)
		if err != nil {
			ctx.JSON(401, gin.H{"error": "Invalid token"})
			return
		}

		db, ok := utils.GetDBFromContext(ctx)
		if !ok {
			ctx.JSON(500, gin.H{"error": "DB not found in context"})
			return
		}

		user, err := utils.ParseJWTToken(token)
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
	}
}
