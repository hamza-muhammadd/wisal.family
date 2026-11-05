# Plain text style: no dashes, hyphens or stars in what people read

What was changed (build sw v136) and what was deliberately left alone.

**Changed (everything a person reads in the app)**
- Page text, tab names, placeholders, tooltips, button labels, empty states, messages: em and en dashes became commas, full stops, "to" for ranges, or a middle dot where a value is empty. Hyphenated words lost their hyphen ("check in", "self care", "subtask", "popup", "ten second").
- `index.html`, `privacy.html`, `pricing.html`, the welcome email and its subject, and the text of the Edge Functions.
- Negative money now uses a true minus sign (U+2212) in front of the amount, because removing the sign would change the meaning.
- AI replies, AI documents and the onboarding plan are cleaned on arrival (`aiClean` in `app.js`), and both AI prompts now ask the model to write plain sentences. Code, links and emails inside a reply are not touched.

**Left alone on purpose**
- Code: CSS names, `data-*` attributes, ids, keys, dates stored as 2026-11-03, URLs, HTTP header names. Changing them would break the app.
- Text people type themselves (names, notes, titles) is shown exactly as typed.
- Real place names in `world.js` and `places.js` (for example Guinea-Bissau, Timor-Leste) because the map matches places by name.
- Comments and the files in `docs/` and `Records/`, which are notes, not the app. They are visible on GitHub because the repo is public.

**How it was checked**
- A JavaScript parser separated text from code, so only text was edited; a token level comparison confirms only 6 places of real code changed (the AI cleaner and the places that call it).
- The real app was opened in a simulated browser and every page (20) and tab (75) scanned. Before the change that scan found 21 visible dashes or hyphens; after it finds 0.
- Not covered: text that only appears when real data is present (for example a long streak label) is covered by the text scan of the source, not by the screen scan.
