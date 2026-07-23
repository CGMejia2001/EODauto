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
## TODO

- [ ] Improve the header design and overall visual hierarchy.
- [ ] Add **Backup to JSON** functionality for EOD reports.
- [ ] Add **Restore from JSON** functionality for previously backed-up reports.
- [ ] Improve the mobile UI layout and responsiveness across different screen sizes.
- [ ] *(Tentative)* Add a calendar view to browse EOD reports over time.
- [ ] *(Tentative)* Add compatibility with automation scripts.

## Future Roadmap

- Migrate from browser local storage to a database for improved data persistence and reliability.
- Add filtering and search for historical reports.
- Generate productivity dashboards and/or analytics.
- Support recurring activities and reusable templates.
- Continue enhancing the application with new features and UI/UX improvements.
