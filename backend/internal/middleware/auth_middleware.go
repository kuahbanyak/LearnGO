package middleware

import (
	"strings"

	"mediqueue/pkg/response"
	"mediqueue/pkg/utils"

	"github.com/gin-gonic/gin"
)

const UserContextKey = "currentUser"

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			response.Unauthorized(c, "Authorization header is required")
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			response.Unauthorized(c, "Invalid authorization format. Use 'Bearer <token>'")
			c.Abort()
			return
		}

		claims, err := utils.ValidateToken(parts[1])
		if err != nil {
			response.Unauthorized(c, "Invalid or expired token")
			c.Abort()
			return
		}

		c.Set(UserContextKey, claims)
		c.Next()
	}
}

func GetCurrentUser(c *gin.Context) *utils.JWTClaims {
	claims, exists := c.Get(UserContextKey)
	if !exists {
		return nil
	}
	return claims.(*utils.JWTClaims)
}
