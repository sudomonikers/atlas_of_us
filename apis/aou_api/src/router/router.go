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
	handlers "aou_api/src/handlers/graph"
	helpers "aou_api/src/handlers/helpers"

	"aou_api/src/handlers/graph/health_handlers"
	"aou_api/src/handlers/graph/intrinsic_handlers"
	"aou_api/src/handlers/graph/knowledge_bases_handlers"
	"aou_api/src/handlers/graph/personality_handlers"
	"aou_api/src/handlers/graph/pursuits_handlers"
	"aou_api/src/handlers/graph/skill_handlers"
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
		helper := secureRoutes.Group("helper")
		{
			helper.GET("s3-object", helpers.GetS3Object)
		}

		graph_management := secureRoutes.Group("graph")
		{
			graph_management.POST("evaluate", handlers.GraphManagement)
		}

		pursuits := secureRoutes.Group(("pursuits"))
		{
			pursuits.GET("all-pursuits", pursuits_handlers.GetAllPursuitsNodes)
		}

		skills := secureRoutes.Group(("skills"))
		{
			skills.GET("all-skills", skill_handlers.GetAllSkillsNodes)
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
