package config

import (
	"fmt"
	"log"
	"strconv"

	"github.com/go-playground/validator/v10"
)

// Config struct chính
type Config struct {
    Server   ServerConfig   `mapstructure:"server" validate:"required"`
    Database DatabaseConfig `mapstructure:"database" validate:"required"`
    JWT      JWTConfig      `mapstructure:"jwt" validate:"required"`
    Redis    RedisConfig    `mapstructure:"redis" validate:"required"`
    Pinecone PineconeConfig `mapstructure:"pinecone"`
    Cohere   CohereConfig   `mapstructure:"cohere"`
}

// Nested structs - chỉ cần tag cho field, prefix tự động
type ServerConfig struct {
    Host string `mapstructure:"host" validate:"required"`
    Port string `mapstructure:"port" validate:"required"`
    Mode string `mapstructure:"mode" validate:"oneof=debug release test"`
}

type DatabaseConfig struct {
    Host     string `mapstructure:"host" validate:"required"`
    Port     string `mapstructure:"port" validate:"required"`
    User     string `mapstructure:"user" validate:"required"`
    Password string `mapstructure:"password" validate:"omitempty"`
    Name     string `mapstructure:"name" validate:"required"`
    SSLMode  string `mapstructure:"ssl_mode" validate:"omitempty,oneof=disable require prefer verify-ca verify-full"`
}

type JWTConfig struct {
    SecretKey string `mapstructure:"secret_key" validate:"required,min=8"`
    ExpiresIn int    `mapstructure:"expires_in" validate:"required,min=60,max=86400"`
}

type RedisConfig struct {
    Host     string `mapstructure:"host" validate:"required"`
    Port     string `mapstructure:"port" validate:"required"`
    Password string `mapstructure:"password" validate:"omitempty"`
    DB       int    `mapstructure:"db" validate:"min=0,max=15"`
}

type PineconeConfig struct {
    APIKey      string `mapstructure:"api_key" validate:"omitempty,min=1"`       // PINECONE_API_KEY
    Environment string `mapstructure:"environment" validate:"omitempty,min=1"`    // PINECONE_ENVIRONMENT
    IndexName   string `mapstructure:"index_name" validate:"required,min=1"`      // PINECONE_INDEX_NAME  
    Namespace   string `mapstructure:"namespace" validate:"omitempty,min=1"`       // PINECONE_NAMESPACE
}

type CohereConfig struct {
    APIKey string `mapstructure:"api_key" validate:"omitempty,min=1"`         // COHERE_API_KEY
    Model  string `mapstructure:"model" validate:"omitempty,min=1"`            // COHERE_MODEL
}

// Validate method - cải thiện để không panic nếu API key rỗng
func (c *Config) Validate() error {
    validate := validator.New()

    // Custom validation cho port number
    validate.RegisterValidation("portnumber", func(fl validator.FieldLevel) bool {
        port := fl.Field().String()
        p, err := strconv.Atoi(port)
        return err == nil && p > 0 && p <= 65535
    })

    if err := validate.Struct(c); err != nil {
        var errs validator.ValidationErrors
        if validationErr, ok := err.(validator.ValidationErrors); ok {
            errs = validationErr
        } else {
            return fmt.Errorf("validation failed: %w", err)
        }

        for _, err := range errs {
            field := err.Field()
            switch err.Tag() {
            case "required":
                return fmt.Errorf("%s is required", field)
            case "min":
                return fmt.Errorf("%s must be at least %s characters", field, err.Param())
            case "oneof":
                return fmt.Errorf("%s must be one of: %s", field, err.Param())
            default:
                return fmt.Errorf("%s validation failed: %s", field, err.Tag())
            }
        }
    }

    // Business logic validation - không bắt buộc API keys ở development
    if c.Pinecone.APIKey == "" {
        log.Println("⚠️  Pinecone API key is empty. Vector search features will be disabled.")
        // Không return error để app vẫn chạy được
    }

    if c.Cohere.APIKey == "" {
        log.Println("⚠️  Cohere API key is empty. Text embedding features will be disabled.")
    }

    return nil
}
 