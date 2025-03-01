package models

import (
	"backend/internal/adminpanel/db/postgres"
	"backend/internal/adminpanel/entities"
	"backend/internal/adminpanel/repository"
	"backend/internal/adminpanel/services/utils"
	"errors"
	"fmt"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

//type Blog struct {
//	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
//	Title     string    `gorm:"not null" json:"title"`
//	Content   string    `gorm:"not null" json:"content"`
//	Position  int       `gorm:"not null" json:"position"`
//	Status    bool      `gorm:"default:false" json:"status"`
//	AuthorID  uuid.UUID `gorm:"not null;index" json:"-"`
//	User      User      `gorm:"foreignKey:AuthorID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"user"`
//	CreatedAt time.Time
//	UpdatedAt time.Time
//}
//
//func (c *Blog) BeforeCreate(*gorm.DB) error {
//	c.ID = uuid.New()
//	return nil
//}

type BlogPost struct {
	ID       uuid.UUID
	Title    string    `json:"title"`
	Content  string    `json:"content"`
	Position int       `json:"position"`
	Status   bool      `json:"status"`
	AuthorID uuid.UUID `json:"author_id"`
}

type BlogGet struct {
	ID       uuid.UUID
	Title    string    `json:"title"`
	Content  string    `json:"content"`
	Position int       `json:"position"`
	Status   bool      `json:"status"`
	AuthorID uuid.UUID `json:"author_id"`
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
		if shiftErr := repository.ShiftPositions[entities.Blog](postgres.DB, b.Position); shiftErr != nil {
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
		Status:   b.Status,
		AuthorID: b.AuthorID,
	}, nil
}

func GetAllBlogs(userId uuid.UUID) (*BlogGetAll, error) {
	var blogs []*entities.Blog
	var media []*entities.Media
	response := &BlogGetAll{}

	// Отримуємо всі блоги автора
	err := postgres.DB.Where("author_id = ?", userId).Order("position ASC").Find(&blogs).Error
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
			AuthorID: blog.AuthorID,
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
		AuthorID: blog.AuthorID,
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
		err = repository.ShiftPositions[entities.Blog](postgres.DB, updateBlog.Position) // Передаємо тільки число
		if err != nil {
			return nil, err
		}
		blog.Position = updateBlog.Position
	}

	// Оновлюємо поля блогу
	blog.Title = updateBlog.Title
	blog.Content = updateBlog.Content
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
		fileName := utils.ExtractFileNameFromURL(media.Url)
		fmt.Println("Deleted file:", fileName)
		err = utils.DeleteFile(fileName)
		if err != nil {
			return err
		}
	}

	err = repository.DeleteMediaByID(postgres.DB, id, &entities.Media{})
	if err != nil {
		return err
	}

	return nil
}
