package main

import (
	"context"
	"log"
	"os"

	"aou_api/database"
	"aou_api/router"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"go.uber.org/zap"
)

func main() {
	ctx := context.Background()
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	err := godotenv.Load()
	if err != nil {
		logger.Warn("Warning: .env file not found, relying on environment variables")
	}

	db := database.NewNeo4jDatabase()

	ginMode := os.Getenv("GIN_MODE")
	if ginMode == "" {
		ginMode = gin.DebugMode // Default to DebugMode if not set
	}
	gin.SetMode(ginMode)

	r := router.NewRouter(logger, db, &ctx)

	if err := r.Run(":8001"); err != nil {
		log.Fatal(err)
	}
}
