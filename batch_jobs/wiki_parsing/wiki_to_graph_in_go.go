package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/joho/godotenv"
	"github.com/neo4j/neo4j-go-driver/v5/neo4j"
	"github.com/nlpodyssey/spago/pkg/ml/embeddings/sentence"
	"github.com/valyala/fasthttp"
)

// Configuration constants
const (
	MinConfidenceThreshold = 0.75
	HumanReviewThreshold   = 0.85
)

// CategoryDocumentationPaths maps category names to their documentation file paths
var CategoryDocumentationPaths = map[string]string{
	"Knowledge":   "./node_type_documentation/knowledge.txt",
	"Pursuit":     "./node_type_documentation/pursuit.txt",
	"Health":      "./node_type_documentation/health.txt",
	"Skill":       "./node_type_documentation/skill.txt",
	"Personality": "./node_type_documentation/personality.txt",
	"Intrinsic":   "./node_type_documentation/intrinsic.txt",
}

// Message represents a message in the conversation
type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// ToolFunction represents a function that can be called by the LLM
type ToolFunction struct {
	Name        string          `json:"name"`
	Description string          `json:"description"`
	Parameters  json.RawMessage `json:"parameters"`
}

// Tool represents a tool that can be used by the LLM
type Tool struct {
	Type     string       `json:"type"`
	Function ToolFunction `json:"function"`
}

// ToolCall represents a call to a tool
type ToolCall struct {
	ID       string       `json:"id"`
	Type     string       `json:"type"`
	Function ToolFunction `json:"function"`
}

// AIMessage represents a message from the AI
type AIMessage struct {
	Role       string     `json:"role"`
	Content    string     `json:"content"`
	ToolCalls  []ToolCall `json:"tool_calls,omitempty"`
}

// InferenceRequest represents the request structure for the inference endpoint
type InferenceRequest struct {
	Model    string    `json:"model"`
	Messages []Message `json:"messages"`
	Tools    []Tool    `json:"tools,omitempty"`
}

// InferenceResponse represents the response structure from the inference endpoint
type InferenceResponse struct {
	Choices []struct {
		Message AIMessage `json:"message"`
	} `json:"choices"`
}

// FileContent represents the content of a file from S3
type FileContent struct {
	Title string `json:"title"`
	Text  string `json:"text"`
}

// HandleChoiceArgs represents the arguments for the handleChoice function
type HandleChoiceArgs struct {
	NodeType        string `json:"nodeType"`
	NodeName        string `json:"nodeName"`
	NodeDescription string `json:"nodeDescription"`
	SelectionReason string `json:"selectionReason"`
}

// RefineNodeSubTypesArgs represents the arguments for the refineNodeSubTypes function
type RefineNodeSubTypesArgs struct {
	SubTypesSelected []string `json:"subTypesSelected"`
	SelectionReason  string   `json:"selectionReason"`
}

// SimilarNode represents a node that is similar to another node
type SimilarNode struct {
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Score       float64 `json:"score"`
}

// AtlasOfUsGraphAdmin manages the graph database
type AtlasOfUsGraphAdmin struct {
	driver              neo4j.DriverWithContext
	embeddingModel      *sentence.BERT
	s3Client            *s3.Client
	systemMessage       string
	categoryDocuments   map[string]string
	inferenceEndpoint   string
	embeddingsEndpoint  string
	s3Bucket            string
}

