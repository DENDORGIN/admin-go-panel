package repository

//
//import (
//	"backend/internal/adminpanel/db/postgres"
//)
//
//type Entity interface {
//	SetID()          // Метод для встановлення UUID
//	Validate() error // Метод для валідації
//}
//
//func CreateEntity[T Entity, R any](entity T, transform func(T) R) (*R, error) {
//	if err := entity.Validate(); err != nil {
//		return nil, err
//	}
//
//	entity.SetID() // Генерація UUID
//
//	if err := postgres.DB.Create(entity).Error; err != nil {
//		return nil, err
//	}
//
//	result := transform(entity)
//	return &result, nil
//}
