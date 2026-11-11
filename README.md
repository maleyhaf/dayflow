<p align="center"><img src="dayflow-react/public/logo.svg" width="280" alt="DayFlow" /></p>

# DayFlow 🗓

A calendar built around how my days actually go: classes, gym, work, and the small stuff in between.

## Why I made this

I was juggling school, the gym and work across three different apps, and none of them let me see a day as one thing. Calendars were good at *when* and bad at *what I needed to do*.

The calendar apps available already either did not let me have the level of organization I wanted or were too complicated to be used as a quick daily tool. I wanted this calendar to allow the personalization and organization you would get from a physical weekly planner book, with the mobility and efficiency of a web app.

I wanted one place where an event isn't just a time block. It has its own notes, its own to-do list, and a color and category that tell me at a glance what kind of day I'm having.

## What it does so far

- **Sign in with Google** and your calendar follows you to any device. You stay signed in, and everything is saved to your own account
- **Week and month views** that I can click through and drag events around in
- **Categories** with their own colors and icons (School, Gym, Work, Personal…)
- **Notes and subtasks on every event**, so "Assignment 3" can carry its own checklist
- **Daily notes**: click any date to jot down how the day went
- **Repeating events** where each occurrence keeps its own notes and checklist, so my Monday run isn't tied to my Friday run
- **Themes and dark mode**, because I look at this a lot & it's psychologically proven to lighten your mood looking at something you find pleasing. For example, I love making everything baby pink because it's my favorite color
- **Private by design**: each person only ever sees their own events and notes (see the [Privacy Policy](/privacy) and [Terms](/terms) pages in the app)

## Where I'm at

This started as a quick project build and it's grown a lot since.

Recently I spent a good while fixing how repeating events work. Editing one occurrence used to change all of them, and now you choose between "this event" and "all events". It was one of those bugs that taught me a lot about how calendars actually work under the hood.

After that, the app grew up a bit: it moved from saving things in my own browser to real accounts with Google sign-in, so the calendar is permanent and works across devices. It also got its own logo, plus privacy and terms pages so it's ready to be shared with other people.

**Up next:**
- [x] User accounts set up with Google
- [ ] Publish it publicly (custom domain and Google's app verification)
- [ ] Finish Google Calendar sync
- [ ] A List view of events/tasks along with the Week & Month view

## What I've learned

It can take a lot of patience, even when working with LLM models, to build very specific projects. This calendar app, overall, is very straightforward and nothing new. It's how I wanted the details of it (the subtasks & notes for every event, the notes & subtasks for daily notes, the color theme personalization) that took the longest to figure out and to get working. Building this project with the help of AI did speed up the code process itself. However, the design & usability details being personalized to cater to me taught me a lot of patience.

## Running it yourself

Built with React and Supabase.

```
npm install
```

Then set up sign-in and the database (about 15 minutes, once) by following [`SETUP_SUPABASE.md`](dayflow-react/SETUP_SUPABASE.md). It ends with copying `.env.example` to `.env.local` and filling in your two keys. After that:

```
npm start
```

---

*Made by Maleyha Fatima. Ontario, CA.*