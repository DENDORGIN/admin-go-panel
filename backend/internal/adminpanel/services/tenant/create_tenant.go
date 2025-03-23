package tenant

import (
	"backend/internal/adminpanel/db/postgres"
	"backend/internal/adminpanel/entities"
	"backend/internal/adminpanel/services/utils"
	"fmt"
	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
	pg "gorm.io/driver/postgres"
	"gorm.io/gorm"
	"os"
)

/*{
"name": "test",
"domain": "test",
"db_host": "89.116.26.218",
"db_port": "5432",
"db_user": "test_user",
"db_password": "SomeStrongPassword123!",
"db_name": "test_db"
}*/

func TenantHandler(ctx *gin.Context) {
	var tenant entities.Tenant
	if err := ctx.ShouldBindJSON(&tenant); err != nil {
		ctx.JSON(400, gin.H{"error": err.Error()})
		return
	}

	adminDB := postgres.DB

	if err := CreateTenant(adminDB, &tenant); err != nil {
		ctx.JSON(500, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(200, gin.H{"message": "Tenant created successfully"})
}

func CreateTenant(adminDB *gorm.DB, tenant *entities.Tenant) error {
	// Крок 1: зберігаємо компанію в adminDB
	if err := adminDB.Create(tenant).Error; err != nil {
		return err
	}

	// Крок 2: Підключаємося через GORM до postgres (без dbname)
	adminDSN := fmt.Sprintf(
		"host=%s port=%s user=postgres password=%s sslmode=disable",
		tenant.DBHost, tenant.DBPort, os.Getenv("POSTGRES_PASSWORD"),
	)

	masterDB, err := gorm.Open(pg.Open(adminDSN), &gorm.Config{})
	if err != nil {
		return fmt.Errorf("cannot connect to admin DB: %w", err)
	}

	// Крок 3: створюємо базу компанії
	if err := masterDB.Exec(fmt.Sprintf(`CREATE DATABASE "%s";`, tenant.DBName)).Error; err != nil {
		return fmt.Errorf("failed to create database: %w", err)
	}

	// Крок 4: створюємо користувача (роль)
	createUser := fmt.Sprintf(`CREATE USER "%s" WITH PASSWORD '%s';`, tenant.DBUser, tenant.DBPassword)
	if err := masterDB.Exec(createUser).Error; err != nil {
		return fmt.Errorf("failed to create db user: %w", err)
	}

	// Крок 5: Підключення до нової бази компанії
	tenantDSN := fmt.Sprintf(
		"host=%s port=%s user=postgres password=%s dbname=%s sslmode=disable",
		tenant.DBHost, tenant.DBPort, os.Getenv("POSTGRES_PASSWORD"), tenant.DBName,
	)

	tenantDB, err := gorm.Open(pg.Open(tenantDSN), &gorm.Config{})
	if err != nil {
		return fmt.Errorf("cannot connect to tenant DB: %w", err)
	}

	// Крок 6: Міграція таблиць
	if err := tenantDB.AutoMigrate(&entities.User{}); err != nil {
		return fmt.Errorf("migration failed: %w", err)
	}

	// Крок 7: Призначення прав
	grants := []string{
		fmt.Sprintf(`GRANT CONNECT ON DATABASE "%s" TO "%s";`, tenant.DBName, tenant.DBUser),
		`GRANT USAGE ON SCHEMA public TO "` + tenant.DBUser + `";`,
		`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO "` + tenant.DBUser + `";`,
		`GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO "` + tenant.DBUser + `";`,
		`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO "` + tenant.DBUser + `";`,
		`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "` + tenant.DBUser + `";`,
	}
	for _, query := range grants {
		if err := tenantDB.Exec(query).Error; err != nil {
			return fmt.Errorf("failed to grant privileges: %w", err)
		}
	}

	// Крок 8: Створюємо користувача-адміна в tenant базі
	hashedPass, _ := utils.HashPassword("Admin123!")
	adminUser := entities.User{
		Email:       "admin@" + tenant.Domain + ".com",
		Password:    hashedPass,
		FullName:    tenant.Name + " Admin",
		IsSuperUser: true,
	}
	if err := tenantDB.Create(&adminUser).Error; err != nil {
		return fmt.Errorf("failed to create admin user: %w", err)
	}

	return nil
}
