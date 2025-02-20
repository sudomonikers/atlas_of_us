package helpers

import (
	"bytes"
	"context"
	"io"
	"log"
	"net/http"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/gin-gonic/gin"
)

// GetS3Object retrieves an object from S3 and returns it as a byte slice.
func GetS3Object(c *gin.Context) {
	bucket := c.Query("bucket")
	key := c.Query("key")

	if bucket == "" || key == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bucket and key are required"})
		return
	}

	// Use the application context's context.Context
	ctx := context.TODO()
	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		log.Printf("unable to load SDK config, %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	client := s3.NewFromConfig(cfg)

	resp, err := client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	})

	if err != nil {
		log.Printf("unable to get object %s from bucket %s, %v", key, bucket, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	defer resp.Body.Close()

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("unable to read object %s from bucket %s, %v", key, bucket, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	contentType := http.DetectContentType(data)
	c.Header("Content-Type", contentType)

	c.Header("Cache-Control", "public, max-age=3600")

	reader := bytes.NewReader(data)
	_, err = io.Copy(c.Writer, reader)
	if err != nil {
		log.Printf("Error writing response: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
}