// NewAtlasOfUsGraphAdmin creates a new instance of AtlasOfUsGraphAdmin
func NewAtlasOfUsGraphAdmin() (*AtlasOfUsGraphAdmin, error) {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: Error loading .env file:", err)
	}

	// Neo4j configuration
	uri := getEnv("NEO4J_URI", "neo4j://localhost:7687")
	user := getEnv("NEO4J_USER", "neo4j")
	password := getEnv("NEO4J_PASSWORD", "password")

	// Create Neo4j driver
	authToken := neo4j.BasicAuth(user, password, "")
	driver, err := neo4j.NewDriverWithContext(uri, authToken)
	if err != nil {
		return nil, fmt.Errorf("failed to create Neo4j driver: %w", err)
	}

	// Initialize S3 client
	cfg, err := config.LoadDefaultConfig(context.Background())
	if err != nil {
		return nil, fmt.Errorf("failed to load AWS config: %w", err)
	}
	s3Client := s3.NewFromConfig(cfg)

	// Load system prompt
	systemMessage, err := ioutil.ReadFile("system_prompt.txt")
	if err != nil {
		return nil, fmt.Errorf("failed to read system prompt: %w", err)
	}

	// Load category documentation
	categoryDocuments := make(map[string]string)
	for category, path := range CategoryDocumentationPaths {
		content, err := ioutil.ReadFile(path)
		if err != nil {
			return nil, fmt.Errorf("failed to read category documentation for %s: %w", category, err)
		}
		categoryDocuments[category] = string(content)
	}

	// Initialize embedding model (using a specific implementation)
	embeddingModel, err := sentence.NewBERT("all-mpnet-base-v2")
	if err != nil {
		return nil, fmt.Errorf("failed to initialize embedding model: %w", err)
	}

	// Create and return the admin instance
	return &AtlasOfUsGraphAdmin{
		driver:              driver,
		embeddingModel:      embeddingModel,
		s3Client:            s3Client,
		systemMessage:       string(systemMessage),
		categoryDocuments:   categoryDocuments,
		inferenceEndpoint:   getEnv("INFERENCE_ENDPOINT", ""),
		embeddingsEndpoint:  getEnv("EMBEDDINGS_ENDPOINT", ""),
		s3Bucket:            getEnv("S3_BUCKET", ""),
	}, nil
}

// Close closes the connections
func (a *AtlasOfUsGraphAdmin) Close() {
	if a.driver != nil {
		_ = a.driver.Close(context.Background())
	}
}

// GenerateEmbedding generates an embedding for a text
func (a *AtlasOfUsGraphAdmin) GenerateEmbedding(ctx context.Context, content string) ([]float32, error) {
	// Using local embedding model instead of API
	embedding, err := a.embeddingModel.Encode(content)
	if err != nil {
		return nil, fmt.Errorf("failed to generate embedding: %w", err)
	}
	return embedding, nil
}

// RunInference runs inference on the LLM
func (a *AtlasOfUsGraphAdmin) RunInference(ctx context.Context, message string, tools []Tool, conversationHistory []Message) (AIMessage, []Message, error) {
	// Start with system message
	messages := []Message{
		{
			Role:    "system",
			Content: a.systemMessage,
		},
	}

	// Add conversation history if provided
	if conversationHistory != nil {
		messages = append(messages, conversationHistory...)
	}

	// Add current query
	messages = append(messages, Message{
		Role:    "user",
		Content: message,
	})

	// Create request payload
	payload := InferenceRequest{
		Model:    "Qwen",
		Messages: messages,
		Tools:    tools,
	}

	// Convert payload to JSON
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return AIMessage{}, conversationHistory, fmt.Errorf("failed to marshal request: %w", err)
	}

	// Create HTTP request
	req := fasthttp.AcquireRequest()
	resp := fasthttp.AcquireResponse()
	defer fasthttp.ReleaseRequest(req)
	defer fasthttp.ReleaseResponse(resp)

	req.SetRequestURI(a.inferenceEndpoint)
	req.Header.SetMethod("POST")
	req.Header.SetContentType("application/json")
	req.SetBody(payloadBytes)

	// Send request
	if err := fasthttp.Do(req, resp); err != nil {
		return AIMessage{}, conversationHistory, fmt.Errorf("failed to send request: %w", err)
	}

	// Check response status code
	if resp.StatusCode() != fasthttp.StatusOK {
		return AIMessage{}, conversationHistory, fmt.Errorf("bad response status: %d", resp.StatusCode())
	}

	// Parse response
	var inferenceResp InferenceResponse
	if err := json.Unmarshal(resp.Body(), &inferenceResp); err != nil {
		return AIMessage{}, conversationHistory, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	if len(inferenceResp.Choices) == 0 {
		return AIMessage{}, conversationHistory, fmt.Errorf("no choices in response")
	}

	aiMessage := inferenceResp.Choices[0].Message

	// Update conversation history
	if conversationHistory == nil {
		conversationHistory = []Message{}
	}

	conversationHistory = append(conversationHistory, Message{
		Role:    "user",
		Content: message,
	})

	// Add AI response to history
	if len(aiMessage.ToolCalls) > 0 {
		functionCall := aiMessage.ToolCalls[0].Function
		functionArgs, _ := json.Marshal(functionCall.Parameters)
		conversationHistory = append(conversationHistory, Message{
			Role:    "assistant",
			Content: fmt.Sprintf("Tool call made: %s called with parameters %s", functionCall.Name, string(functionArgs)),
		})
	} else {
		conversationHistory = append(conversationHistory, Message{
			Role:    "assistant",
			Content: aiMessage.Content,
		})
	}

	return aiMessage, conversationHistory, nil
}

