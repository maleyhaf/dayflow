# DayFlow

A personal planner and schedule builder I built because I wanted something that actually felt like mine. Think of those weekly planner notebooks you can buy at Indigo but digital, faster, and connected to your Google Calendar. Week view, month view, drag and drop, full event editing right in a popup modal, subtasks, categories, color themes -- all of it.

## What it does

You get a full calendar that you can flip between week and month view. Every empty slot is clickable and opens a create modal right there. Every existing event is also clickable and opens the same modal fully editable -- no separate edit page, no extra clicks, just everything in one place.

Events are draggable. In week view you can grab an event and drag it to a different time or day, it snaps to 15 minute intervals and shows a live ghost chip on your cursor with the updated time as you drag. In month view dragging moves the event to a different day and keeps the time.

Google Calendar is wired in through the Anthropic MCP connector. Your GCal events pull in automatically on load and you can push new DayFlow events back to GCal with a checkbox when creating them.

## Features

- Week and month calendar views with keyboard navigation
- Click any slot to create an event at that time
- Click any event to edit it instantly in the same modal
- Drag and drop rescheduling with 15 min snap and live time preview on the ghost
- Event colors, categories, notes, subtasks with checkboxes
- Mark events complete with a strikethrough
- Category filtering from the sidebar
- 4 color palette presets plus custom hex accent input
- Dark mode
- Mini calendar in the sidebar that dots days with events
- All events and categories persist in localStorage
- Google Calendar two way sync via Anthropic MCP

## Tech

Built with Create React App and TypeScript. No component libraries, no date libraries, just React with useReducer for state, CSS Modules for styling, and the HTML5 drag and drop API for the dragging. Date math is all custom in a single utils file. Google Calendar sync goes through the Anthropic API with the Google Calendar MCP server attached.

## Running it

```bash
npm install
npm start
```

Needs Node 16+. Opens on localhost:3000.

## Project structure

```
src/
  components/
    calendar/     # WeekView, MonthView, CalendarHeader, EventChip
    events/       # EventModal
    layout/       # TopNav, Sidebar
  context/        # AppContext with useReducer state + localStorage persistence
  hooks/          # useDragEvent
  types/          # shared TypeScript types
  utils/          # dateUtils (all date math in one place)
  styles/         # globals.css with CSS custom properties for theming
```

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| N | New event |
| T | Jump to today |
| Left / Right arrow | Previous / next week or month |
| Esc | Close modal |