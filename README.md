# EOD Task Tracker

A simple, lightweight task tracker for documenting daily bootcamp and training activities.

## Features

- Add Activities - Record training, meetings, and deployments with time slots
- Time Validation - Prevents overlapping time slots
- Activity Stats - Count of each activity type
- Local Storage - Data persists in your browser
- Export Options - Download or copy your EOD report
- Responsive Design - Works on desktop, tablet, and mobile
- Dark and Light Themes - Toggle between Dracula and Alucard color schemes
- Activity Management - Edit and delete activities with ease
- Toast Notifications - User-friendly feedback on all actions

## How to Use

1. Select Date - Choose the date (defaults to today)
2. Enter Time Range - Set start and end times
3. Choose Activity Type - Training, Meeting, or Deployment
4. Add Description - What did you do?
5. View and Export - See your activities, export as text, or copy to clipboard

## Activity Format

The app generates reports in this format:
```
EOD REPORT - Mon, Jul 17, 2026
8:30 AM - 9:30 AM | Training: Bootcamp module lesson
10:30 AM - 11:30 AM | Meeting: Team standup
9:30 AM - 10:30 AM | Deployment: Project deployment

```

## Automation

The EOD automation automatically fills supported fields in the Microsoft Forms EOD report using a Tampermonkey userscript.

> **Acknowledgement:** This automation was inspired by the work of **Vic** and their EODAuto fork: https://github.com/victorjosefcaro/EODauto

> **Note:** File uploads cannot be automated and must be uploaded manually before submitting the form.

### 1. Install Tampermonkey

1. Visit https://www.tampermonkey.net/.
2. Install the extension for your browser (Chrome, Edge, or Firefox).
3. Restart your browser if prompted.

### 2. Install the Automation Script

1. Open the **Tampermonkey Dashboard**.
2. Select **Create a new script** (or **Install from File...** if using the provided `tampermonkey.js` file).
3. Replace the default template with the contents of `tampermonkey.js`.
4. Save the script (**Ctrl + S**).
5. Ensure the script is **Enabled**.

### 3. Configure the Tracker

Open **Settings** in the EOD Task Tracker and complete the required automation settings:

- Employee ID
- Attendance Status
- Default Ratings
- Default Answers

### 4. Submit Your EOD

1. Complete your activities in the tracker.
2. Click **Submit Today's EOD**.
3. Microsoft Forms will open and automatically populate supported fields.
4. Upload the required screenshot manually.
5. Review the generated responses and click **Submit**.

### Troubleshooting

- Ensure **Tampermonkey** is installed and enabled.
- Verify the **Tampermonkey.js** userscript is enabled.
- Refresh Microsoft Forms if the automation does not start.
- Update the userscript if a newer version is available.

## TODO

[✔] Improve the header design and overall visual hierarchy. \
[✔] Add **Backup to JSON** functionality for EOD reports. \
[✔] Add **Restore from JSON** functionality for previously backed-up reports. 
- [ ] Improve the mobile UI layout and responsiveness across different screen sizes.
- [ ] *(Tentative)* Add a calendar view to browse EOD reports over time.
- [ ] Fix: Opening the EOD Form always trigger the script
[✔] Add compatibility with automation scripts.

## Future Roadmap

- Migrate from browser local storage to a database for improved data persistence and reliability.
- Add filtering and search for historical reports.
- Generate productivity dashboards and/or analytics.
- Support recurring activities and reusable templates.
- Continue enhancing the application with new features and UI/UX improvements.
