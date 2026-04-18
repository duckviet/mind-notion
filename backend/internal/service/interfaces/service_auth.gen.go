package interfaces

import "context"

type AuthAPIService interface {
	CheckAuth (ctx context.Context, req interface{}) (interface{}, error)
	Login (ctx context.Context, req interface{}) (interface{}, error)
	Logout (ctx context.Context, req interface{}) (interface{}, error)
	RefreshToken (ctx context.Context, req interface{}) (interface{}, error)
	Register (ctx context.Context, req interface{}) (interface{}, error)
}
