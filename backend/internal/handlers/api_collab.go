package handlers

import (
	"net/http"
	"time"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/config"
	dbmodels "github.com/duckviet/gin-collaborative-editor/backend/internal/database/models"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type CollabAPI struct {
	noteService service.NoteService
	authService service.AuthService
	config      *config.Config
}

func NewCollabAPI(noteService service.NoteService, authService service.AuthService, cfg *config.Config) *CollabAPI {
	return &CollabAPI{
		noteService: noteService,
		authService: authService,
		config:      cfg,
	}
}

type collabTokenRequest struct {
	NoteID    string `json:"note_id"`
	EditToken string `json:"edit_token"`
}

type collabTokenResponse struct {
	Token string         `json:"token"`
	Role  string         `json:"role"`
	Note  collabNoteInfo `json:"note"`
}

type collabNoteInfo struct {
	ID                string   `json:"id"`
	Title             string   `json:"title"`
	Content           string   `json:"content"`
	Tags              []string `json:"tags"`
	IsPublic          bool     `json:"is_public"`
	PublicEditEnabled bool     `json:"public_edit_enabled"`
}

type collabClaims struct {
	NoteID string `json:"note_id"`
	UserID string `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// Post /api/v1/public/collab/token
// Create a collab token (owner via auth or public edit token)
func (api *CollabAPI) CreateCollabToken(c *gin.Context) {
	var body collabTokenRequest
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request, " + err.Error()})
		return
	}
	if body.NoteID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "note_id is required"})
		return
	}

	note, err := api.noteService.GetNoteByID(c.Request.Context(), body.NoteID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "note not found"})
		return
	}

	role, userID := api.resolveEditorIdentity(c, note, body.EditToken)
	if role == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	token, err := api.signCollabToken(note.ID, userID, role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to sign token"})
		return
	}

	c.JSON(http.StatusOK, collabTokenResponse{
		Token: token,
		Role:  role,
		Note:  toCollabNoteInfo(note),
	})
}

func (api *CollabAPI) resolveEditorIdentity(c *gin.Context, note *dbmodels.Note, editToken string) (string, string) {
	// Try owner auth (bearer or cookie)
	token := extractTokenFromRequest(c)
	if token != "" {
		user, err := api.authService.ValidateToken(c.Request.Context(), token)
		if err == nil && note.UserID == user.ID {
			return "owner", user.ID
		}
	}

	// Public edit token
	if editToken != "" && note.PublicEditEnabled && note.PublicEditToken == editToken {
		return "public_edit", "anon-" + uuid.NewString()
	}

	return "", ""
}

func (api *CollabAPI) signCollabToken(noteID, userID, role string) (string, error) {
	now := time.Now()
	claims := collabClaims{
		NoteID: noteID,
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(time.Duration(api.config.Collab.TokenTTLMinutes) * time.Minute)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(api.config.Collab.TokenSecret))
}

func toCollabNoteInfo(note *dbmodels.Note) collabNoteInfo {
	tags := make([]string, 0, len(note.Tags))
	for _, tag := range note.Tags {
		tags = append(tags, tag.Name)
	}

	return collabNoteInfo{
		ID:                note.ID,
		Title:             note.Title,
		Content:           note.Content,
		Tags:              tags,
		IsPublic:          note.IsPublic,
		PublicEditEnabled: note.PublicEditEnabled,
	}
}
