package direct

import (
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"net/http"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func ServeWs(hub *Hub) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.Query("user_id") // тут має бути авторизація через токен
		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			return
		}

		client := &Client{
			ID:   userID,
			Conn: conn,
			Send: make(chan []byte),
			Hub:  hub,
		}

		hub.Register <- client

		go client.Read()
		go client.Write()
	}
}
