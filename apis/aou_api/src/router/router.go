package router

import (
	"context"
	"time"

	"github.com/gin-gonic/gin"
	swaggerfiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"go.uber.org/zap"
	"golang.org/x/time/rate"

	docs "aou_api/docs"
	"aou_api/src/auth"
	"aou_api/src/database"
	"aou_api/src/handlers"
	"aou_api/src/handlers/health_handlers"
	"aou_api/src/handlers/intrinsic_handlers"
	"aou_api/src/handlers/knowledge_bases_handlers"
	"aou_api/src/handlers/personality_handlers"
	"aou_api/src/handlers/pursuits_handlers"
	"aou_api/src/middleware"
	"aou_api/src/models"
)

func NewRouter(logger *zap.Logger, db *database.Neo4jDB, ctx *context.Context) *gin.Engine {
	appCtx := models.NewAppContext(db, logger, ctx)

	r := gin.Default()
	r.Use(models.ContextMiddleware(appCtx))
	r.Use(middleware.Logger(logger))
	r.Use(middleware.Security())
	r.Use(middleware.Cors())
	r.Use(middleware.RateLimiter(rate.Every(1*time.Minute), 60)) // 60 requests per minute

	docs.SwaggerInfo.BasePath = "/api"
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerfiles.Handler))

	baseRoutes := r.Group("/api")
	{
		baseRoutes.GET("/", auth.Healthcheck)
		baseRoutes.POST("sign-up", auth.SignUp)
		baseRoutes.POST("login", auth.Login)
	}

	secureRoutes := baseRoutes.Group("/secure")
	secureRoutes.Use(middleware.JWTAuth())
	{
		knowledge_graph := secureRoutes.Group("graph")
		{
			knowledge_graph.GET("match-all", handlers.MatchAll)
			knowledge_graph.GET("match-domain/:domainName", handlers.MatchDomain)
			knowledge_graph.GET("match-node/:nodeName/:numDescendants", handlers.MatchDescendants)
		}

		pursuits := secureRoutes.Group(("pursuits"))
		{
			pursuits.GET("all-pursuits", pursuits_handlers.GetAllPursuitsNodes)
		}

		personality := secureRoutes.Group(("personality"))
		{
			personality.GET("all-personality", personality_handlers.GetAllPersonalityNodes)
		}

		knowledge_bases := secureRoutes.Group(("knowledge-bases"))
		{
			knowledge_bases.GET("all-knowledge-bases", knowledge_bases_handlers.GetAllKnowledgeBaseNodes)
		}

		intrinsic := secureRoutes.Group(("intrinsic"))
		{
			intrinsic.GET("all-intrinsic", intrinsic_handlers.GetAllIntrinsicNodes)
		}

		health := secureRoutes.Group(("health"))
		{
			health.GET("all-health", health_handlers.GetAllHealthNodes)
		}
	}

	return r
}
