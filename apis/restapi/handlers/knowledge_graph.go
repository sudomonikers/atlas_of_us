package handlers

import (
	"fmt"
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

func MatchDomain(c *gin.Context) {
	appCtx, exists := c.MustGet("appCtx").(*models.AppContext)
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	result, err := appCtx.NEO4J.ExecuteQuery(`
		MATCH (n:L1Domain {name: $domainName}) 
		OPTIONAL MATCH (n)-[r]->(m)
		RETURN 
			id(n) as Id, 
			labels(n) as Labels, 
			properties(n) as Props, 
			collect(r) as relationships, 
			collect(m) as relatedNodes
	`, map[string]any{"domainName": c.Param("domainName")})

	if err != nil {
		appCtx.LOGGER.Error(err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, result)
}

func MatchDescendants(c *gin.Context) {
	appCtx, exists := c.MustGet("appCtx").(*models.AppContext)
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	result, err := appCtx.NEO4J.ExecuteQuery(fmt.Sprintf(`
		MATCH (n:L1Domain {name: 'Individual Possibilities'})
		OPTIONAL MATCH (n)-[r*0..%s]->(descendant)
		RETURN n, collect(distinct descendant) AS descendants, collect(distinct r) AS relationships
	`, c.Param("numDescendants")), map[string]any{"domainName": c.Param("domainName")})

	if err != nil {
		appCtx.LOGGER.Error(err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, result)
}
