package helpers

import (
	"aou_api/src/models"
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"os"
)

type EmbeddingResponse []struct {
	Index     int         `json:"index"`
	Embedding [][]float64 `json:"embedding"`
}

func GenerateEmbedding(appCtx *models.AppContext, textToEmbed string) ([]float64, error) {
	embeddingEndpoint := os.Getenv("EMBEDDING_ENDPOINT")
	requestBodyBytes, _ := json.Marshal(map[string]string{"content": textToEmbed})

	// Make the POST request to the embedding endpoint
	resp, err := http.Post(embeddingEndpoint, "application/json", bytes.NewBuffer(requestBodyBytes))
	if err != nil {
		appCtx.LOGGER.Error("Error calling embedding endpoint: " + err.Error())
		return nil, err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var embeddingResponse EmbeddingResponse
	if err := json.Unmarshal(respBody, &embeddingResponse); err != nil {
		appCtx.LOGGER.Error("Error unmarshaling embedding: " + err.Error())
		return nil, err
	}
	embedding := embeddingResponse[0].Embedding[0]

	return embedding, nil
}
