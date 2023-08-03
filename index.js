// index.js
import { join } from 'path';
import { launch } from 'puppeteer';

export async function generatePDF(filename) {
    // Launch a new browser instance
    const browser = await launch();
    // Create a new page
    const page = await browser.newPage();
    // Construct the path to the HTML file
    const filePath = join(process.cwd(), 'index.html');
    // Navigate to the HTML file
    await page.goto(`file://${filePath}`);
    // Wait for the data to be loaded
    await page.waitForFunction(() => document.querySelector('#notification').textContent === 'Data fetched successfully!');
    // Emulate the print media type
    await page.emulateMediaType('print');
    // Generate the PDF and save it to disk with the specified filename
    const pdfPath = join(process.cwd(), filename);
    await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });
    await page.screenshot({ path: `${filename}.png` });

    // Close the browser
    await browser.close();
}
