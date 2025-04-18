package utils

import (
	"backend/internal/adminpanel/entities"
	"fmt"
)

type DecryptedTenantCreds struct {
	DBUser     string
	DBName     string
	DBHost     string
	DBPassword string
}

func DecryptTenantCreds(t *entities.Tenant) (*DecryptedTenantCreds, error) {
	user, err := Decrypt(t.DBUser)
	if err != nil {
		return nil, fmt.Errorf("decrypt user: %w", err)
	}
	name, err := Decrypt(t.DBName)
	if err != nil {
		return nil, fmt.Errorf("decrypt db name: %w", err)
	}
	host, err := Decrypt(t.DBHost)
	if err != nil {
		return nil, fmt.Errorf("decrypt db host: %w", err)
	}
	pass, err := Decrypt(t.DBPassword)
	if err != nil {
		return nil, fmt.Errorf("decrypt password: %w", err)
	}

	return &DecryptedTenantCreds{
		DBUser:     user,
		DBName:     name,
		DBHost:     host,
		DBPassword: pass,
	}, nil
}
