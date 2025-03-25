package helpers

import (
	"bytes"
	"io"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

// ReturnS3Object retrieves an object from S3 and returns it as a byte slice.
// @Description Retrieves an object from S3 given a bucket and key.
// @ID get-s3-object
// @Produce octet-stream
// @Param bucket query string true "S3 Bucket"
// @Param key query string true "S3 Key"
// @Success 200 {string} string "Successful operation"
// @Failure 400 {object} map[string]interface{} "Invalid query parameters"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /secure/helper/s3-object [get]
func ReturnS3Object(c *gin.Context) {
	var params S3ObjectParams
	if err := c.ShouldBindQuery(&params); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid query parameters"})
		return
	}

	data, contentType, err := GetS3Object(params)
	if err != nil {
		log.Printf("Error getting S3 object: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.Header("Content-Type", contentType)
	c.Header("Cache-Control", "public, max-age=3600")
	c.Data(http.StatusOK, contentType, data)
}

// UploadS3Object uploads an object to S3.
// @Description Uploads an object to S3 given a bucket and key.
// @ID upload-s3-object
// @Accept octet-stream
// @Param bucket query string true "S3 Bucket"
// @Param key query string true "S3 Key"
// @Success 200 {string} string "Successful operation"
// @Failure 400 {object} map[string]interface{} "Invalid query parameters"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /secure/helper/s3-upload [post]
func UploadS3Object(c *gin.Context) {
	var params UploadParams
	if err := c.ShouldBindQuery(&params); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid query parameters"})
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file provided"})
		return
	}

	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to open file"})
		return
	}
	defer src.Close()

	buffer := bytes.NewBuffer(nil)
	if _, err := io.Copy(buffer, src); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to read file"})
		return
	}

	fileBytes := buffer.Bytes()

	err = UploadObjectToS3(params, fileBytes)
	if err != nil {
		log.Printf("Error uploading to S3: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.String(http.StatusOK, "File uploaded successfully")
}
