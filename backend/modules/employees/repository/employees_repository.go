package repository

import (
	"backend/internal/repository"
	employees "backend/modules/employees/models"
	users "backend/modules/user/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func GetUserEmployeesById(db *gorm.DB, id uuid.UUID) (*employees.UserResponseEmployees, error) {
	var user users.User
	var employee employees.Employees

	err := repository.GetByID(db, id, &user)
	if err != nil {
		return nil, err
	}

	err = repository.GetByUserID(db, id, &employee)
	if err != nil {
		return nil, err
	}

	// Формуємо відповідь
	UserResponseEmployees := &employees.UserResponseEmployees{
		ID:                user.ID,
		FullName:          user.FullName,
		Avatar:            user.Avatar,
		Email:             user.Email,
		IsActive:          user.IsActive,
		IsSuperUser:       user.IsSuperUser,
		IsAdmin:           user.IsAdmin,
		CreatedAt:         user.CreatedAt,
		UpdatedAt:         user.UpdatedAt,
		PhoneNumber1:      employee.PhoneNumber1,
		PhoneNumber2:      employee.PhoneNumber2,
		Company:           employee.Company,
		Position:          employee.Position,
		ConditionType:     employee.ConditionType,
		Salary:            employee.Salary,
		Address:           employee.Address,
		DateStart:         employee.DateStart,
		DateEnd:           employee.DateEnd,
		ExtraData:         employee.ExtraData,
		WhuCreatedByID:    employee.WhuCreatedByID,
		WhuCreatedByAcron: employee.WhuCreatedByAcron,
		WhuUpdatedByID:    employee.WhuUpdatedByID,
		WhuUpdatedByAcron: employee.WhuUpdatedByAcron,
	}
	return UserResponseEmployees, nil
}

func UpdateUserEmployeesById(db *gorm.DB, id, superUserId uuid.UUID, updateEmployee *employees.UpdateUserEmployees) (*employees.UserResponseEmployees, error) {
	var user users.User
	var emp employees.Employees

	// Отримуємо дані з обох таблиць
	if err := repository.GetByID(db, id, &user); err != nil {
		return nil, err
	}
	if err := repository.GetByUserID(db, id, &emp); err != nil {
		return nil, err
	}

	// Оновлюємо поля User
	if updateEmployee.FullName != nil {
		user.FullName = *updateEmployee.FullName
	}
	if updateEmployee.Email != nil {
		user.Email = *updateEmployee.Email
	}
	if updateEmployee.Avatar != nil {
		user.Avatar = *updateEmployee.Avatar
	}
	if err := db.Save(&user).Error; err != nil {
		return nil, err
	}

	// Оновлюємо поля Employees
	if updateEmployee.PhoneNumber1 != nil {
		emp.PhoneNumber1 = *updateEmployee.PhoneNumber1
	}
	if updateEmployee.PhoneNumber2 != nil {
		emp.PhoneNumber2 = *updateEmployee.PhoneNumber2
	}
	if updateEmployee.Company != nil {
		emp.Company = *updateEmployee.Company
	}
	if updateEmployee.Position != nil {
		emp.Position = *updateEmployee.Position
	}
	if updateEmployee.ConditionType != nil {
		emp.ConditionType = *updateEmployee.ConditionType
	}
	if updateEmployee.Salary != nil {
		emp.Salary = *updateEmployee.Salary
	}
	if updateEmployee.Address != nil {
		emp.Address = *updateEmployee.Address
	}
	if updateEmployee.DateStart != nil {
		emp.DateStart = updateEmployee.DateStart
	}
	if updateEmployee.DateEnd != nil {
		emp.DateEnd = updateEmployee.DateEnd
	}
	if updateEmployee.ExtraData != nil {
		emp.ExtraData = *updateEmployee.ExtraData
	}

	emp.WhuUpdatedByID = &superUserId
	emp.WhuUpdatedByAcron = &user.Acronym

	if err := db.Save(&emp).Error; err != nil {
		return nil, err
	}

	// Формуємо відповідь
	return &employees.UserResponseEmployees{
		ID:                user.ID,
		FullName:          user.FullName,
		Avatar:            user.Avatar,
		Email:             user.Email,
		IsActive:          user.IsActive,
		IsSuperUser:       user.IsSuperUser,
		IsAdmin:           user.IsAdmin,
		CreatedAt:         user.CreatedAt,
		UpdatedAt:         user.UpdatedAt,
		PhoneNumber1:      emp.PhoneNumber1,
		PhoneNumber2:      emp.PhoneNumber2,
		Company:           emp.Company,
		Position:          emp.Position,
		ConditionType:     emp.ConditionType,
		Salary:            emp.Salary,
		Address:           emp.Address,
		DateStart:         emp.DateStart,
		DateEnd:           emp.DateEnd,
		ExtraData:         emp.ExtraData,
		WhuCreatedByID:    emp.WhuCreatedByID,
		WhuCreatedByAcron: emp.WhuCreatedByAcron,
		WhuUpdatedByID:    emp.WhuUpdatedByID,
		WhuUpdatedByAcron: emp.WhuUpdatedByAcron,
	}, nil
}
