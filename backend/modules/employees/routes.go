package employees

import (
	"backend/modules/employees/handlers"
	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.RouterGroup) {

	userGroup := r.Group("/employees")
	{
		userGroup.GET("/:id", handlers.ReadUserEmployeesById)
		userGroup.PATCH("/:id", handlers.UpdateUserEmployeesByIdHandler)
	}
}
