package profile

import (
	"aou_api/src/models"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetUserProfile(c *gin.Context) {
	appCtx, _ := c.MustGet("appCtx").(*models.AppContext)
	username := c.Param("username")

	queryString := `
		MATCH (node:Person)
		WHERE node.username = $username
		OPTIONAL MATCH (node)-[r]->(m)
		UNWIND coalesce(r, [null]) AS unwound_relationships
		UNWIND coalesce(m, [null]) AS unwound_affiliates
		WITH 
			node,
			collect(distinct unwound_relationships) AS relationships, 
			collect(distinct unwound_affiliates) AS affiliatedNodes
		RETURN 
			node,
			[relationship IN relationships |
				{
					id: elementId(relationship),
					startElementId: elementId(startNode(relationship)),
					endElementId: elementId(endNode(relationship)),
					type: type(relationship),
					props: properties(relationship)
				}
			] AS relationships,
			affiliatedNodes
	`

	result, err := appCtx.NEO4J.ExecuteQuery(queryString, map[string]any{"username": username})
	if err != nil {
		fmt.Println("\nERROR AT GetUserProfile:", err.Error(), "\n")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error querying database"})
		return
	}

	fmt.Println(result)

	c.JSON(http.StatusOK, result)
}
