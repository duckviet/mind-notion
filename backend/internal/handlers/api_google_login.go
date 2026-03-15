package handlers

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/config"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/service"
	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

// GoogleLoginAPI handles Google OAuth for user login and registration
type GoogleLoginAPI struct {
	authService service.AuthService
	config      *config.Config
	oauthConfig *oauth2.Config
}

// NewGoogleLoginAPI creates a new GoogleLoginAPI instance
func NewGoogleLoginAPI(authService service.AuthService, cfg *config.Config) *GoogleLoginAPI {
	oauthConfig := &oauth2.Config{
		ClientID:     cfg.Google.ClientID,
		ClientSecret: cfg.Google.ClientSecret,
		RedirectURL:  cfg.Google.LoginRedirectURI,
		Scopes: []string{
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
		},
		Endpoint: google.Endpoint,
	}

	return &GoogleLoginAPI{
		authService: authService,
		config:      cfg,
		oauthConfig: oauthConfig,
	}
}

// generateState creates a random state string for CSRF protection
func generateState() string {
	b := make([]byte, 32)
	rand.Read(b)
	return base64.URLEncoding.EncodeToString(b)
}

// InitiateOAuth redirects the user to Google's consent screen
func (api *GoogleLoginAPI) InitiateOAuth(c *gin.Context) {
	if api.oauthConfig.ClientID == "" || api.oauthConfig.ClientSecret == "" {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Google Login is not configured"})
		return
	}

	// Generate a random state and store it in a cookie (short-lived)
	state := generateState()

	isProduction := api.config.Server.Mode == "release"
	sameSite := http.SameSiteLaxMode
	if isProduction {
		sameSite = http.SameSiteNoneMode
	}

	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "oauth_state",
		Value:    state,
		MaxAge:   int(time.Minute.Seconds() * 10), // 10 minutes
		Path:     "/",
		Domain:   resolveCookieDomain(c, api.config),
		HttpOnly: true,
		Secure:   isProduction,
		SameSite: sameSite,
	})

	// Get the authorization URL
	url := api.oauthConfig.AuthCodeURL(state)

	// Redirect to Google
	c.Redirect(http.StatusTemporaryRedirect, url)
}

// OAuthCallback handles the redirect from Google
func (api *GoogleLoginAPI) OAuthCallback(c *gin.Context) {
	// Verify state
	state := c.Query("state")

	cookieState, err := c.Cookie("oauth_state")
	if err != nil || state != cookieState {
		// Log error but we can still redirect to frontend with error
		redirectWithError(c, "invalid_state")
		return
	}

	// Clear the state cookie
	isProduction := api.config.Server.Mode == "release"
	sameSite := http.SameSiteLaxMode
	if isProduction {
		sameSite = http.SameSiteNoneMode
	}
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "oauth_state",
		Value:    "",
		MaxAge:   -1,
		Path:     "/",
		Domain:   resolveCookieDomain(c, api.config),
		HttpOnly: true,
		Secure:   isProduction,
		SameSite: sameSite,
	})

	code := c.Query("code")
	if code == "" {
		redirectWithError(c, "missing_code")
		return
	}

	// Exchange code for token
	token, err := api.oauthConfig.Exchange(context.Background(), code)
	if err != nil {
		fmt.Printf("OAuth exchange failed: %v\n", err)
		redirectWithError(c, "exchange_failed")
		return
	}

	// Fetch user info
	client := api.oauthConfig.Client(context.Background(), token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		fmt.Printf("Failed to get user info: %v\n", err)
		redirectWithError(c, "fetch_profile_failed")
		return
	}
	defer resp.Body.Close()

	var userInfo struct {
		ID            string `json:"id"`
		Email         string `json:"email"`
		VerifiedEmail bool   `json:"verified_email"`
		Name          string `json:"name"`
		Picture       string `json:"picture"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		fmt.Printf("Failed to decode user info: %v\n", err)
		redirectWithError(c, "decode_profile_failed")
		return
	}

	if userInfo.Email == "" {
		redirectWithError(c, "no_email_provided")
		return
	}

	// Perform login/registration
	authTokens, err := api.authService.GoogleLogin(
		c.Request.Context(),
		userInfo.ID,
		userInfo.Email,
		userInfo.VerifiedEmail,
		userInfo.Name,
		userInfo.Picture,
	)
	if err != nil {
		fmt.Printf("Google login failed: %v\n", err)
		redirectWithError(c, "login_failed")
		return
	}

	// Set Auth Cookies
	setAuthCookies(c, api.config, authTokens.AccessToken, authTokens.RefreshToken)
	c.SetCookie("is_logged_in", "true", 3600*24*7, "/", "", false, false)

	// Redirect to frontend callback page
	// We pass tokens in the hash fragment so the frontend can intercept and store them,
	// but they don't get sent to the server in subsequent nav logging
	frontendURL := "http://localhost:3000/auth/google/callback" // Should ideally be configurable
	if origin := os.Getenv("FRONTEND_URL"); origin != "" {
		frontendURL = origin + "/auth/google/callback"
	}

	redirectURL := fmt.Sprintf("%s#access_token=%s&refresh_token=%s", frontendURL, authTokens.AccessToken, authTokens.RefreshToken)
	c.Redirect(http.StatusTemporaryRedirect, redirectURL)
}

func redirectWithError(c *gin.Context, errCode string) {
	frontendURL := "http://localhost:3000/auth/google/callback"
	if origin := os.Getenv("FRONTEND_URL"); origin != "" {
		frontendURL = origin + "/auth/google/callback"
	}
	c.Redirect(http.StatusTemporaryRedirect, fmt.Sprintf("%s?error=%s", frontendURL, errCode))
}
