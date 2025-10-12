package domain

import "time"

// User represents a user in the collaborative editor
type User struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Color     string    `json:"color"`
	Cursor    Cursor    `json:"cursor"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Cursor represents the cursor position of a user
type Cursor struct {
	Index  int `json:"index"`
	Length int `json:"length"`
}

// UserRepository defines the interface for user data operations
type UserRepository interface {
	Create(user *User) error
	GetByID(id string) (*User, error)
	Update(user *User) error
	Delete(id string) error
	List() ([]*User, error)
}

// UserUseCase defines the interface for user business logic
type UserUseCase interface {
	CreateUser(name string) (*User, error)
	GetUser(id string) (*User, error)
	UpdateUser(user *User) error
	DeleteUser(id string) error
	GetAllUsers() ([]*User, error)
	UpdateCursor(userID string, cursor Cursor) error
}
