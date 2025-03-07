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

type ItemsPost struct {
	ID       uuid.UUID
	Title    string    `json:"title"`
	Content  string    `json:"content"`
	Price    float64   `json:"price"`
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
		ID:       i.ID,
		Title:    i.Title,
		Content:  i.Content,
		Price:    i.Price,
		Position: i.Position,
		Language: i.Language,
		ItemUrl:  i.ItemUrl,
		Category: i.Category,
		Status:   i.Status,
		OwnerID:  i.OwnerID,
	}, nil
}

func GetItemById(itemId uuid.UUID) (*ItemGet, error) {
	var item entities.Items
	var property entities.Property
	var media []*entities.Media

	// Get item
	err := repository.GetByID(postgres.DB, itemId, &item)
	if err != nil {
		return nil, err
	}

	// Get property by item ID
	err = repository.GetAllContentByID(postgres.DB, itemId, &property)
	if err != nil {
		return nil, err
	}

	//Get Media by item ID
	err = repository.GetAllMediaByID(postgres.DB, itemId, &media)
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

func UpdateItemById(itemId uuid.UUID, updateItem *ItemUpdate) (*ItemGet, error) {
	var item *entities.Items

	err := repository.GetByID(postgres.DB, itemId, &item)
	if err != nil {
		return nil, err
	}

	if updateItem.Position != item.Position {
		err = repository.ShiftPositions[entities.Items](postgres.DB, updateItem.Position)
		if err != nil {
			return nil, err
		}
		item.Position = updateItem.Position
	}
	if updateItem.Title != "" {
		item.Title = updateItem.Title
	}
	if updateItem.Content != "" {
		item.Content = updateItem.Content
	}
	if updateItem.Price != 0 {
		item.Price = updateItem.Price
	}
	if updateItem.Language != "" {
		item.Language = updateItem.Language
	}
	if updateItem.ItemUrl != "" {
		item.ItemUrl = updateItem.ItemUrl
	}
	if updateItem.Category != "" {
		item.Category = updateItem.Category
	}
	if updateItem.Status != false && updateItem.Status != true {
		item.Status = updateItem.Status
	}

	err = postgres.DB.Save(&item).Error
	if err != nil {
		return nil, err
	}

	return GetItemById(itemId)
}

func DeleteItemById(id uuid.UUID) error {
	var item entities.Items
	var property entities.Property
	var mediaList []entities.Media

	err := repository.DeleteByID(postgres.DB, id, &item)
	if err != nil {
		return err
	}

	// Delete property by content_id
	err = repository.DeleteContentByID(postgres.DB, id, &property)
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

	err = repository.DeleteContentByID(postgres.DB, id, &entities.Media{})
	if err != nil {
		return err
	}

	return nil
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
		property, err := GetPropertyByItemId(item.ID)
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
