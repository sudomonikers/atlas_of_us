package handlers

import (
	"aou_api/src/handlers/helpers"
	"aou_api/src/models"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type NodeQueryParams struct {
	// Labels is a comma-separated list of node labels to filter by
	// Example: L1,Pursuit
	Labels string `form:"labels"`

	// Properties is a URL encoded comma-separated list of property key-value pairs to filter by
	// Example: "name:Cross-country%20Skiing,description:The%20activity%20of%20cross-country%20skiing%2C%20a%20form%20of%20skiing%20where%20skiers%20move%20over%20relatively%20flat%20terrain."
	Properties string `form:"properties"`
}

// GetNodes retrieves nodes from the graph based on query parameters.
// @Description Retrieves nodes based on labels and properties.
// @ID get-nodes
// @Produce json
// @Param labels query string false "Comma-separated list of labels"
// @Param properties query string false "URL encoded comma-separated list of property key-value pairs"
// @Success 200 {object} map[string]interface{} "Successful operation"
// @Failure 400 {object} map[string]interface{} "Invalid query parameters"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /secure/graph/get-nodes [get]
func GetNodes(c *gin.Context) {
	appCtx, _ := c.MustGet("appCtx").(*models.AppContext)

	var params NodeQueryParams
	if err := c.ShouldBindQuery(&params); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid query parameters"})
		return
	}

	var matchClauses []string

	// Handle labels
	if params.Labels != "" {
		labels := strings.Split(params.Labels, ",")
		for _, label := range labels {
			matchClauses = append(matchClauses, fmt.Sprintf("MATCH (n:`%s`)", strings.TrimSpace(label)))
		}
	} else {
		matchClauses = append(matchClauses, "MATCH (n)")
	}

	// Handle properties
	whereClauses := []string{}
	if params.Properties != "" {
		// URL decode the properties string
		decodedProperties, err := url.QueryUnescape(params.Properties)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid properties encoding"})
			return
		}

		properties := strings.Split(decodedProperties, ",")
		for _, prop := range properties {
			parts := strings.SplitN(prop, ":", 2)
			if len(parts) == 2 {
				key := strings.TrimSpace(parts[0])
				value := strings.TrimSpace(parts[1])
				whereClauses = append(whereClauses, fmt.Sprintf("n.%s = '%s'", key, value))
			}
		}
	}

	var queryString string
	if len(matchClauses) > 0 {
		queryString = strings.Join(matchClauses, "\n")
	}

	if len(whereClauses) > 0 {
		queryString += "\nWHERE " + strings.Join(whereClauses, " AND ")
	}

	queryString += `
        OPTIONAL MATCH (n)-[r]->(m)
        WITH collect(n) AS nodes, collect(r) AS relationships
        UNWIND nodes AS node
        UNWIND relationships AS relationship
        RETURN collect(DISTINCT node) AS nodes, collect(DISTINCT relationship) AS relationships
    `

	result, err := appCtx.NEO4J.ExecuteQuery(queryString, map[string]any{})
	if err != nil {
		appCtx.LOGGER.Error(err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, result)
}

type GetNodeWithRelationshipsByIdParams struct {
	// Element Id of a node
	// Example: "4:7f3adc9f-8a7b-48e6-9c5d-12e34f56a7b8:0"
	Id string `form:"id" binding:"required"`
}

// GetNodeWithRelationshipsById retrieves nodes from the graph based on query parameters.
// @Description Get a node from the graph by id and also retrieves its relationships
// @ID get-node-with-relationships-by-id
// @Produce json
// @Param id query string true "Node element ID"
// @Success 200 {object} map[string]interface{} "Successful operation"
// @Failure 400 {object} map[string]interface{} "Invalid query parameters"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /secure/graph/get-node-with-relationships-by-id [get]
func GetNodeWithRelationshipsById(c *gin.Context) {
	appCtx, _ := c.MustGet("appCtx").(*models.AppContext)

	var params GetNodeWithRelationshipsByIdParams
	if err := c.ShouldBindQuery(&params); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid query parameters"})
		return
	}

	queryString := `
        MATCH (n)
        WHERE elementId(n) = $id
        OPTIONAL MATCH (n)-[r]->(m)
        WITH n, collect(r) AS relationships, collect(m) AS affiliatedNodes
        RETURN 
            {
                elementId: elementId(n),
                labels: labels(n),
                name: n.name,
				image: n.image,
                description: n.description
            } AS n, 
			CASE size(relationships)
				WHEN 0 THEN []
				ELSE [relationship IN relationships |
					{
						id: elementId(relationship),
						startElementId: elementId(startNode(relationship)),
						endElementId: elementId(endNode(relationship)),
						type: type(relationship),
						props: properties(relationship)
					}
				]
            END AS relationships, 
            CASE size(affiliatedNodes)
                WHEN 0 THEN []
                ELSE [node IN affiliatedNodes | 
                    {
                        elementId: elementId(node),
                        labels: labels(node),
                        name: node.name,
                        description: node.description
                    }
				]
            END AS affiliatedNodes
    `

	result, err := appCtx.NEO4J.ExecuteQuery(queryString, map[string]any{"id": params.Id})
	if err != nil {
		appCtx.LOGGER.Error(err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, result)
}

