package routes

import (
	"backend/internal/adminpanel/entities"
	"backend/internal/adminpanel/models"
	"backend/internal/adminpanel/services/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"net/http"
)

func CreateBlogHandler(ctx *gin.Context) {

	userID, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return
	}

	var blog entities.Blog
	if err := ctx.ShouldBindJSON(&blog); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	blog.AuthorID = userID

	newBlog, err := models.CreateBlog(&blog)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, newBlog)
}

func GetAllBlogsHandler(ctx *gin.Context) {
	userID, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return
	}

	blogs, err := models.GetAllBlogs(userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, blogs)
}

func GetBlogByIdHandler(ctx *gin.Context) {
	userID, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return
	}

	id, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid blog ID"})
		return
	}

	blog, err := models.GetBlogById(id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if blog.AuthorID != userID {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Access denied"})
		return
	}

	ctx.JSON(http.StatusOK, blog)
}

func UpdateBlogByIdHandler(ctx *gin.Context) {
	userID, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return
	}

	id, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid blog ID"})
		return
	}

	var update models.BlogUpdate
	if err := ctx.ShouldBindJSON(&update); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	blog, err := models.UpdateBlogById(id, &update)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if blog.AuthorID != userID {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Access denied"})
		return
	}

	ctx.JSON(http.StatusOK, blog)

}

func DeleteBlogByIdHandler(ctx *gin.Context) {
	userID, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return
	}

	id, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid blog ID"})
		return
	}

	blog, err := models.GetBlogById(id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	isSuperUser, err := models.GetCurrentUserIsSuperUser(userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if blog.AuthorID != userID || !isSuperUser {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Access denied"})
		return
	}
	err = models.DeleteBlogById(id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.Status(http.StatusOK)
}
