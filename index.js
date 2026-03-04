const express = require('express');
const path = require('path');
const puppeteer = require('puppeteer');
const { startScraping } = require('./scraper');
const { getBrowserPath } = require('./browser-finder');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// For Server-Sent Events (SSE)
let sseClients = [];

function broadcastStatus(statusObj) {
    sseClients.forEach(client => {
        client.res.write(`data: ${JSON.stringify(statusObj)}\n\n`);
    });
}

app.get('/api/status', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const clientId = Date.now();
    const newClient = { id: clientId, res };
    sseClients.push(newClient);

    req.on('close', () => {
        sseClients = sseClients.filter(c => c.id !== clientId);
    });
});

app.post('/api/start', async (req, res) => {
    const { semesterIndex, enableReminder, reminder, titleTemplate, locationTemplate, descTemplate } = req.body;
    
    // Respond immediately to the frontend, scraper will run asynchronously
    res.json({ status: 'started' });

    try {
        await startScraping({
            semesterIndex,
            enableReminder,
            reminderMinutes: reminder,
            titleTemplate,
            locationTemplate,
            descTemplate,
            browser: global.currentBrowser // newly saved ref
        }, broadcastStatus);
    } catch (error) {
        console.error("Scraping error:", error);
        broadcastStatus({
            title: 'Error',
            message: error.message || 'An unexpected error occurred.',
            progress: 100,
            state: 'error'
        });
    }
});

app.get('/api/download', (req, res) => {
    if (global.generatedIcs) {
        res.setHeader('Content-Type', 'text/calendar');
        res.setHeader('Content-Disposition', 'attachment; filename="xjtlu-calendar.ics"');
        res.send(global.generatedIcs);
    } else {
        res.status(404).send('Calendar file not found or not generated yet.');
    }
});

app.listen(PORT, async () => {
    console.log(`Config server listening on http://localhost:${PORT}`);
    
    console.log('Launching browser...');
    const browserArgs = { 
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    };
    
    const executablePath = getBrowserPath();
    if (executablePath) {
        browserArgs.executablePath = executablePath;
        console.log(`Using browser at: ${executablePath}`);
    }
    
    const browser = await puppeteer.launch(browserArgs);
    global.currentBrowser = browser; // Store the instance globally for api requests
    
    const pages = await browser.pages();
    const page = pages.length > 0 ? pages[0] : await browser.newPage();
    await page.goto(`http://localhost:${PORT}`);
});
