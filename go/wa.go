// wa.go
package main

import (
	"fmt"
	"net/http"
	"sync"
)

var (
	mux sync.Mutex
)

type DataPasser struct {
	logs chan string
}

func (p *DataPasser) handleHello(w http.ResponseWriter, r *http.Request) {
	fmt.Println("from here")
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Internal error", 500)
		return
	}
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	setupCORS(&w, r)

	for {
		select {
		case c := <-p.logs:
			fmt.Println("recieved")
			mux.Lock()
			//counter++
			//c := counter
			mux.Unlock()
			fmt.Fprintf(w, "data: %v\n\n", c)
			flusher.Flush()
		case <-r.Context().Done():
			fmt.Println("Connection closed")
			return
		}
	}
}

func setupCORS(w *http.ResponseWriter, req *http.Request) {
	(*w).Header().Set("Cache-Control", "no-cache")
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	(*w).Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
	(*w).Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
}
