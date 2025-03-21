package models

import (
	"backend/internal/adminpanel/db/postgres"
	"backend/internal/adminpanel/entities"
	"backend/internal/adminpanel/repository"
	"backend/internal/adminpanel/services/utils"
	"errors"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BlogPost struct {
	ID       uuid.UUID
	Title    string    `json:"title"`
	Content  string    `json:"content"`
	Position int       `json:"position"`
	Language string    `json:"language"`
	Status   bool      `json:"status"`
	OwnerID  uuid.UUID `json:"owner_id"`
}

type BlogGet struct {
	ID       uuid.UUID
	Title    string    `json:"title"`
	Content  string    `json:"content"`
	Position int       `json:"position"`
	Language string    `json:"language"`
	Status   bool      `json:"status"`
	OwnerID  uuid.UUID `json:"owner_id"`
	Images   []string  `json:"images"`
}

type BlogUpdate struct {
	Title    string `json:"title"`
	Content  string `json:"content"`
	Position int    `json:"position"`
	Status   bool   `json:"status"`
}

type BlogGetAll struct {
	Data  []*BlogGet
	Count int
}

func CreateBlog(b *entities.Blog) (*BlogPost, error) {
	if b.Title == "" {
		return nil, errors.New("the item title cannot be empty")
	}

	err := repository.GetPosition(postgres.DB, b.Position, &entities.Blog{})
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	// Якщо позиція існує, зсуваємо всі наступні
	if err == nil {
		if shiftErr := repository.ShiftPositions[entities.Blog](postgres.DB, b.Position, b.Language); shiftErr != nil {
			return nil, shiftErr
		}
	}

	err = repository.CreateEssence(postgres.DB, b)
	if err != nil {
		return nil, err
	}
	return &BlogPost{
		ID:       b.ID,
		Title:    b.Title,
		Content:  b.Content,
		Position: b.Position,
		Language: b.Language,
		Status:   b.Status,
		OwnerID:  b.OwnerID,
	}, nil
}

func GetAllBlogs(userId uuid.UUID) (*BlogGetAll, error) {
	var blogs []*entities.Blog
	var media []*entities.Media
	response := &BlogGetAll{}

	// Отримуємо всі блоги автора
	err := postgres.DB.Where("owner_id = ?", userId).Order("position ASC").Find(&blogs).Error
	if err != nil {
		return nil, err
	}

	// Отримуємо всі медіафайли, пов'язані з блогами цього автора
	var blogIDs []uuid.UUID
	for _, blog := range blogs {
		blogIDs = append(blogIDs, blog.ID)
	}

	if len(blogIDs) > 0 {
		err = postgres.DB.Where("content_id IN (?)", blogIDs).Find(&media).Error
		if err != nil {
			return nil, err
		}
	}

	// Групуємо медіафайли за ID блогу
	mediaMap := make(map[uuid.UUID][]string)
	for _, m := range media {
		mediaMap[m.ContentId] = append(mediaMap[m.ContentId], m.Url)
	}

	// Формуємо фінальну структуру з блогами та відповідними медіафайлами
	for _, blog := range blogs {
		response.Data = append(response.Data, &BlogGet{
			ID:       blog.ID,
			Title:    blog.Title,
			Content:  blog.Content,
			Position: blog.Position,
			Status:   blog.Status,
			OwnerID:  blog.OwnerID,
			Images:   mediaMap[blog.ID],
		})
	}

	response.Count = len(blogs)
	return response, nil
}

func GetBlogById(id uuid.UUID) (*BlogGet, error) {
	var blog entities.Blog
	var media []*entities.Media

	err := repository.GetByID(postgres.DB, id, &blog)
	if err != nil {
		return nil, err
	}

	err = repository.GetAllMediaByID(postgres.DB, id, &media)
	if err != nil {
		return nil, err
	}

	mediaMap := make(map[uuid.UUID][]string)
	for _, m := range media {
		mediaMap[m.ContentId] = append(mediaMap[m.ContentId], m.Url)
	}

	return &BlogGet{
		ID:       blog.ID,
		Title:    blog.Title,
		Content:  blog.Content,
		Position: blog.Position,
		Status:   blog.Status,
		OwnerID:  blog.OwnerID,
		Images:   mediaMap[blog.ID],
	}, nil
}

func UpdateBlogById(id uuid.UUID, updateBlog *BlogUpdate) (*BlogGet, error) {
	var blog entities.Blog

	// Знаходимо блог за ID
	err := repository.GetByID(postgres.DB, id, &blog)
	if err != nil {
		return nil, err
	}

	// Якщо позиція змінилася - зсуваємо інші блоги
	if updateBlog.Position != blog.Position {
		err = repository.ShiftPositions[entities.Blog](postgres.DB, updateBlog.Position, blog.Language) // Передаємо тільки число
		if err != nil {
			return nil, err
		}
		blog.Position = updateBlog.Position
	}

	// Оновлюємо поля блогу
	if updateBlog.Title != "" {
		blog.Title = updateBlog.Title
	}
	if updateBlog.Content != "" {
		blog.Content = updateBlog.Content
	}

	blog.Status = updateBlog.Status

	// Зберігаємо оновлений блог
	err = postgres.DB.Save(&blog).Error
	if err != nil {
		return nil, err
	}

	// Повертаємо оновлені дані блогу
	return GetBlogById(id)
}

func DeleteBlogById(id uuid.UUID) error {
	var blog entities.Blog
	var mediaList []entities.Media

	err := repository.DeleteByID(postgres.DB, id, &blog)
	if err != nil {
		return err
	}

	err = repository.GetAllMediaByID(postgres.DB, id, &mediaList)
	if err != nil {
		return err
	}
	for _, media := range mediaList {
		err = utils.DeleteImageInBucket(media.Url)
		if err != nil {
			return err
		}
	}

	err = repository.DeleteContentByID(postgres.DB, id, &entities.Media{})
	if err != nil {
		return err
	}

	return nil
}
