# XJTLU Calendar Exporter

An automated, privacy-first tool for XJTLU students to extract their personal Lesson Timetables from the E-Bridge system and convert them into standard `.ics` calendar files. These files can be easily imported into Apple Calendar, Google Calendar, Outlook, and other major calendar applications.

The tool parses the official University Academic Calendar to precisely calculate the exact dates for each teaching week, handling holidays, reading weeks, and month wrap-arounds perfectly.

## Features

- **Automated Extraction:** Automatically navigates your E-Bridge timetable via Google Chrome/Chromium using Puppeteer.
- **Accurate Date Mapping:** Directly parses the live XJTLU Academic Calendar to generate exact ISO dates for each week, avoiding hardcoded offsets. 
- **Semester Support:** Select exactly which Academic Semester you wish to export.
- **Customizable Event Information:** Personalize how your events show up on your calendar using template variables (`${name}`, `${activityType}`, `${moduleId}`, `${staff}`, `${location}`, `${week}`).
- **Custom Reminders:** Set your preferred alert time for classes (e.g., 15 minutes before the start).
- **Privacy First:** Your authentication happens entirely within your local browser instance. No credentials or schedule data are stored on any external server. 
- **Modern UI:** A clean, Shadcn-inspired configuration dashboard.

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v16.x or newer is recommended)
- [pnpm](https://pnpm.io/) (or `npm` / `yarn`)
- Google Chrome installed on your machine (the tool will automatically look for it in standard OS locations).

### Setup

1. **Clone the repository** (or download the source code):
   ```bash
   git clone <repository_url>
   cd XJTLU-Calendar
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```
   *(If you don't use pnpm, you can use `npm install`)*

## Usage

1. **Start the application:**
   ```bash
   pnpm start
   ```
   *(or `npm start`)*

2. **Open the Configuration Dashboard:**
   A local server will start, usually at `http://localhost:3000`. The tool should automatically launch a Chrome instance pointing to this page. If it doesn't, navigate there manually in your browser.

3. **Configure your calendar:**
   Fill out the template configurations for Titles, Locations, Descriptions, and Reminders. Use the "Preview" elements to see exactly how your events will look. Select your target **Semester**.

4. **Connect to E-Bridge:**
   Click **"Continue"** to read the instructions, and then click **"Launch & Connect E-Bridge"**.

5. **Login:**
   A new browser tab will launch taking you to the E-Bridge portal. Log into your account as you normally would. **Do not close the browser or click around excessively.**

6. **Wait for Extraction:**
   Once you are logged in, switch your focus back to the Configuration Dashboard tab to view the progress. The script will navigate the academic calendar and your personal timetable invisibly in the background.

7. **Download your Calendar:**
   Once complete, a download button will appear. Save your `xjtlu-calendar.ics` file and import it into your preferred calendar app!

## License

This project is open-sourced under the MIT License. See the [LICENSE](LICENSE) file for more details. Use of this tool is entirely at your own risk.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
