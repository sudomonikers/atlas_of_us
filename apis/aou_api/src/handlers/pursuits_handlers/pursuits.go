package pursuits_handlers

import (
	"aou_api/src/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetAllPursuitsNodes(c *gin.Context) {
	appCtx, exists := c.MustGet("appCtx").(*models.AppContext)
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	result, err := appCtx.NEO4J.ExecuteQuery(`
		MATCH (n)
		OPTIONAL MATCH (n)-[r]->(m)
		RETURN n, collect(r) as relationships
	`, map[string]any{})
	if err != nil {
		appCtx.LOGGER.Error(err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, result)
}
