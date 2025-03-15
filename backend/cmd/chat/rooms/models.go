package rooms

import (
	"backend/internal/adminpanel/db/postgres"
	"backend/internal/adminpanel/entities"
	"backend/internal/adminpanel/repository"
	"errors"
	"github.com/google/uuid"
)

type RoomPublic struct {
	ID          uuid.UUID
	NameRoom    string    `json:"name_room"`
	Description string    `json:"description"`
	Image       string    `json:"image"`
	OwnerId     uuid.UUID `json:"owner_id"`
}

type BlogUpdate struct {
	NameRoom    string `json:"name_room"`
	Description string `json:"description"`
	Image       int    `json:"image"`
}

type RoomGetAll struct {
	Data  []*RoomPublic
	Count int
}

func CreateRoom(room *entities.ChatRooms) (*RoomPublic, error) {
	if room.NameRoom == "" {
		return nil, errors.New("the item title cannot be empty")
	}
	if room.Image == "" {
		return nil, errors.New("the image cannot be empty")
	}

	err := repository.CreateEssence(postgres.DB, room)
	if err != nil {
		return nil, err
	}
	return &RoomPublic{
		ID:          room.ID,
		NameRoom:    room.NameRoom,
		Description: room.Description,
		Image:       room.Image,
		OwnerId:     room.OwnerId,
	}, nil
}

func GetAllRooms(userId uuid.UUID) (*RoomGetAll, error) {
	var rooms []*entities.ChatRooms
	response := &RoomGetAll{}

	// Отримуємо всі блоги автора
	err := postgres.DB.Where("owner_id = ?", userId).Find(&rooms).Error
	if err != nil {
		return nil, err
	}

	for _, room := range rooms {
		response.Data = append(response.Data, &RoomPublic{
			ID:          room.ID,
			NameRoom:    room.NameRoom,
			Description: room.Description,
			Image:       room.Image,
			OwnerId:     room.OwnerId,
		})
	}

	response.Count = len(rooms)
	return response, nil
}

//
//func GetBlogById(id uuid.UUID) (*BlogGet, error) {
//	var blog entities.Blog
//	var media []*entities.Media
//
//	err := repository.GetByID(postgres.DB, id, &blog)
//	if err != nil {
//		return nil, err
//	}
//
//	err = repository.GetAllMediaByID(postgres.DB, id, &media)
//	if err != nil {
//		return nil, err
//	}
//
//	mediaMap := make(map[uuid.UUID][]string)
//	for _, m := range media {
//		mediaMap[m.ContentId] = append(mediaMap[m.ContentId], m.Url)
//	}
//
//	return &BlogGet{
//		ID:       blog.ID,
//		Title:    blog.Title,
//		Content:  blog.Content,
//		Position: blog.Position,
//		Status:   blog.Status,
//		AuthorID: blog.AuthorID,
//		Images:   mediaMap[blog.ID],
//	}, nil
//}
//
//func UpdateBlogById(id uuid.UUID, updateBlog *BlogUpdate) (*BlogGet, error) {
//	var blog entities.Blog
//
//	// Знаходимо блог за ID
//	err := repository.GetByID(postgres.DB, id, &blog)
//	if err != nil {
//		return nil, err
//	}
//
//	// Якщо позиція змінилася - зсуваємо інші блоги
//	if updateBlog.Position != blog.Position {
//		err = repository.ShiftPositions[entities.Blog](postgres.DB, updateBlog.Position, blog.Language) // Передаємо тільки число
//		if err != nil {
//			return nil, err
//		}
//		blog.Position = updateBlog.Position
//	}
//
//	// Оновлюємо поля блогу
//	if updateBlog.Title != "" {
//		blog.Title = updateBlog.Title
//	}
//	if updateBlog.Content != "" {
//		blog.Content = updateBlog.Content
//	}
//
//	blog.Status = updateBlog.Status
//
//	// Зберігаємо оновлений блог
//	err = postgres.DB.Save(&blog).Error
//	if err != nil {
//		return nil, err
//	}
//
//	// Повертаємо оновлені дані блогу
//	return GetBlogById(id)
//}
//
//func DeleteBlogById(id uuid.UUID) error {
//	var blog entities.Blog
//	var mediaList []entities.Media
//
//	err := repository.DeleteByID(postgres.DB, id, &blog)
//	if err != nil {
//		return err
//	}
//
//	err = repository.GetAllMediaByID(postgres.DB, id, &mediaList)
//	if err != nil {
//		return err
//	}
//	for _, media := range mediaList {
//		fileName := utils.ExtractFileNameFromURL(media.Url)
//		fmt.Println("Deleted file:", fileName)
//		err = utils.DeleteFile(fileName)
//		if err != nil {
//			return err
//		}
//	}
//
//	err = repository.DeleteContentByID(postgres.DB, id, &entities.Media{})
//	if err != nil {
//		return err
//	}
//
//	return nil
//}
