const puppeteer = require('puppeteer');
const { generateICS } = require('./ics-generator');
const fs = require('fs');
const path = require('path');
const { getBrowserPath } = require('./browser-finder');

async function startScraping(options, broadcast) {
    let browser = options.browser;
    try {
        broadcast({ title: 'Navigating to E-Bridge', message: 'Please log in to your account.', progress: 10, state: 'running' });
        
        if (!browser) {
            throw new Error("Browser instance not found.");
        }
        
        const pages = await browser.pages();
        const page = await browser.newPage();
        
        broadcast({ title: 'Navigating to E-Bridge', message: 'Please log in to your account.', progress: 20, state: 'running' });
        await page.goto('https://ebridge.xjtlu.edu.cn/');
        
        // Wait for user to login
        // Assuming after login, it goes to portal or home
        await page.waitForFunction(() => {
            return window.location.href.includes('portal') || document.querySelector('a[href*="Timetables"]');
        }, { timeout: 0 }); // Wait indefinitely for manual login
        
        broadcast({ title: 'Logged In', message: 'Extracting Academic Calendar...', progress: 40, state: 'running' });
        
        // Bring the Config UI tab back into focus so the user sees progress
        const allPages = await browser.pages();
        const configPage = allPages.find(p => p.url().includes('localhost') || p.url().includes('127.0.0.1'));
        if (configPage) await configPage.bringToFront();
        
        let weekDates = {};

        // Find the Academic Calendar link
        try {
            await page.waitForSelector('a', { timeout: 10000 });
            
            // Look for "Current academic year" link or similar
            const calendarUrls = await page.evaluate(() => {
                const anchors = Array.from(document.querySelectorAll('a'));
                return anchors
                    .filter(a => a.textContent.toLowerCase().includes('current academic year'))
                    .map(a => a.href);
            });
            
            if (calendarUrls.length > 0) {
                const calPage = await browser.newPage();
                await calPage.goto(calendarUrls[0]);
                if (configPage) await configPage.bringToFront(); // Force keep config UI in focus
                
                // Extract all week-to-date mappings
                const extractedMapping = await calPage.evaluate(() => {
                    const rows = Array.from(document.querySelectorAll('tr'));
                    let currentDate = null;
                    const mapping = {};
                    
                    for (let tr of rows) {
                        const text = tr.textContent.trim().replace(/\s+/g, ' ');
                        const cells = Array.from(tr.querySelectorAll('td'));
                        
                        let rowDigits = [];
                        for (let td of cells) {
                            let val = parseInt(td.textContent.trim(), 10);
                            // Ensure only standalone days 1-31 are captured in the sequence
                            if (!isNaN(val) && val > 0 && val <= 31 && td.textContent.trim().length <= 2) {
                                rowDigits.push(val);
                            }
                        }
                        
                        // A teaching week row always has at least 7 valid day columns mapping to Mon-Sun
                        if (rowDigits.length >= 7) {
                            // Find the first month/year to seed the continuous rolling currentDate
                            if (!currentDate) {
                                const monthYearMatch = tr.innerHTML.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s*<br[^>]*>\s*(\d{4})/i);
                                if (monthYearMatch) {
                                    const m = monthYearMatch[1];
                                    const y = monthYearMatch[2];
                                    const firstDay = rowDigits[0];
                                    currentDate = new Date(`${m} ${firstDay}, ${y} 00:00:00`);
                                }
                            }
                            
                            if (currentDate) {
                                const weekMatch = text.match(/Week\s+(\d+)/i);
                                if (weekMatch) {
                                    const weekNum = parseInt(weekMatch[1], 10);
                                    if (!mapping[weekNum]) mapping[weekNum] = [];
                                    
                                    const yyyy = currentDate.getFullYear();
                                    const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
                                    const dd = String(currentDate.getDate()).padStart(2, '0');
                                    mapping[weekNum].push(`${yyyy}-${mm}-${dd}T00:00:00`);
                                }
                                
                                // Advance by exactly 7 days to the next row's Monday
                                currentDate.setDate(currentDate.getDate() + 7);
                            }
                        }
                    }
                    return mapping;
                });
                
                await calPage.close();

                // Semester resolution: use the one requested by the user
                const chosenSemesterIndex = options.semesterIndex !== undefined ? options.semesterIndex : 0;
                
                // Flatten to a single mapping
                for (let w in extractedMapping) {
                    const dates = extractedMapping[w];
                    weekDates[w] = dates[chosenSemesterIndex] || dates[0];
                }
                
                global.weekDates = weekDates;
                console.log('Extracted week mapping for semester:', weekDates);
            }
        } catch (err) {
            console.log("Could not find or parse academic calendar: ", err);
        }

        broadcast({ title: 'Extracting Timetable', message: 'Navigating to personal timetable...', progress: 60, state: 'running' });
        
        // Wait for Timetables link
        await page.evaluate(() => {
            const anchors = Array.from(document.querySelectorAll('a'));
            const ttLink = anchors.find(a => a.textContent.includes('Timetables'));
            if (ttLink) ttLink.click();
        });

        await new Promise(r => setTimeout(r, 2000));
        
        await page.evaluate(() => {
            const anchors = Array.from(document.querySelectorAll('a'));
            const personalTT = anchors.find(a => a.textContent.includes('My Personal Class Timetable'));
            if (personalTT) personalTT.click();
        });
        
        broadcast({ title: 'Intercepting Data', message: 'Waiting for timetable JSON...', progress: 75, state: 'running' });

        // Intercept API calls to get JSON directly or extract from DOM
        // Wait for the JSON data or DOM to populate
        let timetableData = null;
        
        // We can hook into responses
        const client = await page.target().createCDPSession();
        await client.send('Network.enable');

        client.on('Network.responseReceived', async (event) => {
            try {
                const url = event.response.url;
                if (url.includes('ptapi/api/enrollment/hash') && url.includes('/activity')) {
                    const responseBody = await client.send('Network.getResponseBody', { requestId: event.requestId });
                    if (responseBody.body) {
                        try {
                            const parsed = JSON.parse(responseBody.body);
                            if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].weekPattern) {
                                timetableData = parsed;
                            }
                        } catch(e) {}
                    }
                }
            } catch(e) {}
        });

        // Fallback: throw error if extraction fails within 15 seconds
        let waited = 0;
        while (!timetableData && waited < 15000) {
            await new Promise(r => setTimeout(r, 1000));
            waited += 1000;
        }

        if (!timetableData) {
            throw new Error("Could not intercept timetable data. Please try again or check your E-Bridge connection.");
        }

        broadcast({ title: 'Generating ICS', message: 'Formatting your calendar...', progress: 90, state: 'running' });
        
        // Pass the explicit week dates mapping to the ICS generator
        options.weekDatesMapping = global.weekDates || {};
        
        const icsContent = generateICS(timetableData, options);
        
        // Save to memory instead of writing to disk which breaks when compiled with pkg
        global.generatedIcs = icsContent;

        broadcast({ 
            title: 'Complete', 
            message: 'Your calendar is ready to download.', 
            progress: 100, 
            state: 'complete',
            downloadUrl: '/api/download'
        });

        // Do not close the browser here so the user can keep it open
        // Wait briefly for the UI to catch up
        await new Promise(r => setTimeout(r, 1000));
        await page.close(); // Close only the scraping tab

    } catch (error) {
        console.error(error);
        throw error;
    }
}

module.exports = { startScraping };
