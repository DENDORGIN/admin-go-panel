package bufferedwriter

import (
	"gorm.io/gorm"
	"log"
	"sync"
	"time"
)

type Writer[T any] struct {
	buffer     []T
	mutex      sync.Mutex
	db         *gorm.DB
	flushEvery time.Duration
	maxSize    int
	flusher    func(tx *gorm.DB, items []T) error
	onSuccess  func(count int)
	onError    func(err error)
}

func NewWriter[T any](db *gorm.DB,
	flushEvery time.Duration,
	maxSize int,
	flusher func(tx *gorm.DB, items []T) error,
	onSuccess func(count int),
	onError func(err error)) *Writer[T] {
	w := &Writer[T]{
		db:         db,
		flushEvery: flushEvery,
		maxSize:    maxSize,
		flusher:    flusher,
		onSuccess:  onSuccess,
		onError:    onError,
	}
	go w.startTicket()
	return w
}

func (w *Writer[T]) Add(item T) {
	w.mutex.Lock()
	w.buffer = append(w.buffer, item)
	shouldFlush := len(w.buffer) > w.maxSize
	w.mutex.Unlock()

	if shouldFlush {
		go w.Flush()
	}
}

func (w *Writer[T]) Flush() {
	w.mutex.Lock()
	if len(w.buffer) == 0 {
		w.mutex.Unlock()
		return
	}
	items := make([]T, len(w.buffer))
	copy(items, w.buffer)
	w.buffer = nil
	w.mutex.Unlock()

	err := w.flusher(w.db, items)
	if err != nil {
		log.Printf("Error flushing buffer: %v", err)
		if w.onError != nil {
			w.onError(err)
		} else if w.onSuccess != nil {
			w.onSuccess(len(items))
		}
	}
}

func (w *Writer[T]) startTicket() {
	ticker := time.NewTicker(w.flushEvery)
	for range ticker.C {
		w.Flush()
	}
}