type GetNodeWithRelationshipsBySearchTermParams struct {
	// Example: "Programming"
	searchTerm string `form:"searchTerm" binding:"required"`
}

// GetNodeWithRelationshipsById retrieves nodes from the graph based on query parameters.
// @Description Get a node from the graph by id and also retrieves its relationships
// @ID get-node-with-relationships-by-search-term
// @Produce json
// @Param search-term query string true "Search Term"
// @Success 200 {object} map[string]interface{} "Successful operation"
// @Failure 400 {object} map[string]interface{} "Invalid query parameters"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /secure/graph/get-node-with-relationships-by-search-term [get]
func GetNodeWithRelationshipsBySearchTerm(c *gin.Context) {
	appCtx, _ := c.MustGet("appCtx").(*models.AppContext)

	var params GetNodeWithRelationshipsBySearchTermParams
	if err := c.ShouldBindQuery(&params); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid query parameters"})
		return
	}

	embedding, err := helpers.GenerateEmbedding(appCtx, params.searchTerm)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate embedding"})
		return
	}

	queryString := `
		CALL db.index.vector.queryNodes('nodeEmbeddings', 1, $embedding)
		YIELD node, score

        OPTIONAL MATCH (node)-[r]->(m)
        WITH node, score, collect(r) AS relationships, collect(m) AS affiliatedNodes
        RETURN 
            {
                elementId: elementId(node),
                labels: labels(node),
                name: node.name,
				image: node.image,
                description: node.description,
				similarity: score
            } AS n, 
			CASE size(relationships)
				WHEN 0 THEN []
				ELSE [relationship IN relationships |
					{
						id: elementId(relationship),
						startElementId: elementId(startNode(relationship)),
						endElementId: elementId(endNode(relationship)),
						type: type(relationship),
						props: properties(relationship)
					}
				]
            END AS relationships, 
            CASE size(affiliatedNodes)
                WHEN 0 THEN []
                ELSE [node IN affiliatedNodes | 
                    {
                        elementId: elementId(node),
                        labels: labels(node),
                        name: node.name,
                        description: node.description
                    }
				]
            END AS affiliatedNodes
    `

	result, err := appCtx.NEO4J.ExecuteQuery(queryString, map[string]any{"embedding": embedding})
	if err != nil {
		appCtx.LOGGER.Error(err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, result)
}

type CreateNodeRequest struct {
	// Labels is an array of labels to assign to the new node
	// Example: ["L1", "Pursuit"]
	Labels []string `json:"labels" binding:"required"`

	// Properties is a map of property key-value pairs for the new node
	// Example: {"name": "Cross Country Skiing", "description": "The activity of cross-country skiing, a form of skiing where skiers move over relatively flat terrain."}
	Properties map[string]any `json:"properties" binding:"required"`
}

// CreateNode creates a new node in the graph.
// @Description Creates a new node with the given labels and properties.
// @ID create-node
// @Accept json
// @Produce json
// @Param request body CreateNodeRequest true "Request body for creating a node"
// @Success 201 {object} map[string]interface{} "Successful operation"
// @Failure 400 {object} map[string]interface{} "Invalid request body"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /secure/graph/create-node [post]
func CreateNode(c *gin.Context) {
	appCtx, _ := c.MustGet("appCtx").(*models.AppContext)

	var requestBody CreateNodeRequest
	if err := c.ShouldBindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid request body",
			"details": "Expected JSON with 'labels' array and 'properties' object",
		})
		return
	}

	//generate a vector embedding
	textToEmbed := requestBody.Properties["name"].(string) + ": " + requestBody.Properties["description"].(string)
	embedding, err := helpers.GenerateEmbedding(appCtx, textToEmbed)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate embedding"})
		return
	}

	//check if a similar node already exists
	similarityResult, err := helpers.FindSimilarNodes(appCtx, helpers.FindSimilarNodesStruct{Embedding: embedding})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to find similar nodes"})
		return
	}
	if len(similarityResult) > 0 {
		record := similarityResult[0]           // Assuming the first result is the most similar
		score, ok := record.Values[3].(float64) // Assuming score is the 4th value and is a float64
		if ok && score > 0.7 {
			c.JSON(http.StatusConflict, gin.H{
				"error":   "similar node already exists",
				"details": fmt.Sprintf("A node with a similarity score of %f already exists.", score),
			})
			return
		}
	}

	//generate a mascot image
	image_prompt := fmt.Sprintf("A minimalistic black-and-white line drawing of '%s'. The sketch is drawn with elegant, simple outlines, with no shading or extra details. The style is similar to high-fashion sketches, emphasizing grace.", textToEmbed)
	image, err := helpers.GenerateImage(appCtx, image_prompt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate image"})
		return
	}

	//upload the image to s3
	now := time.Now()
	timestamp := now.Format(time.DateTime)
	image_name := fmt.Sprintf("%s_%s.png", requestBody.Properties["name"], timestamp) //upload image to s3
	uploadParams := helpers.UploadParams{
		Bucket: os.Getenv("S3_BUCKET"),
		Key:    image_name,
	}
	err = helpers.UploadObjectToS3(uploadParams, image)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to upload image to S3", "err": err})
		return
	}

	// give the node relevant properties
	requestBody.Properties["embedding"] = embedding
	requestBody.Properties["image"] = image_name

	labelString := ":" + strings.Join(requestBody.Labels, ":")
	queryString := fmt.Sprintf("CREATE (n%s $properties) RETURN n", labelString)

	result, err := appCtx.NEO4J.ExecuteQuery(queryString, map[string]any{
		"properties": requestBody.Properties,
	})
	if err != nil {
		appCtx.LOGGER.Error(err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusCreated, result)
}

