package main

import (
	"context"
	"io/ioutil"
	"log"

	"github.com/chromedp/cdproto/page"
	"github.com/chromedp/chromedp"
)

func main() {
	// Create a new context
	ctx, cancel := chromedp.NewContext(context.Background())
	defer cancel()

	// Create a buffer to store the generated PDF
	var buf []byte

	// Run the tasks
	if err := chromedp.Run(ctx,
		// Navigate to the HTML file
		chromedp.Navigate(`file:///path/to/your/file.html`),
		// Wait for the data to be loaded
		chromedp.WaitVisible(`#notification`, chromedp.ByID),
		// Generate the PDF
		chromedp.ActionFunc(func(ctx context.Context) error {
			var err error
			buf, _, err = page.PrintToPDF().WithPrintBackground(true).Do(ctx)
			return err
		}),
	); err != nil {
		log.Fatal(err)
	}

	// Save the PDF to disk
	if err := ioutil.WriteFile("output.pdf", buf, 0644); err != nil {
		log.Fatal(err)
	}
}
