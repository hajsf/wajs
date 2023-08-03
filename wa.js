import qrcode from 'qrcode-terminal';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia, MessageContent, List, Buttons, Location } = pkg;
import { generatePDF } from './index.js';
import { v4 as uuidv4 } from 'uuid';
import { join } from 'path';
import fs from 'fs';
import vosk from 'vosk';
const { Model, KaldiRecognizer } = vosk;
import cld3 from 'cld3-asm';


const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', qr => {
    console.log('QR RECEIVED', qr);
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
     console.log('Client is ready!');
});

client.on('authenticated', (session) => {    
    // Save the session object however you prefer.
    // Convert it to json, save it to a file, store it in a database...
    console.log('Application is ready!');
});

let messages = {};
client.on('message', async message => {
    console.log(`message recieved: ${message.body}\n`)
    if (!messages[message.from]) {
        messages[message.from] = [];
    }
    messages[message.from].push(message.body);
    if (message.notifyName) {
        client.sendMessage(message.from, `Hello ${message.notifyName}`);
        // Your code here
    }
    
    if(message.hasMedia) {
        const media = await message.downloadMedia();
        // do something with the media data here
        console.log("media downloaded");
        const data = media.data;
        const buffer = Buffer.from(data, 'base64');
        
        console.log('Saving audio data to file...');
        fs.writeFile('output.wav', buffer, (err) => {
            if (err) {
                console.error('An error occurred while saving the audio data:', err);
            } else {
                console.log('Audio data successfully saved to file!');
                transcribeAudio();
            }
        });
    }

    if (message.type === "chat") {
        await message.reply("replying you");
        const requestId = uuidv4();
        // Generate the PDF with a unique filename
        const filename = `output-${requestId}.pdf`;
        await generatePDF(filename);
        const filePath = join(process.cwd(), `${filename}`);
        console.log(`file got generated at: ${filePath}`)
        
        client.sendMessage(message.from, `file got generated at: ${filePath}`);
        // Read the image file into a Buffer
        const imageBuffer = fs.readFileSync(filePath);
        // Convert the Buffer to a base64 encoded string
        const base64Image = imageBuffer.toString('base64');
        const media = new MessageMedia('application/pdf', base64Image, "output file");
      //  const media = MessageMedia.fromFilePath(filePath);
        await client.sendMessage(message.from, media, {
            caption: "Hi man",
        });
       
        await message.reply(media, message.from, {
            caption: "another reply",
        });

        const sections = [
            {
                title: 'sectionTitle',
                rows: [
                    {
                        id: 'customId',
                        title: 'ListItem1',
                        description: 'desc'
                    },
                    {
                        title: 'ListItem2'
                    }
                ]
            }
        ];
        const list = new List("Body", "Button text", sections);

        const buttons = [
            {
                id: 'button1',
                body: 'Button 1'
            },
            {
                body: 'Button 2'
            }
        ];
        const buttonsMessage = new Buttons("Body text", buttons, "Title text", "Footer text");
        
        const loc = new Location(26.345784,50.191103, "Al falak center");
        await client.sendMessage(message.from, loc);

        await client.sendMessage(message.from, buttonsMessage);

        console.log("done");

    } else {
        client.sendMessage(message.from, 'Sorry, can answer text messages only so far.');
    }
});

async function transcribeAudio() {
    console.log('Transcribing audio data...');
    const recognizer = new cld3.LanguageRecognizer();
    const languageResult = recognizer.findLanguage(buffer);
    const language = languageResult.language;
    console.log(`Spoken language is: ${language}`)

    let model;
    if (language === 'ar') {
        model = new Model('path/to/arabic/model');
    } else if (language === 'en') {
        model = new Model('path/to/english/model');
    } else {
        console.error(`Unsupported language: ${language}`);
        return;
    }

    const speechRecognizer = new KaldiRecognizer(model, 16000);

    const audioFile = 'output.wav'; // Path to the audio file
    const audioBuffer = fs.readFileSync(audioFile);

    if (speechRecognizer.AcceptWaveform(audioBuffer)) {
        const result = speechRecognizer.Result();
        console.log(`Transcription: ${result.text}`);
    } else {
        const result = speechRecognizer.FinalResult();
        console.log(`Transcription: ${result.text}`);
    }
}

client.initialize();
