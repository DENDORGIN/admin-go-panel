package handlers

import (
	utils2 "backend/internal/services/utils"
	"backend/modules/sse"
	"fmt"
	"github.com/gin-gonic/gin"
	"log"
	"net/http"
	"time"
)

func SSEStreamHandler(ctx *gin.Context) {

	token := ctx.Query("token")
	user, err := utils2.ParseJWTToken(token)
	if err != nil {
		log.Println("❌ Невалідний токен:", err)
		ctx.AbortWithStatus(http.StatusUnauthorized)
		return
	}

	writer := ctx.Writer
	request := ctx.Request

	writer.Header().Set("Content-Type", "text/event-stream")
	writer.Header().Set("Cache-Control", "no-cache")
	writer.Header().Set("Connection", "keep-alive")
	ctx.Header("X-Accel-Buffering", "no")

	flusher, ok := ctx.Writer.(http.Flusher)
	if ok {
		flusher.Flush()
	}

	userID := user.ID
	clientChan := make(chan sse.SSEMessage, 10)
	sse.Manager.AddClient(userID, clientChan)
	defer sse.Manager.RemoveClient(userID)

	log.Println("✅ SSE підключено для користувача:", userID)

	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()

	// Відправляємо стартове повідомлення
	fmt.Fprintf(writer, "event: connected\ndata: connected to SSE\n\n")
	flusher.Flush()

	// Основний цикл: слухаємо повідомлення
	for {
		select {
		case msg := <-clientChan:
			fmt.Fprintf(writer, "event: %s\n", msg.Event)
			fmt.Fprintf(writer, "data: %s\n\n", msg.Data)

			flusher.Flush()
		case <-request.Context().Done():
			return
		}
	}
}
