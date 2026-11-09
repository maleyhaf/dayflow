# Dayflow 🗓

A calendar built around how my days actually go: classes, gym, work, and the small stuff in between.

## Why I made this

I was juggling school, the gym and work across three different apps, and none of them let me see a day as one thing. Calendars were good at *when* and bad at *what I needed to do*. 

The calender apps available already either did not let me have the level of organization I wanted or were too complicated to be used as a quick daily tool. I wanted this calender to allow the personalization and organization you would get from a physical weekly planner book, with the mobility and efficiency of a web app.

I wanted one place where an event isn't just a time block. It has its own notes, its own to-do list, and a color and category that tell me at a glance what kind of day I'm having.

## What it does so far

- **Week and month views** that I can click through and drag events around in
- **Categories** with their own colors and icons (School, Gym, Work, Personal…)
- **Notes and subtasks on every event**, so "Assignment 3" can carry its own checklist
- **Daily notes**: click any date to jot down how the day went
- **Repeating events** where each occurrence keeps its own notes and checklist, so my Monday run isn't tied to my Friday run
- **Themes and dark mode**, because I look at this a lot & it's psychologically proven to lighten your mood looking at something you find pleasing. For example, I love making everything baby pink because it's my favorite color
- Everything saves in my browser, so it's all still there when I come back

## Where I'm at

This started as quick project build and it's grown a lot since. 

Recently I spent a good while fixing how repeating events work. Editing one occurrence used to change all of them, and now you choose between "this event" and "all events". It was one of those bugs that taught me a lot about how calendars actually work under the hood.

**Up next:**
- [ ] User accounts set up with Google
- [ ] Finish Google Calendar sync
- [ ] a List view of events/tasks along with the Week & Month view

## What I've learned

It can take a lot of patience, even when working with LLM models, to build very specific projects. This calender app, overall, is very stright forward and nothing new. It's how I wanted the details of it (the subtasks & notes for every event, the notes & subtasks for daily notes, the color theme personalization) that look the longest to figure out and to get them working. Building this project with the help of AI did speed up the code procress itself. However, the design & usability details being personalized to cater me taught me a lot of patience.

## Running it yourself

```
npm install
npm start
```

---

*Made by Maleyha Fatima. Ontario, CA.*