package main

import (
	"context"
	"log"

	"restapi/database"
	"restapi/router"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"go.uber.org/zap"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatalf("Error loading .env file")
	}

	ctx := context.Background()
	logger, _ := zap.NewProduction()
	defer logger.Sync()
	db := database.NewNeo4jDatabase()

	//gin.SetMode(gin.ReleaseMode)
	gin.SetMode(gin.DebugMode)

	r := router.NewRouter(logger, db, &ctx)

	if err := r.Run(":8001"); err != nil {
		log.Fatal(err)
	}
}