type CreateRelationshipRequest struct {
	// SourceId is the element ID of the source node
	// Example: "4:7f3adc9f-8a7b-48e6-9c5d-12e34f56a7b8:0"
	SourceId string `json:"sourceId" binding:"required"`

	// TargetId is the element ID of the target node
	// Example: "4:9a8b7c6d-5e4f-3a2b-1c0d-12e34f56a7b8:0"
	TargetId string `json:"targetId" binding:"required"`

	// Type is the relationship type to create
	// Example: "RELATES_TO"
	Type string `json:"type" binding:"required"`

	// Properties is an optional map of property key-value pairs for the relationship
	// Example: {"fromDate": "2023-01-15", "strength": 0.85}
	Properties map[string]any `json:"properties"`
}

// CreateRelationship creates a new relationship between two nodes in the graph.
// @Description Creates a new relationship of the given type between two nodes identified by their element IDs.
// @ID create-relationship
// @Accept json
// @Produce json
// @Param request body CreateRelationshipRequest true "Request body for creating a relationship"
// @Success 201 {object} map[string]interface{} "Successful operation"
// @Failure 400 {object} map[string]interface{} "Invalid request body"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /secure/graph/create-relationship [post]
func CreateRelationship(c *gin.Context) {
	appCtx, _ := c.MustGet("appCtx").(*models.AppContext)

	var requestBody CreateRelationshipRequest
	if err := c.ShouldBindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid request body",
			"details": "Expected JSON with 'sourceId', 'targetId', 'type', and optional 'properties'",
		})
		return
	}

	queryString := `
        MATCH (source), (target)
        WHERE elementId(source) = $sourceId AND elementId(target) = $targetId
        CREATE (source)-[r:%s $properties]->(target)
        RETURN r
    `
	queryString = fmt.Sprintf(queryString, requestBody.Type)

	result, err := appCtx.NEO4J.ExecuteQuery(queryString, map[string]any{
		"sourceId":   requestBody.SourceId,
		"targetId":   requestBody.TargetId,
		"properties": requestBody.Properties,
	})

	if err != nil {
		appCtx.LOGGER.Error(err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusCreated, result)
}

type UpdateNodeRequest struct {
	// TargetId is the element ID of the target node
	// Example: "4:9a8b7c6d-5e4f-3a2b-1c0d-12e34f56a7b8:0"
	TargetId string `json:"targetId" binding:"required"`

	// Labels is an array of labels to set on the node
	// Example: ["L1", "Pursuit"]
	Labels []string `json:"labels"`

	// Properties is a map of property key-value pairs to update on the node
	// Example: {"name": "Cross Country Skiing", "description": "The activity of cross-country skiing, a form of skiing where skiers move over relatively flat terrain."}
	Properties map[string]any `json:"properties"`
}

