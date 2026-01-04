package database

import (
	"context"
	"fmt"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/config"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/database/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// DB wraps GORM DB with additional functionality
type DB struct {
	*gorm.DB
}

// New creates a new database connection
// Priority: DATABASE_URL (Heroku) > config.DatabaseConfig
func New(ctx context.Context, cfg config.DatabaseConfig) (*DB, error) {
	var dsn string
	var err error
	
	// Check for Heroku DATABASE_URL first (highest priority)
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL != "" {
		// Parse and use DATABASE_URL
		dsn, err = parseDatabaseURL(dbURL)
		if err != nil {
			return nil, fmt.Errorf("failed to parse DATABASE_URL: %w", err)
		}
	} else {
		// Fallback to config
		dsn = buildDSN(cfg)
	}
	
	// Configure GORM logger
	gormLogger := logger.Default.LogMode(logger.Info)
	
	// Connect to database
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: gormLogger,
		NowFunc: func() time.Time {
			return time.Now().UTC()
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}
	
	// Get underlying sql.DB for connection pool settings
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}
	
	// Set connection pool settings
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(30 * time.Minute)
	
	// Ping database to check connection
	if err := sqlDB.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}
	
	// Auto migrate models
	// If schema exists from previous run with bigint IDs, drop and recreate (empty DB scenario)
	// if err := db.Exec(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`).Error; err != nil {
	// 	return nil, fmt.Errorf("failed to ensure pgcrypto: %w", err)
	// }
	// _ = db.Migrator().DropTable(&models.FolderNote{}, &models.NoteTag{})
	// _ = db.Migrator().DropTable(&models.Folder{}, &models.Note{}, &models.User{}, &models.Tag{})

	if err := db.AutoMigrate(
		&models.User{},
		&models.Folder{},
		&models.Note{},
		&models.Tag{},
		&models.Template{},
		&models.FolderNote{},
		&models.NoteTag{},
		&models.Event{},
		&models.Comment{},
	); err != nil {
		return nil, fmt.Errorf("failed to auto migrate: %w", err)
	}
	
	return &DB{db}, nil
}

// parseDatabaseURL parses Heroku DATABASE_URL format
// Format: postgres://user:password@host:port/dbname?sslmode=require
func parseDatabaseURL(dbURL string) (string, error) {
	parsedURL, err := url.Parse(dbURL)
	if err != nil {
		return "", fmt.Errorf("invalid DATABASE_URL format: %w", err)
	}

	// Extract components
	user := parsedURL.User.Username()
	password, _ := parsedURL.User.Password()
	host := parsedURL.Hostname()
	port := parsedURL.Port()
	if port == "" {
		port = "5432" // Default PostgreSQL port
	}
	dbname := strings.TrimPrefix(parsedURL.Path, "/")

	// Parse SSL mode from query parameters
	sslmode := "require" // Default for Heroku
	if parsedURL.Query().Get("sslmode") != "" {
		sslmode = parsedURL.Query().Get("sslmode")
	}

	// Build DSN in PostgreSQL format
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		host, port, user, password, dbname, sslmode)

	return dsn, nil
}

// buildDSN builds the database connection string from config
func buildDSN(cfg config.DatabaseConfig) string {
	return fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.Name, cfg.SSLMode)
}

// Close closes the database connection
func (db *DB) Close() error {
	sqlDB, err := db.DB.DB()
	if err != nil {
		return fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}
	
	if err := sqlDB.Close(); err != nil {
		return fmt.Errorf("failed to close database connection: %w", err)
	}
	
	return nil
}

// SeedData seeds initial data into the database
func (db *DB) SeedData() error {
	// Create default tags
	tags := []models.Tag{
		{Name: "Important", Color: "#EF4444"},
		{Name: "Work", Color: "#3B82F6"},
		{Name: "Personal", Color: "#10B981"},
		{Name: "Ideas", Color: "#F59E0B"},
		{Name: "Draft", Color: "#6B7280"},
	}

	for _, tag := range tags {
		var existingTag models.Tag
		if err := db.Where("name = ?", tag.Name).First(&existingTag).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				if err := db.Create(&tag).Error; err != nil {
					return fmt.Errorf("failed to create tag %s: %w", tag.Name, err)
				}
			} else {
				return err
			}
		}
	}

	return nil
}
