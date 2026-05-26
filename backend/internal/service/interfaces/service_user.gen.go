package interfaces

import "context"

type UserAPIService interface {
	DeleteMe (ctx context.Context, req interface{}) (interface{}, error)
	GetMe (ctx context.Context, req interface{}) (interface{}, error)
	UpdateMe (ctx context.Context, req interface{}) (interface{}, error)
}
