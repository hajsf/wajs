// main.go
package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"

	_ "github.com/mattn/go-sqlite3"
	"google.golang.org/protobuf/proto"

	"go.mau.fi/whatsmeow"
	waProto "go.mau.fi/whatsmeow/binary/proto"
	"go.mau.fi/whatsmeow/store"
	"go.mau.fi/whatsmeow/store/sqlstore"
	"go.mau.fi/whatsmeow/types/events"
	waLog "go.mau.fi/whatsmeow/util/log"
)

const (
	// Current Vendors
	A = iota + 100
	B
	C
	D
	E
)

func eventHandler(client *whatsmeow.Client, evt interface{}) {
	switch v := evt.(type) {
	case *events.Message:
		fmt.Println("Received a message!", v.Message.GetConversation())

		msg := &waProto.ListMessage{
			Title:       proto.String("welcome"),
			Description: proto.String("يرجى تحديد سبب التواصل"),
			ButtonText:  proto.String("أنقر هنا  👈"),
			ListType:    waProto.ListMessage_SINGLE_SELECT.Enum(),
			Sections: []*waProto.ListMessage_Section{
				{
					Title: proto.String("لدي إستفسار بخصوص:"),
					Rows: []*waProto.ListMessage_Row{
						{
							RowId: proto.String(strconv.Itoa(A)),
							Title: proto.String("عمادة القبول والتسجيل"),
							//	Description: proto.String("عمادة القبول والتسجيل"),
						},
						{
							RowId: proto.String(strconv.Itoa(B)),
							Title: proto.String("عمادة شؤون المكتبات"),
						},
						{
							RowId: proto.String(strconv.Itoa(C)),
							Title: proto.String("مواقع كليات وفروع جامعة الملك خالد"),
						},
					},
				},
			},
			ProductListInfo: &waProto.ListMessage_ProductListInfo{},
			FooterText:      new(string),
			ContextInfo:     &waProto.ContextInfo{},
		}

		targetJID, ok := ParseJID("966598840555")
		if !ok {
			return
		}
		_ = msg
		send, err := client.SendMessage(context.Background(), targetJID, &waProto.Message{
			Conversation: proto.String("hello"),
			ListMessage:  msg,
		})
		/*	send, err := client.SendMessage(context.Background(), targetJID, "", &waProto.Message{
			ViewOnceMessage: &waProto.FutureProofMessage{
				Message: &waProto.Message{
					ListMessage: msg,
				},
			}})
		*/
		if err != nil {
			fmt.Printf("Error sending message: %v", err)
		} else {
			fmt.Printf("Message sent (server timestamp: %s)", send)
		}
	}
}

func main() {
	passer := &DataPasser{logs: make(chan string)}

	http.HandleFunc("/sse/dashboard", passer.handleHello)
	go http.ListenAndServe(":1234", nil)
	/*
		ticker := time.NewTicker(500 * time.Millisecond)
		defer ticker.Stop()
		done := make(chan bool)
		go func() {
			for {
				select {
				case <-done:
					return
				case <-ticker.C:
					//	fmt.Println("Tick at", t)
					// passer.logs <- buffer.String()
				}
			}
		}()
	*/
	store.DeviceProps.Os = proto.String("WhatsApp GO")
	dbLog := waLog.Stdout("Database", "DEBUG", true)
	// Make sure you add appropriate DB connector imports, e.g. github.com/mattn/go-sqlite3 for SQLite
	container, err := sqlstore.New("sqlite3", "file:datastore.db?_foreign_keys=on", dbLog)
	if err != nil {
		panic(err)
	}
	// If you want multiple sessions, remember their JIDs and use .GetDevice(jid) or .GetAllDevices() instead.
	deviceStore, err := container.GetFirstDevice()
	if err != nil {
		panic(err)
	}
	clientLog := waLog.Stdout("Client", "DEBUG", true)
	client := whatsmeow.NewClient(deviceStore, clientLog)
	//	handler := &EventHandler{client: client}
	client.AddEventHandler(func(evt interface{}) { eventHandler(client, evt) })
	//	client.AddEventHandler(eventHandler)

	if client.Store.ID == nil {
		// No ID stored, new login
		qrChan, _ := client.GetQRChannel(context.Background())
		err = client.Connect()
		if err != nil {
			panic(err)
		}

		for evt := range qrChan {
			switch evt.Event {
			case "success":
				{
					passer.logs <- "success"
					fmt.Println("Login event: success")
				}
			case "timeout":
				{
					passer.logs <- "timeout"
					fmt.Println("Login event: timeout")
				}
			case "code":
				{
					fmt.Println("new code recieved")
					fmt.Println(evt.Code)
					passer.logs <- evt.Code
				}
			}
		}
	} else {
		// Already logged in, just connect
		passer.logs <- "Already logged"
		fmt.Println("Already logged")
		err = client.Connect()
		if err != nil {
			panic(err)
		}
	}

	// Listen to Ctrl+C (you can also do something else that prevents the program from exiting)
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	<-c

	client.Disconnect()
}

/*
$env:CGO_ENABLED = "1"
>> $env:GOOS = "windows"
>> $env:GOARCH = "amd64"
>> $env:CC = "zig cc -target x86_64-windows-gnu"
>> $env:CXX = "zig c++ -target x86_64-windows-gnu"
*/
