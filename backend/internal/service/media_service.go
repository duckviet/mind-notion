package service

import (
	"bytes"
	"context"
	"fmt"
	"image"
	_ "image/gif"
	"image/jpeg"
	_ "image/png"
	"io"
	"mime/multipart"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
	"github.com/nfnt/resize"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/config"
)

const (
	mediaTargetWidth = 1200
	mediaQuality     = 80
)

// MediaUploadResult captures the stored object details returned to clients.
type MediaUploadResult struct {
	URL            string `json:"url"`
	Key            string `json:"key"`
	ContentType    string `json:"contentType"`
	Size           int64  `json:"size"`
	OriginalFormat string `json:"originalFormat,omitempty"`
}

// MediaService defines the contract for R2-backed media operations.
type MediaService interface {
	UploadImage(ctx context.Context, file multipart.File) (*MediaUploadResult, error)
}

type r2MediaService struct {
	client  *s3.Client
	bucket  string
	baseURL string
}

// NewMediaService wires a Cloudflare R2 backed implementation.
func NewMediaService(ctx context.Context, cfg config.CDNConfig) (MediaService, error) {
	if err := validateCDNConfig(cfg); err != nil {
		return nil, err
	}

	endpoint := fmt.Sprintf("https://%s.r2.cloudflarestorage.com", cfg.AccountID)
	resolver := aws.EndpointResolverWithOptionsFunc(func(service, region string, options ...interface{}) (aws.Endpoint, error) {
		if service == s3.ServiceID {
			return aws.Endpoint{
				URL:               endpoint,
				SigningRegion:     cfg.Region,
				HostnameImmutable: true,
			}, nil
		}
		return aws.Endpoint{}, &aws.EndpointNotFoundError{}
	})

	awsCfg, err := awsconfig.LoadDefaultConfig(ctx,
		awsconfig.WithRegion(cfg.Region),
		awsconfig.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(cfg.AccessKeyID, cfg.SecretAccessKey, "")),
		awsconfig.WithEndpointResolverWithOptions(resolver),
	)
	if err != nil {
		return nil, fmt.Errorf("init R2 client: %w", err)
	}

	baseURL := strings.TrimSuffix(cfg.PublicBaseURL, "/")
	if baseURL == "" {
		baseURL = fmt.Sprintf("%s/%s", endpoint, cfg.BucketName)
	}

	client := s3.NewFromConfig(awsCfg, func(o *s3.Options) {
		o.UsePathStyle = true
	})

	return &r2MediaService{
		client:  client,
		bucket:  cfg.BucketName,
		baseURL: baseURL,
	}, nil
}

// UploadImage resizes, recompresses, and uploads an image to R2 using in-memory buffers.
func (s *r2MediaService) UploadImage(ctx context.Context, file multipart.File) (*MediaUploadResult, error) {
	var raw bytes.Buffer
	if _, err := io.Copy(&raw, file); err != nil {
		return nil, fmt.Errorf("read upload: %w", err)
	}

	img, format, err := image.Decode(bytes.NewReader(raw.Bytes()))
	if err != nil {
		return nil, fmt.Errorf("decode image: %w", err)
	}

	var processed bytes.Buffer
	if img.Bounds().Dx() <= mediaTargetWidth {
		// No resizing needed, just recompress
		if err := jpeg.Encode(&processed, img, &jpeg.Options{Quality: mediaQuality}); err != nil {
			return nil, fmt.Errorf("encode jpeg: %w", err)
		}
	} else {
		resized := resize.Resize(mediaTargetWidth, 0, img, resize.Lanczos3)

		if err := jpeg.Encode(&processed, resized, &jpeg.Options{Quality: mediaQuality}); err != nil {
			return nil, fmt.Errorf("encode jpeg: %w", err)
		}
	}

	key := fmt.Sprintf("media/%s.jpg", uuid.NewString())

	_, err = s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:        aws.String(s.bucket),
		Key:           aws.String(key),
		Body:          bytes.NewReader(processed.Bytes()),
		ContentLength: aws.Int64(int64(processed.Len())),
		ContentType:   aws.String("image/jpeg"),
	})
	if err != nil {
		return nil, fmt.Errorf("upload to r2: %w", err)
	}

	return &MediaUploadResult{
		URL:            fmt.Sprintf("%s/%s", s.baseURL, key),
		Key:            key,
		ContentType:    "image/jpeg",
		Size:           int64(processed.Len()),
		OriginalFormat: format,
	}, nil
}

func validateCDNConfig(cfg config.CDNConfig) error {
	switch {
	case strings.TrimSpace(cfg.AccountID) == "":
		return fmt.Errorf("cdn.account_id is required")
	case strings.TrimSpace(cfg.AccessKeyID) == "":
		return fmt.Errorf("cdn.access_key_id is required")
	case strings.TrimSpace(cfg.SecretAccessKey) == "":
		return fmt.Errorf("cdn.secret_access_key is required")
	case strings.TrimSpace(cfg.Region) == "":
		return fmt.Errorf("cdn.region is required")
	case strings.TrimSpace(cfg.BucketName) == "":
		return fmt.Errorf("cdn.bucket_name is required")
	}
	return nil
}
