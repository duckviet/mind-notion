package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/config"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/database/models"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/repository"
)

// ChunkingService dispatches note save events to AI service for chunk generation.
type ChunkingService interface {
	DispatchNoteSaved(ctx context.Context, note *models.Note, event string)
}

type chunkingService struct {
	enabled bool
	baseURL string
	apiKey  string
	client  *http.Client
	chunkRepo repository.NoteChunkRepository
}

type embedChunk struct {
	ChunkIndex int       `json:"chunk_index"`
	Text       string    `json:"text"`
	Embedding  []float64 `json:"embedding"`
}

type embedChunksResponse struct {
	NoteID string        `json:"note_id"`
	UserID string        `json:"user_id"`
	Chunks []embedChunk  `json:"chunks"`
}

func NewChunkingService(cfg config.AIServiceConfig, chunkRepo repository.NoteChunkRepository) ChunkingService {
	timeout := time.Duration(cfg.TimeoutSeconds) * time.Second
	if cfg.TimeoutSeconds <= 0 {
		timeout = 5 * time.Second
	}

	return &chunkingService{
		enabled:   cfg.Enabled,
		baseURL:   strings.TrimRight(cfg.BaseURL, "/"),
		apiKey:    cfg.APIKey,
		client:    &http.Client{Timeout: timeout},
		chunkRepo: chunkRepo,
	}
}

func (s *chunkingService) `DispatchNoteSaved`(ctx context.Context, note *models.Note, event string) {
	if note == nil {
		log.Printf("[CHUNK][DEBUG] skip dispatch: note is nil")
		return
	}
	if !s.enabled {
		log.Printf("[CHUNK][DEBUG] skip dispatch: ai_service.enabled=false")
		return
	}
	if s.baseURL == "" {
		log.Printf("[CHUNK][DEBUG] skip dispatch: ai_service.base_url is empty")
		return
	}

	payload := map[string]any{
		"note_id":      note.ID,
		"user_id":      note.UserID,
		"title":        note.Title,
		"content":      note.Content,
		"status":       string(note.Status),
		"content_type": note.ContentType,
		"updated_at":   note.UpdatedAt.Format(time.RFC3339Nano),
		"event":        event,
	}

	go s.send(payload)
}

// Hàm bắn note qua python api để chunk và embedding
func (s *chunkingService) send(payload map[string]any) {
	body, err := json.Marshal(payload)
	if err != nil {
		log.Printf("[CHUNK][ERROR] marshal payload failed: %v", err)
		return
	}

	url := s.baseURL + "/notes/embed-chunks"
	log.Printf("[CHUNK][DEBUG] dispatch event to ai-service url=%s note_id=%v", url, payload["note_id"])

	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		log.Printf("[CHUNK][ERROR] create request failed: %v", err)
		return
	}
	req.Header.Set("Content-Type", "application/json")
	if s.apiKey != "" {
		req.Header.Set("X-Api-Key", s.apiKey)
	}

	resp, err := s.client.Do(req)
	if err != nil {
		log.Printf("[CHUNK][ERROR] request failed: %v", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		log.Printf("[CHUNK][ERROR] ai-service returned status=%d note_id=%v", resp.StatusCode, payload["note_id"])
		return
	}

	var res embedChunksResponse
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		log.Printf("[CHUNK][ERROR] decode response failed: %v", err)
		return
	}

	log.Printf("[CHUNK][DEBUG] dispatch success status=%d note_id=%s chunks=%d", resp.StatusCode, res.NoteID, len(res.Chunks))

	if s.chunkRepo == nil {
		log.Printf("[CHUNK][WARN] chunk repository is nil, skip persisting embeddings")
		return
	}

	// Khởi tạo mảng với KDL là repository.NoteChunkInput với súc chứa res.Chunks
	inputs := make([]repository.NoteChunkInput, 0, len(res.Chunks))
	// Đưa data từ output python qua input
	for _, ch := range res.Chunks {
		inputs = append(inputs, repository.NoteChunkInput{
			ChunkIndex: ch.ChunkIndex,
			Text:       ch.Text,
			Embedding:  ch.Embedding,
		})
	}

	ctx := context.Background()
	if err := s.chunkRepo.ReplaceNoteChunks(ctx, res.NoteID, res.UserID, inputs); err != nil {
		log.Printf("[CHUNK][ERROR] failed to persist note chunks: %v", err)
		return
	}

	log.Printf("[CHUNK][DEBUG] persisted %d chunks for note_id=%s", len(inputs), res.NoteID)
}

func (s *chunkingService) String() string {
	return fmt.Sprintf("chunkingService{enabled=%v, baseURL=%s}", s.enabled, s.baseURL)
}
