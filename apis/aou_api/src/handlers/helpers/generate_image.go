package helpers

import (
	"aou_api/src/models"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

type ImageGenerationResponse struct {
	Created int `json:"created"`
	Data    []struct {
		Url string `json:"url"`
	} `json:"data"`
}

func GenerateImage(appCtx *models.AppContext, textToGenerateImageFrom string) ([]byte, error) {
	imageGenerationEndpoint := os.Getenv("EMBEDDING_ENDPOINT")

	requestBody, err := json.Marshal(map[string]interface{}{
		"model":  "dall-e-2",
		"prompt": textToGenerateImageFrom,
		"n":      1,
		"size":   "512x512",
	})
	if err != nil {
		appCtx.LOGGER.Error("Error marshaling request body: " + err.Error())
		return nil, err
	}

	req, err := http.NewRequest("POST", imageGenerationEndpoint, bytes.NewBuffer(requestBody))
	if err != nil {
		appCtx.LOGGER.Error("Error creating request: " + err.Error())
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+os.Getenv("OPENAI_API_KEY"))

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		appCtx.LOGGER.Error("Error calling image generation endpoint: " + err.Error())
		return nil, err
	}
	defer resp.Body.Close()
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		appCtx.LOGGER.Error("Error reading response body: " + err.Error())
		return nil, err
	}

	var imageGenResponse ImageGenerationResponse
	if err := json.Unmarshal(respBody, &imageGenResponse); err != nil {
		appCtx.LOGGER.Error("Error unmarshaling image generation response: " + err.Error())
		return nil, err
	}

	fmt.Println(respBody)

	imageURL := imageGenResponse.Data[0].Url

	// Download the image
	imageBytes, err := downloadImage(appCtx, imageURL)
	if err != nil {
		return nil, err
	}

	return imageBytes, nil
}

func downloadImage(appCtx *models.AppContext, imageURL string) ([]byte, error) {
	resp, err := http.Get(imageURL)
	if err != nil {
		appCtx.LOGGER.Error("Error downloading image: " + err.Error())
		return nil, fmt.Errorf("error downloading image: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		appCtx.LOGGER.Error(fmt.Sprintf("Image download failed with status code: %d", resp.StatusCode))
		return nil, fmt.Errorf("image download failed with status code: %d", resp.StatusCode)
	}

	imageBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		appCtx.LOGGER.Error("Error reading image data: " + err.Error())
		return nil, fmt.Errorf("error reading image data: %w", err)
	}

	return imageBytes, nil
}
