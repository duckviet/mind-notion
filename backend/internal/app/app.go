package app

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/config"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/database"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/domain"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/embeddings"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/handlers"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/repository"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/service"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/vectorstore"
	"github.com/gin-gonic/gin"
)

// App represents the application
type App struct {
	router *gin.Engine
	config *config.Config
	db     *database.DB
}

// New creates a new application instance
func New(ctx context.Context) (*App, func(), error) {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		return nil, nil, fmt.Errorf("failed to load config: %w", err)
	}

	// Initialize database
	db, err := database.New(ctx, cfg.Database)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to initialize database: %w", err)
	}

	// Seed initial data
	if err := db.SeedData(); err != nil {
		log.Printf("Warning: failed to seed data: %v", err)
	}

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	noteRepo := repository.NewNoteRepository(db)
	folderRepo := repository.NewFolderRepository(db)
	templateRepo := repository.NewTemplateRepository(db)
	eventRepo := repository.NewEventRepository(db)

	var (
		searchService service.SearchService
		searchHandler *handlers.SearchHandler
	)

	// Initialize search components (optional - only if Pinecone and Cohere are configured)
	if cfg.Pinecone.APIKey != "" && cfg.Cohere.APIKey != "" {
		embeddingProvider, err := embeddings.NewCohereProvider(cfg.Cohere)
		if err != nil {
			log.Printf("Warning: failed to initialize Cohere embeddings: %v", err)
		} else {
			vectorStore, err := vectorstore.NewPineconeStore(ctx, cfg.Pinecone)
			if err != nil {
				log.Printf("Warning: failed to initialize Pinecone: %v", err)
			} else {
				searchService = service.NewSearchService(embeddingProvider, vectorStore, noteRepo)
				searchHandler = handlers.NewSearchHandler(searchService)
				log.Printf("🔍 Semantic search: ✅ Enabled (Pinecone + Cohere)")
			}
		}
	} else {
		log.Printf("🔍 Semantic search: ⚠️ Disabled (missing Pinecone or Cohere API keys)")
	}

	// Initialize services
	userService := service.NewUserService(userRepo, cfg)
	noteService := service.NewNoteService(noteRepo, cfg, searchService)
	folderService := service.NewFolderService(folderRepo, cfg)
	templateService := service.NewTemplateService(templateRepo)
	eventService := service.NewEventService(eventRepo)
	authService := service.NewAuthService(userRepo, cfg)

	mediaService, err := service.NewMediaService(ctx, cfg.CDN)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to initialize media service: %w", err)
	}

	// Initialize collaboration (websocket) components
	clientRepo := domain.NewInMemoryClientRepository()
	collabService := service.NewCollaborationService(userRepo, noteRepo, clientRepo, userService, noteService)
	wsHandler := handlers.NewWebSocketHandler(collabService)

	// Initialize handlers
	router := handlers.SetupRouter(cfg, authService, userService, noteService, folderService, templateService, *eventService, mediaService, wsHandler, searchHandler)

	app := &App{
		router: router,
		config: cfg,
		db:     db,
	}

	cleanup := func() {
		if err := db.Close(); err != nil {
			log.Printf("Error closing database: %v", err)
		}
	}

	return app, cleanup, nil
}

// Run starts the application
func (a *App) Run(ctx context.Context) error {
	port := os.Getenv("PORT")
	if port == "" {
		port = a.config.Server.Port
	}
	serverAddr := fmt.Sprintf(":%s", port)

	log.Printf("🚀 Collaborative Editor Server starting on %s:%s", a.config.Server.Host, serverAddr)
	log.Printf("📡 WebSocket endpoint: ws://localhost:%s/ws", serverAddr)
	log.Printf("🌐 REST API endpoint: http://localhost:%s/api/v1", serverAddr)
	log.Printf("💾 Database connection: ✅ Connected")

	return a.router.Run(serverAddr)
}
