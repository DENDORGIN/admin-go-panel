package routes

import (
	"backend/internal/adminpanel/models"
	"backend/internal/adminpanel/services/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"net/http"
)

func DownloadMediaHandler(ctx *gin.Context) {
	// Отримуємо ID посту з параметрів запиту
	eventIdStr := ctx.Param("postId")

	if eventIdStr == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Event ID is required"})
		return
	}

	// Перевіряємо, чи ID посту є валідним UUID
	postId, err := uuid.Parse(eventIdStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Event ID format"})
		return
	}

	form, err := ctx.MultipartForm()
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse multipart form"})
		return
	}

	files := form.File["files"] // "files" — це ключ у формі, який містить файли
	if len(files) == 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "No files uploaded"})
		return
	}
	var fileUrls []string
	// Завантажуємо кожен файл по черзі
	for _, fileHeader := range files {
		// Завантажуємо файл у Backblaze B2
		fileUrl, err := utils.UploadFile(ctx, fileHeader)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		fileUrls = append(fileUrls, fileUrl)

		// Створюємо об'єкт Media для збереження в базі даних
		media := models.Media{
			ContentId: postId,
			Url:       fileUrl,                               // URL завантаженого файлу
			Type:      fileHeader.Header.Get("Content-Type"), // Тип файлу
		}

		// Зберігаємо дані про файл в базі даних
		_, err = models.DownloadFiles(&media)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	// Повертаємо успішну відповідь
	ctx.JSON(http.StatusCreated, fileUrls)
}
