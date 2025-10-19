package database

import (
	"context"
	"fmt"
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
func New(ctx context.Context, cfg config.DatabaseConfig) (*DB, error) {
	dsn := buildDSN(cfg)
	
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
	if err := db.AutoMigrate(
		&models.User{},
		&models.Folder{},
		&models.Note{},
		&models.Tag{},
		&models.FolderNote{},
		&models.NoteTag{},
	); err != nil {
		return nil, fmt.Errorf("failed to auto migrate: %w", err)
	}
	
	return &DB{db}, nil
}

// buildDSN builds the database connection string
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
