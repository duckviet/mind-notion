package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/app"
)

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Initialize application
	application, cleanup, err := app.New(ctx)
	if err != nil {
		log.Fatal("Failed to initialize app:", err)
	}
	defer cleanup()

	// Handle graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-sigChan
		log.Println("Shutting down gracefully...")
		cancel()
	}()

	// Run application
	if err := application.Run(ctx); err != nil {
		log.Fatal("Failed to run app:", err)
	}
}
