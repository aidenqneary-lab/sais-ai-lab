# AI Club

Website for **AI Club** — a student-led club at Stamford American International School.

> **Become an AI Native. With Purpose.**

**Live site:** https://aidenqneary-lab.github.io/sais-ai-lab

## Mission

To solve real-world problems within SAIS and the wider community using AI responsibly and
ethically as a tool to create positive impact.

## Purpose

To run student-led service projects that use AI tools to help the school and local organizations
solve everyday challenges, while building members' digital leadership skills along the way.

## Guiding principle

> We teach students how to use AI. We do not use AI to do students' work for them.

## Pages

| Page | Description |
| --- | --- |
| `index.html` | Scroll-driven hero animation, Mission, What We Do, Responsible AI Pledge |
| `lab.html` | The living record — upcoming sessions, projects, events, opportunities, past work |
| `team.html` | Executive team grid |
| `register.html` | Registration form with validation and on-page confirmation |

Navigation on every page: **Home · What We Do · Lab · Responsible AI · Team · Register**

## Running it locally

No build step, no dependencies — open `index.html` in a browser.

To serve it over HTTP instead (some browsers are stricter about local files):

```
python3 -m http.server 8000
```

Then visit http://localhost:8000

## Keeping the Lab page up to date

`lab.html` is the page that should change most often. It has five sections — Upcoming, Projects,
Events, Opportunities and Past — and the file contains a comment block explaining the pattern:

- Copy an `<article class="entry">` block to add an entry
- Delete a section's entries and leave the `<div class="lab-empty">` message when there is
  nothing to show
- Status pills: `<span class="tag live">` (happening now), `<span class="tag done">` (finished),
  or plain `<span class="tag">` for a neutral label

## Replacing the placeholders

Every placeholder is marked with a comment saying exactly what to swap in. Find them all with:

```
grep -rn "PLACEHOLDER" *.html
```

- **Club and school logos** — navbar and footer of all four pages
- **Team names and photos** — `team.html`
- **All Lab entries** — `lab.html`

## The hero animation

The hero is a scroll-driven frame sequence (`assets/frames/`, 104 JPEGs) that cross-fades into a
live, cursor-reactive neural network rendered on canvas. To regenerate the frames from a new
source video:

```
ffmpeg -i input.mp4 -t 5.2 -vf "fps=20,scale=1280:-2" -q:v 3 "assets/frames/frame_%04d.jpg"
```

If the frame count changes, update `TOTAL_FRAMES` in `assets/js/hero.js`.

## Built with

Plain HTML, CSS, and JavaScript — no frameworks, no build tools.
