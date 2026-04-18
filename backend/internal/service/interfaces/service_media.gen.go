package interfaces

import "context"

type MediaAPIService interface {
	UploadMedia (ctx context.Context, req interface{}) (interface{}, error)
}
