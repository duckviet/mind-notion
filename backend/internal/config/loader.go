package config

import (
	"fmt"
	"log"
	"strings"

	"github.com/joho/godotenv"
	"github.com/spf13/viper"
)
 

 

func Load() (*Config, error) {
	// Load file .env nếu có (không bắt buộc trong Production)
	if err := godotenv.Load(); err != nil {
		log.Println("Note: .env file not found, using environment variables")
	}

	// 2. Sử dụng instance mới thay vì global viper (Best practice)
	v := viper.New()

	// Thiết lập các giá trị mặc định
	setDefaults(v)

	// Cấu hình tìm file yaml
	v.SetConfigName("config")
	v.SetConfigType("yaml")
	v.AddConfigPath("./configs")
	v.AddConfigPath(".")

	// 3. Quan trọng: Thiết lập Environment Override
	// server.port sẽ map với SERVER_PORT
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	v.AutomaticEnv()

	// Đọc file config
	if err := v.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, fmt.Errorf("failed to read config file: %w", err)
		}
		// File không tồn tại là bình thường nếu dùng Env vars hoàn toàn
		log.Println("ℹ️  No config file found. Using defaults and environment variables.")
	} else {
		log.Printf("✅ Loaded config from: %s", v.ConfigFileUsed())
	}

	var cfg Config
	// Unmarshal config vào struct
	if err := v.Unmarshal(&cfg); err != nil {
		return nil, fmt.Errorf("failed to unmarshal config: %w", err)
	}

	// Validate configuration
	if err := cfg.Validate(); err != nil {
		return nil, fmt.Errorf("config validation failed: %w", err)
	}

	return &cfg, nil
}

// setDefaults nhận vào viper instance
func setDefaults(v *viper.Viper) {
	// Server defaults
	v.SetDefault("server.host", "localhost")
	v.SetDefault("server.port", "8080")
	v.SetDefault("server.mode", "debug")

	// Database defaults
	v.SetDefault("database.host", "localhost")
	v.SetDefault("database.port", "5432")
	v.SetDefault("database.user", "postgres")
	v.SetDefault("database.password", "password")
	v.SetDefault("database.name", "collaborative_editor")
	v.SetDefault("database.ssl_mode", "disable")

	// JWT defaults
	v.SetDefault("jwt.secret_key", "your-secret-key")
	v.SetDefault("jwt.expires_in", 3600)

	// Redis defaults
	v.SetDefault("redis.host", "localhost")
	v.SetDefault("redis.port", "6379")
	v.SetDefault("redis.password", "")
	v.SetDefault("redis.db", 0)

	// Pinecone defaults
	v.SetDefault("pinecone.api_key", "")
	v.SetDefault("pinecone.environment", "")
	v.SetDefault("pinecone.index_name", "notes")
	v.SetDefault("pinecone.namespace", "default")

	// Cohere defaults
	v.SetDefault("cohere.api_key", "")
	v.SetDefault("cohere.model", "embed-multilingual-v3.0")

	// CDN defaults
	v.SetDefault("cdn.account_id", "")
	v.SetDefault("cdn.access_key_id", "")
	v.SetDefault("cdn.secret_access_key", "")
	v.SetDefault("cdn.region", "")
	v.SetDefault("cdn.bucket_name", "")
	v.SetDefault("cdn.public_base_url", "")

	// Collab defaults
	v.SetDefault("collab.token_secret", "your-collab-token-secret")
	v.SetDefault("collab.token_ttl_minutes", 60)
}