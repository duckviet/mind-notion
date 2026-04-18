package interfaces

import "context"

type EventAPIService interface {
	CreateEvent (ctx context.Context, req interface{}) (interface{}, error)
	DeleteEvent (ctx context.Context, req interface{}) (interface{}, error)
	GetEventById (ctx context.Context, req interface{}) (interface{}, error)
	ListEvents (ctx context.Context, req interface{}) (interface{}, error)
	ListEventsByRange (ctx context.Context, req interface{}) (interface{}, error)
	UpdateEvent (ctx context.Context, req interface{}) (interface{}, error)
}
