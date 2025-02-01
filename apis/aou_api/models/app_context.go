package models

import (
	"context"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"restapi/database"
)

// AppContext holds shared resources like database
type AppContext struct {
	NEO4J  *database.Neo4jDB
	LOGGER *zap.Logger
	Ctx    *context.Context
}

func NewAppContext(db *database.Neo4jDB, logger *zap.Logger, ctx *context.Context) *AppContext {
	return &AppContext{
		NEO4J:  db,
		LOGGER: logger,
		Ctx:    ctx,
	}
}
func ContextMiddleware(appCtx *AppContext) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Set("appCtx", appCtx)
		c.Next()
	}
}
