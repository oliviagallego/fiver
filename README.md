# Fed for a Fiver

**Under a fiver, near you.** Tell the rat what you fancy and it finds food under £5, open right now, at the price *you* pay with the student cards and apps you already have.

**Try it:** [fedforafiver.com](https://fedforafiver.com) · Instagram [@fedforafiver](https://instagram.com/fedforafiver)

Built for the Claude Campus Hackathon (UCL Entrepreneurs × Claude Builder Club UCL, track *Better Student Life*), 12–16 October 2026.

## The problem

Many students skip meals to save money, while the discounts they already have (UNiDAYS, Student Beans, TOTUM, university food apps, chain apps) go unused at the till.

- 63% of the 1,419 students in Save the Student's National Student Money Survey 2026 skip meals at least some of the time to save money (a voluntary online survey, not official statistics).
- Among our first testers, 8 of 10 responses said they forget a discount they already have "often" or "every single time", and nobody said "never" (10 responses, 15 October 2026; small and not representative).

## What it does

- **Where, what, how much:** your location, a campus building or any London address; hot food, a supermarket deal, hot drinks, snacks, drinks or free food; a budget and a walking time, now or any day this week.
- **Your price, not the menu price:** tick the cards and apps you have. Fed for a Fiver never logs in to them; it works out what each one unlocks nearby and tells you what to show at the till.
- **Several things at once:** a burger, fries and a drink? It finds one place for all of them, with the total.
- **Type or say it:** everyday phrases ("I could murder a bacon butty", "quiero un café") are understood on the phone, even offline.
- **A map students keep alive:** snap a menu and Claude reads the items and prices; everyone nearby sees it, with who added it and when it was last checked.
- **Also:** free food from campus events, closing-time deals, and student drinks for over-18s with an alcohol-free option first.

Ten London universities are built in: UCL, Imperial, King's, LSE, Queen Mary, City St George's, SOAS, Birkbeck, Goldsmiths and UAL.

## How it is built

- A single-page web app (PWA) hosted on GitHub Pages at fedforafiver.com, installable on any phone without an app store.
- **Claude:** built with Claude Opus 5.5 in Claude Code. Inside the app, Claude Haiku 5.5 reads menu photos for every user through a server function, and explains picks and handles unusual phrases on phones with Claude switched on.
- **Google Places** for search, opening hours and nearby places, with **Photon** (OpenStreetMap) as a fallback.
- **MapLibre** with **OpenFreeMap** tiles for the map.
- **Supabase** for the shared menus (row-level security: anyone can read and add, nobody can edit or delete someone else's) and for the server function that keeps the Claude key off the app.

## Privacy and safety

- No accounts and no passwords. Name, cards and diet stay on your phone; "Forget me" wipes them.
- Your location is never stored on a server. Menu photos are never stored.
- No secret keys in this repository. The Google key is restricted to the app's own web addresses.
- Every price shows where it comes from. Allergens are never "safe": always "likely", plus "ask staff".

## What is in this repository

| File | What it is |
|---|---|
| `index.html` | The whole app, built into one file |
| `sw.js` | Service worker (offline cache and updates) |
| `manifest.webmanifest`, icons | Lets the app be added to the home screen |
| `CNAME` | Points GitHub Pages to fedforafiver.com |
| `og-image.png` | Preview image for links |
| `fiver-src.zip` | Snapshot of the source code from 14 October 2026 (an earlier version) |

## Credits

Made by Olivia Gallego Toscano (UCL). Fonts: Josefin Sans and Instrument Serif (SIL Open Font License). Map data © OpenStreetMap contributors. Survey figures: Save the Student, National Student Money Survey 2026.

© 2026 Olivia Gallego Toscano. All rights reserved.
