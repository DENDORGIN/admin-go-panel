package models

import (
	"backend/internal/adminpanel/db/postgres"
	"backend/internal/adminpanel/entities"
	"backend/internal/adminpanel/repository"
	"errors"

	//"backend/internal/adminpanel/db/postgres"
	//"backend/internal/adminpanel/repository"
	//"backend/internal/adminpanel/services/utils"
	//"errors"
	//"fmt"
	"github.com/google/uuid"
	"gorm.io/gorm"
	//"time"
)

//type Items struct {
//	ID           uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
//	Title        string    `gorm:"not null" json:"title"`
//	Content      string    `gorm:"not null" json:"content"`
//	Price        float64   `gorm:"not null" json:"price"`
//	Position     int       `gorm:"not null" json:"position"`
//	Language     string    `gorm:"not null" json:"language"`
//	ItemUrl      string    `gorm:"default:null" json:"item_url"`
//	Category     string    `gorm:"default:null" json:"category"`
//	Status       bool      `gorm:"default:false" json:"status"`
//	PropertiesId uuid.UUID `gorm:"not null;index" json:"property_id"`
//	OwnerID      uuid.UUID `gorm:"not null;index" json:"-"`
//	User         User      `gorm:"foreignKey:OwnerID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"user"`
//	CreatedAt    time.Time
//	UpdatedAt    time.Time
//}

//func (c *Items) BeforeCreate(*gorm.DB) error {
//	c.ID = uuid.New()
//	return nil
//}

type ItemsPost struct {
	ID           uuid.UUID
	Title        string    `json:"title"`
	Content      string    `json:"content"`
	Price        float64   `json:"price"`
	Position     int       `json:"position"`
	Language     string    `json:"language"`
	ItemUrl      string    `json:"item_url"`
	Category     string    `json:"category"`
	Status       bool      `json:"status"`
	PropertiesId uuid.UUID `json:"property_id"`
	OwnerID      uuid.UUID `json:"owner_id"`
}

type ItemGet struct {
	ID           uuid.UUID
	Title        string      `json:"title"`
	Content      string      `json:"content"`
	Price        float64     `json:"price"`
	Position     int         `json:"position"`
	Language     string      `json:"language"`
	ItemUrl      string      `json:"item_url"`
	Category     string      `json:"category"`
	Status       bool        `json:"status"`
	PropertiesId uuid.UUID   `json:"property_id"`
	Property     PropertyGet `json:"property"`
	OwnerID      uuid.UUID   `json:"owner_id"`
	Images       []string    `json:"images"`
}

type ItemUpdate struct {
	Title    string  `json:"title"`
	Content  string  `json:"content"`
	Price    float64 `json:"price"`
	Position int     `json:"position"`
	Language string  `json:"language"`
	ItemUrl  string  `json:"item_url"`
	Category string  `json:"category"`
	Status   bool    `json:"status"`
}

type ItemGetAll struct {
	Data  []*ItemGet
	Count int
}

func CreateItem(i *entities.Items) (*ItemsPost, error) {
	if i.Title == "" {
		return nil, errors.New("the item title cannot be empty")
	}
	err := repository.GetPosition(postgres.DB, i.Position, &entities.Items{})
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	// Якщо позиція існує, зсуваємо всі наступні
	if err == nil {
		if shiftErr := repository.ShiftPositions[entities.Items](postgres.DB, i.Position); shiftErr != nil {
			return nil, shiftErr
		}
	}

	err = repository.CreateEssence(postgres.DB, i)
	if err != nil {
		return nil, err
	}
	return &ItemsPost{
		ID:           i.ID,
		Title:        i.Title,
		Content:      i.Content,
		Price:        i.Price,
		Position:     i.Position,
		Language:     i.Language,
		ItemUrl:      i.ItemUrl,
		Category:     i.Category,
		Status:       i.Status,
		PropertiesId: i.PropertiesId,
		OwnerID:      i.OwnerID,
	}, nil
}

func GetAllItems(userId uuid.UUID, parameters *entities.Parameters) (*ItemGetAll, error) {
	if parameters == nil {
		parameters = &entities.Parameters{}
	}

	// Значення за замовчуванням
	if parameters.Language == "" {
		parameters.Language = "pl"
	}
	if parameters.Skip < 0 {
		parameters.Skip = 0
	}
	if parameters.Limit <= 0 {
		parameters.Limit = 100
	}

	var items []*entities.Items
	var media []*entities.Media

	response := &ItemGetAll{}

	// Формуємо запит
	query := postgres.DB.Where("owner_id = ?", userId)

	// Фільтр за регіоном
	if parameters.Language != "" {
		query = query.Where("language = ?", parameters.Language)
	}

	// Пагінація
	query = query.Order("position ASC").Offset(parameters.Skip).Limit(parameters.Limit)

	// Виконання запиту
	err := query.Find(&items).Error
	if err != nil {
		return nil, err
	}

	// Отримуємо всі медіафайли, пов'язані з товарами
	var itemIDs []uuid.UUID
	for _, item := range items {
		itemIDs = append(itemIDs, item.ID)
	}

	if len(itemIDs) > 0 {
		err = postgres.DB.Where("content_id IN (?)", itemIDs).Find(&media).Error
		if err != nil {
			return nil, err
		}
	}

	// Групуємо медіафайли
	mediaMap := make(map[uuid.UUID][]string)
	for _, m := range media {
		mediaMap[m.ContentId] = append(mediaMap[m.ContentId], m.Url)
	}

	// Отримуємо всі властивості товарів
	propertyMap := make(map[uuid.UUID]PropertyGet)
	for _, item := range items {
		property, err := GetPropertyById(item.PropertiesId)
		if err != nil {
			return nil, err
		}
		if property != nil {
			propertyMap[item.ID] = *property
		}
	}

	// Формуємо відповідь
	for _, item := range items {
		response.Data = append(response.Data, &ItemGet{
			ID:           item.ID,
			Title:        item.Title,
			Content:      item.Content,
			Price:        item.Price,
			Position:     item.Position,
			Language:     item.Language,
			ItemUrl:      item.ItemUrl,
			Category:     item.Category,
			Status:       item.Status,
			PropertiesId: item.PropertiesId,
			Property:     propertyMap[item.ID],
			OwnerID:      item.OwnerID,
			Images:       mediaMap[item.ID],
		})
	}

	response.Count = len(items)
	return response, nil
}
