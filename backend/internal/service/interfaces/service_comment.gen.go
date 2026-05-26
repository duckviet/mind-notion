package interfaces

import "context"

type CommentAPIService interface {
	CommentDetail (ctx context.Context, req interface{}) (interface{}, error)
	CreateComment (ctx context.Context, req interface{}) (interface{}, error)
	DeleteComment (ctx context.Context, req interface{}) (interface{}, error)
	ListComments (ctx context.Context, req interface{}) (interface{}, error)
	UpdateComment (ctx context.Context, req interface{}) (interface{}, error)
}
