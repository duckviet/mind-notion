package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/config"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/database/models"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/dto"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/repository"
	"gorm.io/gorm"
)

// AuthService defines the interface for authentication business logic
type AuthService interface {
	Register(ctx context.Context, req dto.ReqUserRegistration) (*dto.ResAuthTokens, error)
	Login(ctx context.Context, req dto.ReqLoginCredentials) (*dto.ResAuthTokens, error)
	Logout(ctx context.Context, token string) error
	ValidateToken(ctx context.Context, token string) (*models.User, error)
	RefreshToken(ctx context.Context, refreshToken string) (*dto.ResAuthTokens, error)
	GoogleLogin(ctx context.Context, providerAccountID, email string, emailVerified bool, name, avatar string) (*dto.ResAuthTokens, error)
}

// authService implements AuthService
type authService struct {
	userRepo    repository.UserRepository
	accountRepo repository.AccountRepository
	config      *config.Config
}

// NewAuthService creates a new auth service
func NewAuthService(userRepo repository.UserRepository, accountRepo repository.AccountRepository, config *config.Config) AuthService {
	return &authService{
		userRepo:    userRepo,
		accountRepo: accountRepo,
		config:      config,
	}
}

// Register registers a new user
func (s *authService) Register(ctx context.Context, req dto.ReqUserRegistration) (*dto.ResAuthTokens, error) {

	fmt.Println("Register request:", req)

	// Check if user already exists (username)
	existingUser, err := s.userRepo.GetByUsername(ctx, req.Username)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("failed to check username: %w", err)
	}
	if existingUser != nil {
		return nil, errors.New("username already exists")
	}

	// Check if user already exists (email)
	existingUser, err = s.userRepo.GetByEmail(ctx, req.Email)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("failed to check email: %w", err)
	}
	if existingUser != nil {
		return nil, errors.New("email already exists")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create user
	hashedPasswordStr := string(hashedPassword)
	user := &models.User{
		Username:      req.Username,
		Email:         req.Email,
		Password:      &hashedPasswordStr,
		Name:          req.Username, // Default name to username
		Status:        models.UserStatusActive,
		EmailVerified: false,
	}

	err = s.userRepo.Create(ctx, user)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	emailAuth := &models.Account{
		UserID:            user.ID,
		Provider:          models.AccountProviderEmail,
		ProviderAccountID: user.ID,
		ServiceType:       models.AccountServiceAuth,
		IsConnected:       true,
	}
	if err := s.accountRepo.Upsert(ctx, emailAuth); err != nil {
		return nil, fmt.Errorf("failed to create auth account: %w", err)
	}

	// Generate tokens
	tokens, err := s.generateTokens(user.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate tokens: %w", err)
	}

	return tokens, nil
}

// Login authenticates a user
func (s *authService) Login(ctx context.Context, req dto.ReqLoginCredentials) (*dto.ResAuthTokens, error) {

	fmt.Println("Login request:", req)

	// Get user by username or email
	user, err := s.userRepo.GetByUsername(ctx, req.Username)
	if err != nil {
		// Try email if username not found
		user, err = s.userRepo.GetByEmail(ctx, req.Username)
		if err != nil {
			return nil, errors.New("invalid credentials")
		}
	}

	// Check password
	if user.Password == nil || *user.Password == "" {
		return nil, errors.New("invalid credentials")
	}
	err = bcrypt.CompareHashAndPassword([]byte(*user.Password), []byte(req.Password))
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	// Check if user is active
	if user.Status != models.UserStatusActive {
		return nil, errors.New("account is not active")
	}

	// Update last login
	user.LastLoginAt = &[]time.Time{time.Now()}[0]
	err = s.userRepo.Update(ctx, user)
	if err != nil {
		// Log error but don't fail login
		fmt.Printf("Failed to update last login: %v\n", err)
	}

	// Generate tokens
	tokens, err := s.generateTokens(user.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate tokens: %w", err)
	}

	return tokens, nil
}

// Logout invalidates a token (in a real app, you'd add token to blacklist)
func (s *authService) Logout(ctx context.Context, token string) error {
	// In a real application, you would:
	// 1. Parse the token to get the user ID
	// 2. Add the token to a blacklist/revocation list
	// 3. Store in Redis or database

	// For now, we'll just return success
	// TODO: Implement token blacklisting
	return nil
}

// ValidateToken validates a JWT token and returns the user
func (s *authService) ValidateToken(ctx context.Context, token string) (*models.User, error) {
	// Parse token
	claims, err := s.parseToken(token)
	if err != nil {
		return nil, fmt.Errorf("invalid token: %w", err)
	}

	// Get user from database
	userID, _ := (*claims)["user_id"].(string)
	if userID == "" {
		return nil, errors.New("invalid token: bad user_id type")
	}
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	// Check if user is still active
	if user.Status != models.UserStatusActive {
		return nil, errors.New("user account is not active")
	}

	return user, nil
}

