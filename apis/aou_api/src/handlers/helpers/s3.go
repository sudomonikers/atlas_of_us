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

type S3ObjectParams struct {
	// Bucket is the name of the S3 bucket
	// Example: my-bucket
	Bucket string `form:"bucket" binding:"required"`

	// Key is the key of the object in the S3 bucket
	// Example: path/to/my/object.txt
	Key string `form:"key" binding:"required"`
}

// GetS3Object retrieves an object from S3 and returns it as a byte slice.
// @Description Retrieves an object from S3 given a bucket and key.
// @ID get-s3-object
// @Produce octet-stream
// @Param bucket query string true "S3 Bucket"
// @Param key query string true "S3 Key"
// @Success 200 {string} string "Successful operation"
// @Failure 400 {object} map[string]interface{} "Invalid query parameters"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /secure/helper/s3-object [get]
func GetS3Object(c *gin.Context) {
	var params S3ObjectParams
	if err := c.ShouldBindQuery(&params); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid query parameters"})
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
		Bucket: aws.String(params.Bucket),
		Key:    aws.String(params.Key),
	})

	if err != nil {
		log.Printf("unable to get object %s from bucket %s, %v", params.Key, params.Bucket, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	defer resp.Body.Close()

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("unable to read object %s from bucket %s, %v", params.Key, params.Bucket, err)
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

func GenerateImageBasedOffName(c *gin.Context) {

}
