package main

import (
	"context"
	"os"

	"aou_api/src/database"
	"aou_api/src/models"
	"aou_api/src/router"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

//go:generate swag init

func main() {
	ctx := context.Background()

	ginMode := os.Getenv("GIN_MODE")
	if ginMode == "" {
		ginMode = gin.ReleaseMode
	}
	gin.SetMode(ginMode)

	var logger *zap.Logger
	var err error

	if ginMode == gin.ReleaseMode {
		logger, err = zap.NewProduction()
	} else {
		logger, err = zap.NewDevelopment()
	}

	if err != nil {
		panic(err)
	}
	defer logger.Sync()

	db := database.NewNeo4jDatabase()

	appCtx := models.NewAppContext(db, logger, &ctx)

	r := router.NewRouter(appCtx)

	r.Run(":8080")
}
