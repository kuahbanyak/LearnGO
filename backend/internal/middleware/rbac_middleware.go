package middleware

import (
	"mediqueue/internal/entity"
	"mediqueue/pkg/response"

	"github.com/gin-gonic/gin"
)

func RequireRole(roles ...entity.Role) gin.HandlerFunc {
	return func(c *gin.Context) {
		claims := GetCurrentUser(c)
		if claims == nil {
			response.Unauthorized(c, "Unauthorized")
			c.Abort()
			return
		}

		userRole := entity.Role(claims.Role)
		for _, role := range roles {
			if userRole == role {
				c.Next()
				return
			}
		}

		response.Forbidden(c, "You don't have permission to access this resource")
		c.Abort()
	}
}
