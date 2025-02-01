package router

import (
	"context"
	"time"

	"github.com/gin-gonic/gin"
	swaggerfiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"go.uber.org/zap"
	"golang.org/x/time/rate"

	"aou_api/auth"
	"aou_api/database"
	docs "aou_api/docs"
	"aou_api/handlers"
	"aou_api/middleware"
	"aou_api/models"
)

func NewRouter(logger *zap.Logger, db *database.Neo4jDB, ctx *context.Context) *gin.Engine {
	appCtx := models.NewAppContext(db, logger, ctx)

	r := gin.Default()
	r.Use(models.ContextMiddleware(appCtx))
	r.Use(middleware.Logger(logger))

	if gin.Mode() == gin.ReleaseMode {
		r.Use(middleware.Security())
		// r.Use(middleware.Xss())
		r.Use(middleware.Cors())
		r.Use(middleware.RateLimiter(rate.Every(1*time.Minute), 60)) // 60 requests per minute
	}

	docs.SwaggerInfo.BasePath = "/api"
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerfiles.Handler))
	baseRoutes := r.Group("/api")
	{
		baseRoutes.GET("/", auth.Healthcheck)
	}

	knowledge_graph := baseRoutes.Group("graph")
	{
		knowledge_graph.GET("match-all", handlers.MatchAll)
		knowledge_graph.GET("match-domain/:domainName", handlers.MatchDomain)
		knowledge_graph.GET("match-node/:nodeName/:numDescendants", handlers.MatchDescendants)

	}

	return r
}
