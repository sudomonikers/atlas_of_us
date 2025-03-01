package handlers

import (
	"aou_api/src/models"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GraphManagement(c *gin.Context) {
	appCtx, exists := c.MustGet("appCtx").(*models.AppContext)
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	result, err := appCtx.NEO4J.ExecuteQuery(`
		MATCH (n:L1)
        OPTIONAL MATCH (n)-[r]->(m)
        WITH collect(n) AS nodes, collect(r) AS relationships
        UNWIND nodes AS node
        UNWIND relationships AS relationship
        RETURN collect(DISTINCT node) AS nodes, collect(DISTINCT relationship) AS relationships
	`, map[string]any{})
	if err != nil {
		appCtx.LOGGER.Error(err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}



	fmt.Println(result)
	c.JSON(http.StatusOK, result)
}
