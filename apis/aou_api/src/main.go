package main

import (
	"context"
	"os"

	"aou_api/src/database"
	"aou_api/src/models"
	"aou_api/src/router"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	ginadapter "github.com/awslabs/aws-lambda-go-api-proxy/gin"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"go.uber.org/zap"
)

//go:generate swag init

var ginLambda *ginadapter.GinLambda

func init() {
	ctx := context.Background()
	godotenv.Load()

	ginMode := os.Getenv("GIN_MODE")
	if ginMode == "" {
		ginMode = gin.ReleaseMode // Default to ReleaseMode if not set so we have best security practices
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
		panic(err) // Handle error properly, maybe log to stderr and exit
	}
	defer logger.Sync()

	db := database.NewNeo4jDatabase()

	appCtx := models.NewAppContext(db, logger, &ctx)

	r := router.NewRouter(appCtx)

	if ginMode == gin.ReleaseMode {
		ginLambda = ginadapter.New(r)
	} else {
		r.Run(":8001")
	}
}

func Handler(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	// If no name is provided in the HTTP request body, throw an error
	return ginLambda.ProxyWithContext(ctx, req)
}

func main() {
	lambda.Start(Handler)
}
