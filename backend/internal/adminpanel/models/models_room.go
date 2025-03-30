package models

import (
	"backend/internal/adminpanel/entities"
	"backend/internal/adminpanel/repository"
	"backend/internal/adminpanel/services/utils"
	"errors"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type RoomPublic struct {
	ID          uuid.UUID
	NameRoom    string    `json:"name_room"`
	Description string    `json:"description"`
	Image       string    `json:"image"`
	Status      bool      `json:"status"`
	IsChannel   bool      `json:"is_channel"`
	OwnerId     uuid.UUID `json:"owner_id"`
}

type RoomUpdate struct {
	NameRoom    string `json:"name_room"`
	Description string `json:"description"`
	Image       string `json:"image"`
	Status      bool   `json:"status"`
}

type RoomGetAll struct {
	Data  []*RoomPublic
	Count int
}

func CreateRoom(db *gorm.DB, room *entities.ChatRooms) (*RoomPublic, error) {
	if room.NameRoom == "" {
		return nil, errors.New("the item title cannot be empty")
	}
	if room.Image == "" {
		return nil, errors.New("the image cannot be empty")
	}

	err := repository.CreateEssence(db, room)
	if err != nil {
		return nil, err
	}
	return &RoomPublic{
		ID:          room.ID,
		NameRoom:    room.NameRoom,
		Description: room.Description,
		Image:       room.Image,
		Status:      room.Status,
		IsChannel:   room.IsChannel,
		OwnerId:     room.OwnerId,
	}, nil
}

func GetAllRooms(db *gorm.DB) (*RoomGetAll, error) { //userId uuid.UUID
	var rooms []*entities.ChatRooms
	response := &RoomGetAll{}

	// Отримуємо всі кімнати автора
	//err := postgres.DB.Where("owner_id = ?", userId).Find(&rooms).Error
	err := db.Find(&rooms).Error
	if err != nil {
		return nil, err
	}

	for _, room := range rooms {
		response.Data = append(response.Data, &RoomPublic{
			ID:          room.ID,
			NameRoom:    room.NameRoom,
			Description: room.Description,
			Image:       room.Image,
			Status:      room.Status,
			IsChannel:   room.IsChannel,
			OwnerId:     room.OwnerId,
		})
	}

	response.Count = len(rooms)
	return response, nil
}

func GetRoomById(db *gorm.DB, roomId uuid.UUID) (*RoomPublic, error) {
	var room entities.ChatRooms

	err := repository.GetByID(db, roomId, &room)
	if err != nil {
		return nil, err
	}

	return &RoomPublic{
		ID:          room.ID,
		NameRoom:    room.NameRoom,
		Description: room.Description,
		Image:       room.Image,
		Status:      room.Status,
		IsChannel:   room.IsChannel,
		OwnerId:     room.OwnerId,
	}, nil
}

func UpdateRoomById(db *gorm.DB, roomId uuid.UUID, updateRoom *RoomUpdate) (*RoomPublic, error) {
	var room entities.ChatRooms

	// Знаходимо room за ID
	err := repository.GetByID(db, roomId, &room)
	if err != nil {
		return nil, err
	}

	// Оновлюємо поля блогу
	if updateRoom.NameRoom != "" {
		room.NameRoom = updateRoom.NameRoom
	}
	if updateRoom.Description != "" {
		room.Description = updateRoom.Description
	}
	if updateRoom.Image != "" {
		room.Image = updateRoom.Image
	}

	room.Status = updateRoom.Status

	// Зберігаємо оновлений блог
	err = db.Save(&room).Error
	if err != nil {
		return nil, err
	}

	// Повертаємо оновлені дані блогу
	return &RoomPublic{
		ID:          room.ID,
		NameRoom:    room.NameRoom,
		Description: room.Description,
		Image:       room.Image,
		Status:      room.Status,
		IsChannel:   room.IsChannel,
		OwnerId:     room.OwnerId,
	}, nil
}

func DeleteRoomById(db *gorm.DB, roomId uuid.UUID) error {
	var room entities.ChatRooms

	// Знаходимо room за ID
	roomGet, err := GetRoomById(db, roomId)
	if err != nil {
		return err
	}

	err = utils.DeleteImageInBucket(roomGet.Image)
	if err != nil {
		return err
	}

	err = repository.DeleteByID(db, roomId, &room)
	if err != nil {
		return err
	}

	return nil
}
