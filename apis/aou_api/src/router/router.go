package router

import (
	"github.com/gin-gonic/gin"
	swaggerfiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	auth "aou_api/src/auth"
	docs "aou_api/src/docs"
	knowledge_graph_handlers "aou_api/src/handlers/graph"
	profile_handlers "aou_api/src/handlers/profile"
	helpers "aou_api/src/helpers"

	middleware "aou_api/src/middleware"
	models "aou_api/src/models"
)

func NewRouter(appCtx *models.AppContext) *gin.Engine {
	r := gin.Default()
	r.Use(models.ContextMiddleware(appCtx))
	r.Use(middleware.Logger(appCtx.LOGGER))
	r.Use(middleware.Cors())

	docs.SwaggerInfo.BasePath = "/api"
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerfiles.Handler))

	baseRoutes := r.Group("/api")
	{
		baseRoutes.GET("/", auth.Healthcheck)
		baseRoutes.POST("/sign-up", auth.SignUp)
		baseRoutes.POST("/login", auth.Login)
	}

	secureRoutes := baseRoutes.Group("/secure")
	secureRoutes.Use(middleware.JWTAuth())
	{
		helper := secureRoutes.Group("/helper")
		{
			helper.GET("/s3-object", helpers.ReturnS3Object)
			helper.POST("/s3-upload", helpers.UploadS3Object)
			helper.POST("/embedding", helpers.CreateEmbeddingFromText)
		}

		graph_management := secureRoutes.Group("/graph")
		{
			graph_management.GET("/get-nodes", knowledge_graph_handlers.GetNodes)
			graph_management.GET("/get-node-with-relationships-by-search-term", knowledge_graph_handlers.GetNodeWithRelationshipsBySearchTerm)

			graph_management.POST("/create-node", knowledge_graph_handlers.CreateNode)
			graph_management.PUT("/update-node", knowledge_graph_handlers.UpdateNode)
			graph_management.POST("/create-relationship", knowledge_graph_handlers.CreateRelationship)
			graph_management.PUT("/update-relationship", knowledge_graph_handlers.UpdateRelationship)
			//The following method is purely a FETCH operation and does not mutate any data, but we are using POST because we may send in a potentially very large vector embedding for finding similarity and there can be issues with that using GET
			graph_management.POST("/similar-nodes", knowledge_graph_handlers.GetSimilarNodes)
		}

		profile := secureRoutes.Group("/profile")
		{
			profile.GET("/user-profile/:username", profile_handlers.GetUserProfile)
		}
	}

	return r
}
