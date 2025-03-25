package router

import (
	"time"

	"github.com/gin-gonic/gin"
	swaggerfiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"golang.org/x/time/rate"

	"aou_api/src/auth"
	docs "aou_api/src/docs"
	handlers "aou_api/src/handlers/graph"
	helpers "aou_api/src/handlers/helpers"

	"aou_api/src/middleware"
	"aou_api/src/models"
)

func NewRouter(appCtx *models.AppContext) *gin.Engine {
	r := gin.Default()
	r.Use(models.ContextMiddleware(appCtx))
	r.Use(middleware.Logger(appCtx.LOGGER))
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
			helper.GET("s3-object", helpers.ReturnS3Object)
			helper.POST("s3-upload", helpers.UploadS3Object)
		}

		graph_management := secureRoutes.Group("graph")
		{
			graph_management.GET("get-nodes", handlers.GetNodes)
			graph_management.GET("get-node-with-relationships-by-search-term", handlers.GetNodeWithRelationshipsBySearchTerm)

			graph_management.POST("create-node", handlers.CreateNode)
			graph_management.PUT("update-node", handlers.UpdateNode)
			graph_management.POST("create-relationship", handlers.CreateRelationship)
			graph_management.PUT("update-relationship", handlers.UpdateRelationship)
			//The following method is purely a FETCH operation and does not mutate any data, but we are using POST because we may send in a potentially very large vector embedding for finding similarity and there can be issues with that using GET
			graph_management.POST("similar-nodes", handlers.GetSimilarNodes)
		}
	}

	return r
}
