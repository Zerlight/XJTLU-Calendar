const os = require('os');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

function getBrowserPath() {
    const platform = os.platform();
    let paths = [];

    if (platform === 'darwin') {
        paths = [
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
            '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
        ];
    } else if (platform === 'win32') {
        const localAppData = process.env.LOCALAPPDATA || '';
        const programFiles = process.env.PROGRAMFILES || '';
        const programFilesX86 = process.env['PROGRAMFILES(X86)'] || '';
        paths = [
            path.join(programFiles, 'Google/Chrome/Application/chrome.exe'),
            path.join(programFilesX86, 'Google/Chrome/Application/chrome.exe'),
            path.join(localAppData, 'Google/Chrome/Application/chrome.exe'),
            path.join(programFilesX86, 'Microsoft/Edge/Application/msedge.exe'),
            path.join(programFiles, 'Microsoft/Edge/Application/msedge.exe'),
        ];
    } else if (platform === 'linux') {
        paths = [
            '/usr/bin/google-chrome',
            '/usr/bin/google-chrome-stable',
            '/usr/bin/chromium-browser',
            '/usr/bin/chromium',
            '/usr/bin/microsoft-edge',
            '/usr/bin/microsoft-edge-stable'
        ];
    }

    for (const p of paths) {
        if (fs.existsSync(p)) {
            return p;
        }
    }

    // Try to use Puppeteer's default downloaded browser path
    try {
        return puppeteer.executablePath();
    } catch (e) {
        return null;
    }
}

module.exports = { getBrowserPath };
