# SAIS AI Lab

Website for **SAIS AI Lab** — a student-led initiative at Stamford American International School
that works alongside existing clubs and students to help them use AI tools effectively,
responsibly, and creatively.

> Students helping students and clubs use AI to research, create, analyze, and solve real problems.

**Live site:** https://aidenqneary-lab.github.io/sais-ai-lab

## Guiding principle

> We teach students how to use AI. We do not use AI to do students' work for them.

## Pages

| Page | Description |
| --- | --- |
| `index.html` | Scroll-driven hero animation, Mission, What We Offer, Responsible AI Pledge |
| `register.html` | Registration form with validation and on-page confirmation |
| `team.html` | Executive team grid |

## Running it locally

No build step, no dependencies — open `index.html` in a browser.

To serve it over HTTP instead (some browsers are stricter about local files):

```
python3 -m http.server 8000
```

Then visit http://localhost:8000

## Replacing the placeholders

Every placeholder is marked with a comment saying exactly what to swap in. Find them all with:

```
grep -rn "PLACEHOLDER" *.html
```

- **Club and school logos** — navbar and footer of all three pages
- **Team names and photos** — `team.html`

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
