package helpers

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"net/http"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type S3ObjectParams struct {
	// Bucket is the name of the S3 bucket
	// Example: my-bucket
	Bucket string `form:"bucket" binding:"required"`

	// Key is the key of the object in the S3 bucket
	// Example: path/to/my/object.txt
	Key string `form:"key" binding:"required"`
}

func GetS3Object(params S3ObjectParams) ([]byte, string, error) {
	ctx := context.TODO()
	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		return nil, "", fmt.Errorf("unable to load SDK config, %v", err)
	}

	client := s3.NewFromConfig(cfg)

	resp, err := client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(params.Bucket),
		Key:    aws.String(params.Key),
	})

	if err != nil {
		return nil, "", fmt.Errorf("unable to get object %s from bucket %s, %v", params.Key, params.Bucket, err)
	}

	defer resp.Body.Close()

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, "", fmt.Errorf("unable to read object %s from bucket %s, %v", params.Key, params.Bucket, err)
	}

	contentType := http.DetectContentType(data)

	return data, contentType, nil
}

type UploadParams struct {
	Bucket string `form:"bucket" binding:"required"`
	Key    string `form:"key" binding:"required"`
}

// UploadObjectToS3 uploads an object to S3.
func UploadObjectToS3(params UploadParams, fileData []byte) error {
	ctx := context.TODO()
	fileType := http.DetectContentType(fileData)
	log.Printf("File type: %s\n", fileType)

	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		return fmt.Errorf("unable to load SDK config, %v", err)
	}

	client := s3.NewFromConfig(cfg)

	_, err = client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:        aws.String(params.Bucket),
		Key:           aws.String(params.Key),
		Body:          bytes.NewReader(fileData),
		ContentType:   aws.String(fileType),
		ContentLength: aws.Int64(int64(len(fileData))),
	})

	if err != nil {
		return fmt.Errorf("unable to upload object %s to bucket %s, %v", params.Key, params.Bucket, err)
	}

	return nil
}
