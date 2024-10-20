package router

import (
	"context"
	"restapi/database"
	docs "restapi/docs"
	"restapi/handlers"
	"restapi/middleware"
	"time"

	swaggerfiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"golang.org/x/time/rate"

	"restapi/auth"
	"restapi/models"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func NewRouter(logger *zap.Logger, db *database.Neo4jDB, ctx *context.Context) *gin.Engine {
	appCtx := models.NewAppContext(db, logger, ctx)

	r := gin.Default()
	r.Use(models.ContextMiddleware(appCtx))
	r.Use(middleware.Logger(logger))

	if gin.Mode() == gin.ReleaseMode {
		// r.Use(middleware.Security())
		// r.Use(middleware.Xss())
	}
	r.Use(middleware.Cors())
	r.Use(middleware.RateLimiter(rate.Every(1*time.Minute), 60)) // 60 requests per minute

	docs.SwaggerInfo.BasePath = "/api/v1"
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerfiles.Handler))
	v1 := r.Group("/api/v1")
	{
		v1.GET("/", auth.Healthcheck)
	}

	knowledge_graph := v1.Group("kg")
	{
		knowledge_graph.GET("match-all", handlers.MatchAll)
		knowledge_graph.GET("match-domain/:domainName", handlers.MatchDomain)
		knowledge_graph.GET("match-domain/:domainName/:numDescendants", handlers.MatchDescendants)

	}

	return r
}
