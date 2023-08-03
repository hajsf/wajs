import { createServer } from 'http';
import { generatePDF } from './index.js';
import { v4 as uuidv4 } from 'uuid';
import { createReadStream } from 'fs';

const port = 4040;

const server = createServer(async (req, res) => {
    if (req.method === 'GET' && req.url === '/') {
        // Generate a unique identifier for this request
        const requestId = uuidv4();
        // Generate the PDF with a unique filename
        const filename = `output-${requestId}.pdf`;
        await generatePDF(filename);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html');
        res.end(`<a href="https://deadly-square-tuna.ngrok-free.app/download/${filename}">Download PDF</a>`);
    } else if (req.method === 'GET' && req.url.startsWith('http://127.0.0.1:4040/download/')) {
        // Extract the filename from the URL
        const filename = req.url.split('/').pop();
        // Serve the PDF file
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        createReadStream(filename).pipe(res);
    } else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Not found');
    }
});

server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
