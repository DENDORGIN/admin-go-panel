package repository

import (
	"backend/internal/repository"
	"backend/modules/chat/messages/models"
	models2 "backend/modules/chat/rooms/models"
	mediaModel "backend/modules/media/models"
	"backend/modules/media/service"
	"errors"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func CreateRoom(db *gorm.DB, room *models2.ChatRooms) (*models2.RoomPublic, error) {
	if room.NameRoom == "" {
		return nil, errors.New("the product title cannot be empty")
	}
	if room.Image == "" {
		return nil, errors.New("the image cannot be empty")
	}

	err := repository.CreateEssence(db, room)
	if err != nil {
		return nil, err
	}
	return &models2.RoomPublic{
		ID:          room.ID,
		NameRoom:    room.NameRoom,
		Description: room.Description,
		Image:       room.Image,
		Status:      room.Status,
		IsChannel:   room.IsChannel,
		OwnerId:     room.OwnerId,
	}, nil
}

func GetAllRooms(db *gorm.DB) (*models2.RoomGetAll, error) { //userId uuid.UUID
	var rooms []*models2.ChatRooms
	response := &models2.RoomGetAll{}

	// Отримуємо всі кімнати автора
	//err := postgres.DB.Where("owner_id = ?", userId).Find(&messages).Error
	err := db.Find(&rooms).Error
	if err != nil {
		return nil, err
	}

	for _, room := range rooms {
		response.Data = append(response.Data, &models2.RoomPublic{
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

func GetRoomById(db *gorm.DB, roomId uuid.UUID) (*models2.RoomPublic, error) {
	var room models2.ChatRooms

	err := repository.GetByID(db, roomId, &room)
	if err != nil {
		return nil, err
	}

	return &models2.RoomPublic{
		ID:          room.ID,
		NameRoom:    room.NameRoom,
		Description: room.Description,
		Image:       room.Image,
		Status:      room.Status,
		IsChannel:   room.IsChannel,
		OwnerId:     room.OwnerId,
	}, nil
}

func UpdateRoomById(db *gorm.DB, roomId uuid.UUID, updateRoom *models2.RoomUpdate) (*models2.RoomPublic, error) {
	var room models2.ChatRooms

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

	err = db.Save(&room).Error
	if err != nil {
		return nil, err
	}

	// Повертаємо оновлені дані блогу
	return &models2.RoomPublic{
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
	var room models2.ChatRooms
	var messages []models.Messages

	// Знаходимо room за ID
	roomGet, err := GetRoomById(db, roomId)
	if err != nil {
		return err
	}

	err = service.DeleteImageInBucket(roomGet.Image)
	if err != nil {
		return err
	}

	err = repository.GetAllByField(db, "room_id", roomId, &messages)
	if err != nil {
		return err
	}
	for _, message := range messages {
		var tempMedia []mediaModel.Media
		err = repository.GetAllMediaByID(db, message.ID, &tempMedia)
		if err != nil {
			return err
		}

		for _, media := range tempMedia {
			err = service.DeleteImageInBucket(media.Url)
			if err != nil {
				return err
			}
		}

		err = repository.DeleteContentByID(db, message.ID, &mediaModel.Media{})
		if err != nil {
			return err
		}
	}

	err = repository.DeleteByID(db, roomId, &room)
	if err != nil {
		return err
	}

	return nil
}
