package handlers

import (
	"net/http"
	"restapi/models"

	"github.com/gin-gonic/gin"
)

func MatchAll(c *gin.Context) {
	appCtx, exists := c.MustGet("appCtx").(*models.AppContext)
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	result, err := appCtx.NEO4J.ExecuteQuery("MATCH (n) RETURN n", map[string]any{})
	if err != nil {
		appCtx.LOGGER.Error(err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, result)
}
