# Changelog

All notable changes to LifeFlow AI will be documented in this file.

The format is based on Keep a Changelog.

---

## [2.0.0] - General User Release

### Added
- Real search across tasks, goals, habits, and planner items (Ctrl/Cmd+K)
- Undo action after deleting tasks/items
- Live, event-driven notification center (task completed, goal reached 100%,
  habit streak milestones, Pomodoro session end) — no longer static/demo data
- AI Assistant confirmed fully functional, including optional voice input
  (via browser speech recognition) and optional Gemini API key for smarter replies

### Changed
- Rebranded Settings page from a developer-portfolio config panel to a
  simple Profile / AI Assistant / Data Backup screen
- Replaced all developer-themed default/seed data (goals, habits, planner
  tasks, dashboard tasks, calendar events) with general, everyday examples
- Removed "Enterprise / Matrix / Telemetry / Architecture / Deliverable"
  style jargon from toasts, headings, labels, and placeholders app-wide
- App scripts now run as plain scripts instead of ES6 modules, so the app
  works correctly when index.html is opened directly (file://) without a
  local server

### Fixed
- Notification badge and dashboard greeting no longer flash incorrect
  placeholder values (hardcoded "3", "Architect", "94%") before real data
  loads
- Mobile responsive layout issues across calendar, modals, and dashboard

---

## [1.0.0] - Initial Release

### Added
- Initial production release
- AI-powered productivity dashboard
- Goal management system
- Habit tracker
- Daily planner
- Calendar module
- Analytics dashboard
- Pomodoro timer
- Settings management
- Dark & Light theme
- Responsive user interface
- Progressive Web App (PWA)
- Local data persistence

---

## Upcoming

Planned features for future releases:

- Cloud Synchronization
- User Authentication
- AI-generated Analytics Reports (beyond current rule-based insights)
- Google Calendar Integration
- Native Mobile Application (Android / iOS)