// RefreshToken generates new tokens using refresh token
func (s *authService) RefreshToken(ctx context.Context, refreshToken string) (*dto.ResAuthTokens, error) {
	// Parse refresh token
	claims, err := s.parseToken(refreshToken)
	if err != nil {
		return nil, fmt.Errorf("invalid refresh token: %w", err)
	}

	// Get user from database
	userID, _ := (*claims)["user_id"].(string)
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	// Check if user is still active
	if user.Status != models.UserStatusActive {
		return nil, errors.New("user account is not active")
	}

	// Generate new tokens
	tokens, err := s.generateTokens(user.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate tokens: %w", err)
	}

	return tokens, nil
}

// GoogleLogin authenticates a user via Google OAuth profile, creating or linking an account if needed.
func (s *authService) GoogleLogin(ctx context.Context, providerAccountID, email string, emailVerified bool, name, avatar string) (*dto.ResAuthTokens, error) {
	if providerAccountID == "" {
		return nil, errors.New("missing provider account id")
	}

	var user *models.User
	googleAuthAccount, err := s.accountRepo.GetByProviderAccountID(ctx, models.AccountProviderGoogle, providerAccountID, models.AccountServiceAuth)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("failed to get account by provider account id: %w", err)
	}
	if err == nil {
		user, err = s.userRepo.GetByID(ctx, googleAuthAccount.UserID)
		if err != nil {
			return nil, fmt.Errorf("failed to get linked user: %w", err)
		}
	}

	if user == nil {
		user, err = s.userRepo.GetByEmail(ctx, email)
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("failed to get user by email: %w", err)
		}
		if errors.Is(err, gorm.ErrRecordNotFound) {
			user = nil
		}
	}

	now := time.Now()
	if user == nil {
		user = &models.User{
			Username:      email,
			Email:         email,
			Password:      nil,
			Name:          name,
			Avatar:        avatar,
			Status:        models.UserStatusActive,
			EmailVerified: emailVerified,
			LastLoginAt:   &now,
		}

		err = s.userRepo.Create(ctx, user)
		if err != nil {
			return nil, fmt.Errorf("failed to create user during google login: %w", err)
		}
	} else {
		if user.Status != models.UserStatusActive {
			return nil, errors.New("account is not active")
		}

		existingGoogleAuth, authErr := s.accountRepo.GetByUserProviderService(ctx, user.ID, models.AccountProviderGoogle, models.AccountServiceAuth)
		if authErr != nil && !errors.Is(authErr, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("failed to check existing google auth account: %w", authErr)
		}
		if authErr == nil && existingGoogleAuth.ProviderAccountID != providerAccountID {
			return nil, errors.New("google account mismatch for this email")
		}

		updated := false
		if name != "" && user.Name != name {
			user.Name = name
			updated = true
		}
		if avatar != "" && user.Avatar != avatar {
			user.Avatar = avatar
			updated = true
		}
		if emailVerified && !user.EmailVerified {
			user.EmailVerified = true
			updated = true
		}

		user.LastLoginAt = &now
		updated = true

		if updated {
			err = s.userRepo.Update(ctx, user)
			if err != nil {
				return nil, fmt.Errorf("failed to update user during google login: %w", err)
			}
		}
	}

	googleAuth := &models.Account{
		UserID:            user.ID,
		Provider:          models.AccountProviderGoogle,
		ProviderAccountID: providerAccountID,
		ServiceType:       models.AccountServiceAuth,
		IsConnected:       true,
	}
	if err := s.accountRepo.Upsert(ctx, googleAuth); err != nil {
		return nil, fmt.Errorf("failed to upsert google auth account: %w", err)
	}

	// Generate tokens
	tokens, err := s.generateTokens(user.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate tokens: %w", err)
	}

	return tokens, nil
}

// generateTokens generates access and refresh tokens
func (s *authService) generateTokens(userID string) (*dto.ResAuthTokens, error) {
	// Access token (short-lived)
	accessToken, err := s.createToken(userID, time.Hour*1) // 1 hour
	if err != nil {
		return nil, err
	}

	// Refresh token (long-lived)
	refreshToken, err := s.createToken(userID, time.Hour*24*7) // 7 days
	if err != nil {
		return nil, err
	}

	return &dto.ResAuthTokens{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

// createToken creates a JWT token
func (s *authService) createToken(userID string, duration time.Duration) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(duration).Unix(),
		"iat":     time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.config.JWT.SecretKey))
}

// parseToken parses and validates a JWT token
func (s *authService) parseToken(tokenString string) (*jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Validate signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.config.JWT.SecretKey), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		// Ensure user_id exists and is a string
		userID, ok := claims["user_id"].(string)
		if !ok || userID == "" {
			return nil, errors.New("invalid token: missing user_id")
		}

		return &claims, nil
	}

	return nil, errors.New("invalid token")
}

// JWTClaims represents JWT token claims
type JWTClaims struct {
	UserID string `json:"user_id"`
	jwt.RegisteredClaims
}
