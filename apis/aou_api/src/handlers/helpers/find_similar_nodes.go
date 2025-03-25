package helpers

import (
	"aou_api/src/models"

	"github.com/neo4j/neo4j-go-driver/v5/neo4j/db"
)

type FindSimilarNodesStruct struct {
	// NodeId is the element ID of the node to find similar nodes for
	// Example: "4:9a8b7c6d-5e4f-3a2b-1c0d-12e34f56a7b8:0"
	NodeId string `json:"nodeId"`

	// Embedding is the vector embedding to use for similarity search
	// Example: [0.1, 0.23, -0.45, 0.67, ...]
	Embedding []float64 `json:"embedding"`

	// Limit is the maximum number of similar nodes to return (optional, defaults to 5)
	Limit int `json:"limit"`
}

// FindSimilarNodesService performs the logic of finding similar nodes.
func FindSimilarNodes(appCtx *models.AppContext, input FindSimilarNodesStruct) ([]db.Record, error) {
	limit := 5
	if input.Limit > 0 {
		limit = input.Limit
	}

	var query string
	var params map[string]any

	if input.NodeId != "" {
		// Search using a reference node ID
		query = `
            MATCH (n) 
            WHERE elementId(n) = $nodeId
            CALL db.index.vector.queryNodes('nodeEmbeddings', $limit, n.embedding)
            YIELD node, score
            WHERE elementId(node) <> $nodeId
            RETURN node.name as name, node.description as description, elementId(node) as id, score
            ORDER BY score DESC
        `
		params = map[string]any{
			"nodeId": input.NodeId,
			"limit":  limit,
		}
	} else {
		// Search using an embedding vector
		query = `
            CALL db.index.vector.queryNodes('nodeEmbeddings', $limit, $embedding)
            YIELD node, score
            RETURN node.name as name, node.description as description, elementId(node) as id, score
            ORDER BY score DESC
        `
		params = map[string]any{
			"embedding": input.Embedding,
			"limit":     limit,
		}
	}

	result, err := appCtx.NEO4J.ExecuteQuery(query, params)
	if err != nil {
		appCtx.LOGGER.Error(err.Error())
		return nil, err
	}

	return result, nil
}
