package repository

import (
	"context"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/database"
	"github.com/duckviet/gin-collaborative-editor/backend/internal/database/models"
	"gorm.io/gorm"
)

// AccountRepository defines persistence methods for OAuth/service accounts.
type AccountRepository interface {
	GetByProviderAccountID(ctx context.Context, provider models.AccountProvider, providerAccountID string, serviceType models.AccountServiceType) (*models.Account, error)
	GetByUserProviderService(ctx context.Context, userID string, provider models.AccountProvider, serviceType models.AccountServiceType) (*models.Account, error)
	Upsert(ctx context.Context, account *models.Account) error
	IsConnected(ctx context.Context, userID string, provider models.AccountProvider, serviceType models.AccountServiceType) (bool, error)
	Disconnect(ctx context.Context, userID string, provider models.AccountProvider, serviceType models.AccountServiceType) error
	ListConnectedUserIDs(ctx context.Context, provider models.AccountProvider, serviceType models.AccountServiceType) ([]string, error)
}

type accountRepository struct {
	db *database.DB
}

// NewAccountRepository creates a new account repository.
func NewAccountRepository(db *database.DB) AccountRepository {
	return &accountRepository{db: db}
}

func (r *accountRepository) GetByProviderAccountID(ctx context.Context, provider models.AccountProvider, providerAccountID string, serviceType models.AccountServiceType) (*models.Account, error) {
	var account models.Account
	err := r.db.WithContext(ctx).
		Where("provider = ? AND provider_account_id = ? AND service_type = ? AND deleted_at IS NULL", provider, providerAccountID, serviceType).
		First(&account).Error
	if err != nil {
		return nil, err
	}
	return &account, nil
}

func (r *accountRepository) GetByUserProviderService(ctx context.Context, userID string, provider models.AccountProvider, serviceType models.AccountServiceType) (*models.Account, error) {
	var account models.Account
	err := r.db.WithContext(ctx).
		Where("user_id = ? AND provider = ? AND service_type = ? AND deleted_at IS NULL", userID, provider, serviceType).
		First(&account).Error
	if err != nil {
		return nil, err
	}
	return &account, nil
}

func (r *accountRepository) Upsert(ctx context.Context, account *models.Account) error {
	var existing models.Account
	err := r.db.WithContext(ctx).
		Where("user_id = ? AND provider = ? AND service_type = ? AND deleted_at IS NULL", account.UserID, account.Provider, account.ServiceType).
		First(&existing).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return r.db.WithContext(ctx).Create(account).Error
		}
		return err
	}

	existing.ProviderAccountID = account.ProviderAccountID
	existing.AccessToken = account.AccessToken
	existing.RefreshToken = account.RefreshToken
	existing.ExpiresAt = account.ExpiresAt
	existing.TokenType = account.TokenType
	existing.Scope = account.Scope
	existing.IsConnected = account.IsConnected
	existing.LastSyncAt = account.LastSyncAt
	existing.LastFailedAt = account.LastFailedAt

	return r.db.WithContext(ctx).Save(&existing).Error
}

func (r *accountRepository) IsConnected(ctx context.Context, userID string, provider models.AccountProvider, serviceType models.AccountServiceType) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&models.Account{}).
		Where("user_id = ? AND provider = ? AND service_type = ? AND is_connected = ? AND deleted_at IS NULL", userID, provider, serviceType, true).
		Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *accountRepository) Disconnect(ctx context.Context, userID string, provider models.AccountProvider, serviceType models.AccountServiceType) error {
	return r.db.WithContext(ctx).
		Model(&models.Account{}).
		Where("user_id = ? AND provider = ? AND service_type = ? AND deleted_at IS NULL", userID, provider, serviceType).
		Updates(map[string]interface{}{
			"is_connected":  false,
			"access_token":  nil,
			"refresh_token": nil,
			"expires_at":    nil,
		}).Error
}

func (r *accountRepository) ListConnectedUserIDs(ctx context.Context, provider models.AccountProvider, serviceType models.AccountServiceType) ([]string, error) {
	userIDs := make([]string, 0)
	err := r.db.WithContext(ctx).
		Model(&models.Account{}).
		Distinct("user_id").
		Where("provider = ? AND service_type = ? AND is_connected = ? AND deleted_at IS NULL", provider, serviceType, true).
		Pluck("user_id", &userIDs).Error
	if err != nil {
		return nil, err
	}
	return userIDs, nil
}
