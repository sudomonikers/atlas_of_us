package middleware

import (
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func Cors() gin.HandlerFunc {
	return cors.New(cors.Config{
		// AllowOrigins: []string{
		// 	"http://127.0.0.1",
		// 	"http://127.0.0.1:8001",
		// 	"http://localhost",
		// 	"http://localhost:8001"},
		AllowMethods: []string{"*"},
		AllowHeaders: []string{"*"},
		//ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		AllowOriginFunc: func(origin string) bool {
			return strings.HasPrefix(origin, "http://localhost") || strings.HasPrefix(origin, "http://127.0.0.1")
		},
		MaxAge: 12 * time.Hour,
	})
}
