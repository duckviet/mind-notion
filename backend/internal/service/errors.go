package service

import "errors"

// Service errors
var (
	// User errors
	ErrUserNotFound         = errors.New("user not found")
	ErrUserAlreadyExists    = errors.New("user already exists")
	ErrUsernameAlreadyExists = errors.New("username already exists")
	ErrUserInactive         = errors.New("user is inactive")
	ErrInvalidCredentials   = errors.New("invalid credentials")

	// Note errors
	ErrNoteNotFound = errors.New("note not found")

	// Folder errors
	ErrFolderNotFound = errors.New("folder not found")

	// Template errors
	ErrTemplateNotFound = errors.New("template not found")

	// General errors
	ErrInternalServerError = errors.New("internal server error")
	ErrNotImplemented      = errors.New("not implemented")
	ErrValidationFailed    = errors.New("validation failed")
	ErrUnauthorized        = errors.New("unauthorized")
	ErrForbidden          = errors.New("forbidden")
)
