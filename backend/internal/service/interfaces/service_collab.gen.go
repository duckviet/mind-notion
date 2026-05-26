package interfaces

import "context"

type CollabAPIService interface {
	CreateCollabToken (ctx context.Context, req interface{}) (interface{}, error)
}
