package models

import (
	"backend/internal/adminpanel/entities"
	"backend/internal/adminpanel/repository"
	"backend/internal/adminpanel/services/utils"
	"errors"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ItemsPost struct {
	ID       uuid.UUID
	Title    string    `json:"title"`
	Content  string    `json:"content"`
	Price    float64   `json:"price"`
	Quantity int       `json:"quantity"`
	Position int       `json:"position"`
	Language string    `json:"language"`
	ItemUrl  string    `json:"item_url"`
	Category string    `json:"category"`
	Status   bool      `json:"status"`
	OwnerID  uuid.UUID `json:"owner_id"`
}

type ItemGet struct {
	ID       uuid.UUID
	Title    string      `json:"title"`
	Content  string      `json:"content"`
	Price    float64     `json:"price"`
	Quantity int         `json:"quantity"`
	Position int         `json:"position"`
	Language string      `json:"language"`
	ItemUrl  string      `json:"item_url"`
	Category string      `json:"category"`
	Status   bool        `json:"status"`
	Property PropertyGet `json:"property"`
	OwnerID  uuid.UUID   `json:"owner_id"`
	Images   []string    `json:"images"`
}

type ItemUpdate struct {
	Title    *string  `json:"title"`
	Content  *string  `json:"content"`
	Price    *float64 `json:"price"`
	Quantity *int     `json:"quantity"`
	Position *int     `json:"position"`
	ItemUrl  *string  `json:"item_url"`
	Category *string  `json:"category"`
	Status   *bool    `json:"status"`
}

type ItemGetAll struct {
	Data  []*ItemGet
	Count int
}

func CreateItem(db *gorm.DB, i *entities.Items) (*ItemsPost, error) {
	if i.Title == "" {
		return nil, errors.New("the product title cannot be empty")
	}
	err := repository.GetPosition(db, i.Position, &entities.Items{})
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	// Якщо позиція існує, зсуваємо всі наступні
	if err == nil {
		if shiftErr := repository.ShiftPositions[entities.Items](db, i.Position, i.Language); shiftErr != nil {
			return nil, shiftErr
		}
	}

	err = repository.CreateEssence(db, i)
	if err != nil {
		return nil, err
	}
	return &ItemsPost{
		ID:       i.ID,
		Title:    i.Title,
		Content:  i.Content,
		Price:    i.Price,
		Position: i.Position,
		Quantity: i.Quantity,
		Language: i.Language,
		ItemUrl:  i.ItemUrl,
		Category: i.Category,
		Status:   i.Status,
		OwnerID:  i.OwnerID,
	}, nil
}

func GetItemById(db *gorm.DB, itemId uuid.UUID) (*ItemGet, error) {
	var item entities.Items
	var property entities.Property
	var media []*entities.Media

	// Get product
	err := repository.GetByID(db, itemId, &item)
	if err != nil {
		return nil, err
	}

	// Get property by product ID
	err = repository.GetAllContentByID(db, itemId, &property)
	if err != nil {
		return nil, err
	}

	//Get Media by product ID
	err = repository.GetAllMediaByID(db, itemId, &media)
	if err != nil {
		return nil, err
	}
	mediaMap := make(map[uuid.UUID][]string)
	for _, m := range media {
		mediaMap[m.ContentId] = append(mediaMap[m.ContentId], m.Url)
	}
	return &ItemGet{
		ID:       item.ID,
		Title:    item.Title,
		Content:  item.Content,
		Price:    item.Price,
		Quantity: item.Quantity,
		Position: item.Position,
		Language: item.Language,
		ItemUrl:  item.ItemUrl,
		Category: item.Category,
		Status:   item.Status,
		Property: PropertyGet{
			ID:        property.ID,
			Height:    property.Height,
			Weight:    property.Weight,
			Width:     property.Width,
			Color:     property.Color,
			Material:  property.Material,
			Brand:     property.Brand,
			Size:      property.Size,
			Motif:     property.Motif,
			Style:     property.Style,
			ContentID: property.ContentId,
		},
		OwnerID: item.OwnerID,
		Images:  mediaMap[item.ID],
	}, nil

}

func UpdateItemById(db *gorm.DB, itemId uuid.UUID, updateItem *ItemUpdate) (*ItemGet, error) {
	var item *entities.Items

	err := repository.GetByID(db, itemId, &item)
	if err != nil {
		return nil, err
	}

	if updateItem.Position != nil && *updateItem.Position != item.Position {
		err = repository.ShiftPositions[entities.Items](db, *updateItem.Position, item.Language)
		if err != nil {
			return nil, err
		}
		item.Position = *updateItem.Position
	}

	if updateItem.Title != nil {
		item.Title = *updateItem.Title
	}
	if updateItem.Content != nil {
		item.Content = *updateItem.Content
	}
	if updateItem.Price != nil {
		item.Price = *updateItem.Price
	}
	if updateItem.Quantity != nil {
		item.Quantity = *updateItem.Quantity
	}
	if updateItem.ItemUrl != nil {
		item.ItemUrl = *updateItem.ItemUrl
	}
	if updateItem.Category != nil {
		item.Category = *updateItem.Category
	}
	if updateItem.Status != nil {
		item.Status = *updateItem.Status
	}

	err = db.Save(&item).Error
	if err != nil {
		return nil, err
	}

	return GetItemById(db, itemId)
}

func DeleteItemById(db *gorm.DB, id uuid.UUID) error {
	var item entities.Items
	var property entities.Property
	var mediaList []entities.Media

	err := repository.DeleteByID(db, id, &item)
	if err != nil {
		return err
	}

	// Delete property by content_id
	err = repository.DeleteContentByID(db, id, &property)
	if err != nil {
		return err
	}

	err = repository.GetAllMediaByID(db, id, &mediaList)
	if err != nil {
		return err
	}
	for _, media := range mediaList {
		err = utils.DeleteImageInBucket(media.Url)
		if err != nil {
			return err
		}
	}
	// Delete media by content_id
	err = repository.DeleteContentByID(db, id, &entities.Media{})
	if err != nil {
		return err
	}

	return nil
}

func GetAllItems(db *gorm.DB, userId uuid.UUID, isSuperUser bool, parameters *entities.Parameters) (*ItemGetAll, error) {
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

	// Формуємо базовий запит
	query := db

	// Якщо не суперюзер, додаємо фільтр за власником
	if !isSuperUser {
		query = query.Where("owner_id = ?", userId)
	}

	// Фільтр за мовою
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

	// Отримуємо медіа
	var itemIDs []uuid.UUID
	for _, item := range items {
		itemIDs = append(itemIDs, item.ID)
	}

	if len(itemIDs) > 0 {
		err = db.Where("content_id IN (?)", itemIDs).Find(&media).Error
		if err != nil {
			return nil, err
		}
	}

	// Групуємо медіафайли
	mediaMap := make(map[uuid.UUID][]string)
	for _, m := range media {
		mediaMap[m.ContentId] = append(mediaMap[m.ContentId], m.Url)
	}

	// Отримуємо властивості
	propertyMap := make(map[uuid.UUID]PropertyGet)
	for _, item := range items {
		property, err := GetPropertyByItemId(db, item.ID)
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
			ID:       item.ID,
			Title:    item.Title,
			Content:  item.Content,
			Price:    item.Price,
			Quantity: item.Quantity,
			Position: item.Position,
			Language: item.Language,
			ItemUrl:  item.ItemUrl,
			Category: item.Category,
			Status:   item.Status,
			Property: propertyMap[item.ID],
			OwnerID:  item.OwnerID,
			Images:   mediaMap[item.ID],
		})
	}

	response.Count = len(items)
	return response, nil
}