// FindSimilarNodes finds nodes similar to the given embedding
func (a *AtlasOfUsGraphAdmin) FindSimilarNodes(ctx context.Context, embedding []float32) ([]SimilarNode, error) {
	session := a.driver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeRead})
	defer session.Close(ctx)

	result, err := session.Run(ctx, 
		"CALL db.index.vector.queryNodes('nodeEmbeddings', 5, $embedding) "+
		"YIELD node, score "+
		"RETURN node.name as name, node.description as description, score",
		map[string]interface{}{"embedding": embedding})
	
	if err != nil {
		return nil, fmt.Errorf("failed to run query: %w", err)
	}

	var similarNodes []SimilarNode
	for result.Next(ctx) {
		record := result.Record()
		score, _ := record.Get("score")
		scoreValue, _ := score.(float64)
		
		if scoreValue > MinConfidenceThreshold {
			name, _ := record.Get("name")
			description, _ := record.Get("description")
			
			similarNodes = append(similarNodes, SimilarNode{
				Name:        name.(string),
				Description: description.(string),
				Score:       scoreValue,
			})
		}
	}

	if err = result.Err(); err != nil {
		return nil, fmt.Errorf("error during result iteration: %w", err)
	}

	return similarNodes, nil
}

// CreateNode creates a new node in the graph
func (a *AtlasOfUsGraphAdmin) CreateNode(ctx context.Context, labels []string, properties map[string]interface{}) error {
	// Ensure embedding property exists
	if _, ok := properties["embedding"]; !ok {
		return fmt.Errorf("embedding must be provided in properties")
	}

	// Set aiGenerated property
	properties["aiGenerated"] = true

	// Create session
	session := a.driver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeWrite})
	defer session.Close(ctx)

	// Build label string
	labelString := ""
	for _, label := range labels {
		labelString += ":" + label
	}

	// Build property string and parameters
	props := make([]string, 0, len(properties))
	params := make(map[string]interface{})
	
	for key, value := range properties {
		propKey := "prop_" + key
		props = append(props, fmt.Sprintf("%s: $%s", key, propKey))
		params[propKey] = value
	}
	
	propString := "{" + fmt.Sprintf(strings.Join(props, ", ")) + "}"
	
	// Build and execute query
	query := fmt.Sprintf("MERGE (n%s %s)", labelString, propString)
	_, err := session.Run(ctx, query, params)
	
	if err != nil {
		return fmt.Errorf("failed to create node: %w", err)
	}

	fmt.Printf("Created node with labels: %v and properties: %v\n", labels, properties)
	return nil
}

// ProcessFile processes a single file from S3
func (a *AtlasOfUsGraphAdmin) ProcessFile(ctx context.Context, fileKey string) error {
	// Download file content
	resp, err := a.s3Client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(a.s3Bucket),
		Key:    aws.String(fileKey),
	})
	
	if err != nil {
		return fmt.Errorf("failed to get object from S3: %w", err)
	}
	
	// Read and parse file content
	buf := new(bytes.Buffer)
	if _, err := buf.ReadFrom(resp.Body); err != nil {
		return fmt.Errorf("failed to read response body: %w", err)
	}
	_ = resp.Body.Close()
	
	var fileContent FileContent
	if err := json.Unmarshal(buf.Bytes(), &fileContent); err != nil {
		return fmt.Errorf("failed to unmarshal file content: %w", err)
	}
	
	// Create node choice prompt
	nodeChoicePrompt := fmt.Sprintf(`
	# What is the process for evaluating something new?
	When evaluating some new piece of information of content, we may want to represent it in the graph database. To figure out what that thing should look like, we will follow this process:

	1. Take in a piece of content and evaluate it. Do any pieces of it match the 6 L1 types?
	2. If so, how does it fit in?
	3. Create the graph node and insert it into neo4j

	You, as the LLM Atlas Of Us Graph Database Manager, will be the one performing the evaluation. If any piece of the ingested content relates to one of the 6 nodes, respond by saying so. You can