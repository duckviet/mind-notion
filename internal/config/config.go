package config

import (
	"fmt"
	"time"
)

// Config holds all configuration for our application
type Config struct {
	Server   ServerConfig   `mapstructure:"server"`
	Database DatabaseConfig `mapstructure:"database"`
	JWT      JWTConfig      `mapstructure:"jwt"`
	Redis    RedisConfig    `mapstructure:"redis"`
	Pinecone PineconeConfig `mapstructure:"pinecone"`
	Cohere   CohereConfig   `mapstructure:"cohere"`
}

// ServerConfig holds server configuration
type ServerConfig struct {
	Host string `mapstructure:"host"`
	Port string `mapstructure:"port"`
	Mode string `mapstructure:"mode"`
}

// DatabaseConfig holds database configuration
type DatabaseConfig struct {
	Host     string `mapstructure:"host"`
	Port     string `mapstructure:"port"`
	User     string `mapstructure:"user"`
	Password string `mapstructure:"password"`
	Name     string `mapstructure:"name"`
	SSLMode  string `mapstructure:"ssl_mode"`
}

// JWTConfig holds JWT configuration
type JWTConfig struct {
	SecretKey string `mapstructure:"secret_key"`
	ExpiresIn int    `mapstructure:"expires_in"`
}

// RedisConfig holds Redis configuration
type RedisConfig struct {
	Host     string `mapstructure:"host"`
	Port     string `mapstructure:"port"`
	Password string `mapstructure:"password"`
	DB       int    `mapstructure:"db"`
}

// PineconeConfig holds Pinecone vector database configuration
type PineconeConfig struct {
	APIKey      string `mapstructure:"api_key"`
	IndexName   string `mapstructure:"index_name"`
	Namespace   string `mapstructure:"namespace"`
}

// CohereConfig holds Cohere embeddings configuration
type CohereConfig struct {
	APIKey string `mapstructure:"api_key"`
	Model  string `mapstructure:"model"` // embed-english-v3.0 or embed-multilingual-v3.0
}
// Validate validates the configuration
func (c *Config) Validate() error {
	if c.Server.Port == "" {
		return fmt.Errorf("server port is required")
	}
	
	if c.Database.Host == "" {
		return fmt.Errorf("database host is required")
	}
	
	if c.Database.Name == "" {
		return fmt.Errorf("database name is required")
	}
	
	if c.JWT.SecretKey == "" {
		return fmt.Errorf("JWT secret key is required")
	}

	if c.Pinecone.APIKey == "" {
		return fmt.Errorf("pinecone API key is required")
	}

	if c.Cohere.APIKey == "" {
		return fmt.Errorf("cohere API key is required")
	}

	return nil
}

// GetJWTExpiration returns JWT expiration duration
func (c *Config) GetJWTExpiration() time.Duration {
	return time.Duration(c.JWT.ExpiresIn) * time.Second
}