// UpdateNode updates an existing node in the graph.
// @Description Updates the labels and/or properties of an existing node identified by its element ID.
// @ID update-node
// @Accept json
// @Produce json
// @Param request body UpdateNodeRequest true "Request body for updating a node"
// @Success 200 {object} map[string]interface{} "Successful operation"
// @Failure 400 {object} map[string]interface{} "Invalid request body"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /secure/graph/update-node [put]
func UpdateNode(c *gin.Context) {
	appCtx, _ := c.MustGet("appCtx").(*models.AppContext)

	var requestBody UpdateNodeRequest
	if err := c.ShouldBindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid request body",
			"details": "Expected JSON with 'targetId' and either 'labels' or 'properties'",
		})
		return
	}

	// Validate that at least labels or properties is provided
	if len(requestBody.Labels) == 0 && len(requestBody.Properties) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid request body",
			"details": "At least one of 'labels' or 'properties' must be provided",
		})
		return
	}

	queryParts := []string{
		"MATCH (n)",
		"WHERE elementId(n) = $targetId",
	}

	// Handle labels if provided
	if len(requestBody.Labels) > 0 {
		// Remove all existing labels and set new ones
		queryParts = append(queryParts, "REMOVE n:"+strings.Join([]string{"_"}, ":"))
		for _, label := range requestBody.Labels {
			queryParts = append(queryParts, fmt.Sprintf("SET n:`%s`", label))
		}
	}

	// Handle properties if provided
	if len(requestBody.Properties) > 0 {
		queryParts = append(queryParts, "SET n += $properties")
	}

	queryParts = append(queryParts, "RETURN n")
	queryString := strings.Join(queryParts, "\n")

	result, err := appCtx.NEO4J.ExecuteQuery(queryString, map[string]any{
		"targetId":   requestBody.TargetId,
		"properties": requestBody.Properties,
	})

	if err != nil {
		appCtx.LOGGER.Error(err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, result)
}

type UpdateRelationshipRequest struct {
	// TargetId is the element ID of the target relationship
	// Example: "5:9a8b7c6d-5e4f-3a2b-1c0d-12e34f56a7b8:0"
	TargetId string `json:"targetId" binding:"required"`

	// Type is the relationship type to update
	// Example: "RELATES_TO"
	Type string `json:"type" binding:"required"`

	// Properties is an optional map of property key-value pairs for the relationship
	// Example: {"fromDate": "2023-01-15", "strength": 0.85}
	Properties map[string]any `json:"properties"`
}

// UpdateRelationship updates an existing relationship in the graph.
// @Description Updates the properties of an existing relationship identified by its element ID.  If the relationship type is provided, the existing relationship is deleted and a new one is created with the new type.
// @ID update-relationship
// @Accept json
// @Produce json
// @Param request body UpdateRelationshipRequest true "Request body for updating a relationship"
// @Success 200 {object} map[string]interface{} "Successful operation"
// @Failure 400 {object} map[string]interface{} "Invalid request body"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /secure/graph/update-relationship [put]
func UpdateRelationship(c *gin.Context) {
	appCtx, _ := c.MustGet("appCtx").(*models.AppContext)

	var requestBody UpdateRelationshipRequest
	if err := c.ShouldBindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid request body",
			"details": "Expected JSON with 'targetId', 'type', and optional 'properties'",
		})
		return
	}

	queryString := `
        MATCH ()-[r]->()
        WHERE elementId(r) = $targetId
        SET r = $properties
    `

	// If type needs to be updated, we need to create a new relationship and delete the old one
	// since Neo4j doesn't support changing relationship types
	if requestBody.Type != "" {
		queryString = `
            MATCH (source)-[r]->(target)
            WHERE elementId(r) = $targetId
            CREATE (source)-[newR:%s $properties]->(target)
            DELETE r
            RETURN newR AS r
        `
		queryString = fmt.Sprintf(queryString, requestBody.Type)
	} else {
		queryString += `
            RETURN r
        `
	}

	// Execute query
	result, err := appCtx.NEO4J.ExecuteQuery(queryString, map[string]any{
		"targetId":   requestBody.TargetId,
		"properties": requestBody.Properties,
	})

	if err != nil {
		appCtx.LOGGER.Error(err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, result)
}

// GetSimilarNodes finds nodes similar to a given node or embedding.
// @Description Gets nodes similar to a node specified by its element ID or by a vector embedding.
// @ID find-similar-nodes
// @Accept json
// @Produce json
// @Param request body FindSimilarNodesRequest true "Request body for finding similar nodes"
// @Success 200 {object} map[string]interface{} "Successful operation"
// @Failure 400 {object} map[string]interface{} "Invalid request body"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /secure/graph/similar-nodes [post]
func GetSimilarNodes(c *gin.Context) {
	appCtx, _ := c.MustGet("appCtx").(*models.AppContext)

	var requestBody helpers.FindSimilarNodesStruct
	if err := c.ShouldBindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid request body",
			"details": "Expected JSON with either 'nodeId' or 'embedding'",
		})
		return
	}

	// Validate that exactly one of nodeId or embedding is provided
	if (requestBody.NodeId == "" && len(requestBody.Embedding) == 0) || (requestBody.NodeId != "" && len(requestBody.Embedding) > 0) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid request body",
			"details": "Exactly one of 'nodeId' or 'embedding' must be provided",
		})
		return
	}

	result, err := helpers.FindSimilarNodes(appCtx, requestBody)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, result)
}
