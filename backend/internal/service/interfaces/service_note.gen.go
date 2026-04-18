package interfaces

import "context"

type NoteAPIService interface {
	CreateNote (ctx context.Context, req interface{}) (interface{}, error)
	DeleteNote (ctx context.Context, req interface{}) (interface{}, error)
	GetNote (ctx context.Context, req interface{}) (interface{}, error)
	GetPublicEditSettings (ctx context.Context, req interface{}) (interface{}, error)
	GetPublicNote (ctx context.Context, req interface{}) (interface{}, error)
	ListNotes (ctx context.Context, req interface{}) (interface{}, error)
	ListNotesTOM (ctx context.Context, req interface{}) (interface{}, error)
	RotatePublicEditToken (ctx context.Context, req interface{}) (interface{}, error)
	SaveNoteSnapshot (ctx context.Context, req interface{}) (interface{}, error)
	SaveNoteTiptapSnapshot (ctx context.Context, req interface{}) (interface{}, error)
	UpdateNote (ctx context.Context, req interface{}) (interface{}, error)
	UpdateNoteTOM (ctx context.Context, req interface{}) (interface{}, error)
	UpdatePublicEditSettings (ctx context.Context, req interface{}) (interface{}, error)
}
