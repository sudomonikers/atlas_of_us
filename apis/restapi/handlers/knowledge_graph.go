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
        MATCH (n:`+c.Param("domainName")+`)
		OPTIONAL MATCH (n)-[r]->(m)
		RETURN n, collect(r)
	`, map[string]any{})

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
		MATCH (n:L1Domain {name: "%s"})
		OPTIONAL MATCH (n)-[r:HAS_SUBDOMAIN|HAS_ATTRIBUTE*0..%s]->(descendant)
		WITH n, r, descendant
		UNWIND r AS rel
		WITH n, collect(distinct rel) AS relationships, collect(distinct descendant) AS children
		RETURN n AS node, relationships, children
	`, c.Param("nodeName"), c.Param("numDescendants")), map[string]any{})

	if err != nil {
		appCtx.LOGGER.Error(err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, result)
}

func MatchAncestors(c *gin.Context) {
	appCtx, exists := c.MustGet("appCtx").(*models.AppContext)
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	result, err := appCtx.NEO4J.ExecuteQuery(fmt.Sprintf(`
        MATCH (n:`+c.Param("domainName")+`)
		OPTIONAL MATCH (ancestor)-[r*0..%s]->(n)
		WHERE ancestor <> n
		RETURN n, collect(distinct r), collect(distinct ancestor)
	`, c.Param("numDescendants")), map[string]any{})

	if err != nil {
		appCtx.LOGGER.Error(err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, result)
}

func MatchFullAncestry(c *gin.Context) {
	appCtx, exists := c.MustGet("appCtx").(*models.AppContext)
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	result, err := appCtx.NEO4J.ExecuteQuery(`
		MATCH (start {name: $startNode}), (end {name: $endNode})
		MATCH path = shortestPath((start)-[*]-(end))
		RETURN path
	`, map[string]any{"startNode": c.Param("startNode"), "endNode": c.Param("endNode")})

	if err != nil {
		appCtx.LOGGER.Error(err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, result)
}

func MatchSurroundingNodes(c *gin.Context) {
	appCtx, exists := c.MustGet("appCtx").(*models.AppContext)
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	result, err := appCtx.NEO4J.ExecuteQuery(`
		MATCH (n:Personality {name: 'Personality'})
		OPTIONAL MATCH (n)-[r1*0..2]-(related)
		RETURN n, collect(distinct r1), collect(distinct related)
	`, map[string]any{"startNode": c.Param("startNode"), "endNode": c.Param("endNode")})

	if err != nil {
		appCtx.LOGGER.Error(err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, result)
}
