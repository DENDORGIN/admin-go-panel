package models

import (
	"backend/internal/adminpanel/db/postgres"
	"errors"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"
)

type Blog struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Title     string    `gorm:"not null" json:"title"`
	Content   string    `gorm:"not null" json:"content"`
	Position  int       `gorm:"not null" json:"position"`
	Status    bool      `gorm:"default:false" json:"status"`
	AuthorID  uuid.UUID `gorm:"not null;index" json:"-"`
	User      User      `gorm:"foreignKey:AuthorID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"user"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

func (c *Blog) BeforeCreate(*gorm.DB) error {
	c.ID = uuid.New()
	return nil
}

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
	//Images   []string `json:"images"`
}

type BlogGetAll struct {
	Data  []*BlogGet
	Count int
}

func CreateBlog(b *Blog) (*BlogPost, error) {
	if b.Title == "" {
		return nil, errors.New("the event name cannot be empty")
	}

	b.ID = uuid.New()
	if err := postgres.DB.Create(b).Error; err != nil {
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
	var blogs []*Blog
	var media []*Media
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
	var blog Blog
	var media []*Media

	err := postgres.DB.Where("id =?", id).First(&blog).Error
	if err != nil {
		return nil, err
	}

	err = postgres.DB.Where("content_id =?", id).Find(&media).Error
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
	var blog Blog

	err := postgres.DB.Where("id =?", id).First(&blog).Error
	if err != nil {
		return nil, err
	}

	blog.Title = updateBlog.Title
	blog.Content = updateBlog.Content
	blog.Position = updateBlog.Position
	blog.Status = updateBlog.Status

	err = postgres.DB.Save(&blog).Error
	if err != nil {
		return nil, err
	}

	return GetBlogById(id)

}

func DeleteBlogById(id uuid.UUID) error {
	var blog Blog
	var media Media

	err := postgres.DB.Where("id =?", id).Delete(&blog).Error
	if err != nil {
		return err
	}
	err = postgres.DB.Where("content_id", id).Delete(&media).Error
	if err != nil {
		return err
	}

	return nil
}
