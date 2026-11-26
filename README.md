# Casa Mika · QR menu and table ordering

Open-source QR ordering for Casa Mika (37 Trần Bạch Đằng, Đà Nẵng). Made by Alexey and Dmitry as a gift to the café.

- **Guests** scan the QR on their table, browse the menu in Vietnamese, English, Russian or Korean, order and call the staff (waiter, napkins, water, bill and more). Payment stays with the waiter.
- **Staff** see orders and requests live on a tablet: `/#bar`, PIN protected, Vietnamese or English.
- **Manager** edits prices, availability, texts in 4 languages and photos: `/#admin`, separate 6-digit PIN.

Live: https://shabolkin1.github.io/casa-mika-menu/#table-1

## How it works

A static web app (HTML, CSS, JavaScript, no build step) hosted on GitHub Pages, with a Supabase (PostgreSQL) database for orders, requests, the sold-out list and the manager's menu edits. Changes reach every screen in real time.

| File | What it is |
|---|---|
| `index.html`, `app.js`, `app.css` | the guest page and the staff screen |
| `admin.js` | the manager screen, loaded only on `/#admin` |
| `i18n.js` | interface texts in 4 languages |
| `menu.json` | the menu: 297 items, prices, translations, stories |
| `img/` | photos |
| `config.js` | Supabase address and public key |
| `supabase.sql`, `admin.sql` | database setup, run once in the Supabase SQL editor |

## Security

- Guests can only add orders and requests and read the last 24 hours. They cannot change or delete anything (row-level security).
- Every staff and manager action goes through database functions that check the PIN. PINs are stored as bcrypt hashes, never in the code.
- Flood guard: at most 20 orders and 30 requests per table in 10 minutes. Order status and time are always set by the server.
- The key in `config.js` is the public "publishable" key, safe in a browser by design. No guest personal data is collected.

## Run your own copy

1. Create a free Supabase project, run `supabase.sql`, then `admin.sql` (change the PINs at the bottom first).
2. Put the project URL and publishable key into `config.js`.
3. Publish the folder with GitHub Pages or any static hosting.

Licence: MIT (see `LICENSE`). Menu photos, the Casa Mika name and logo belong to Casa Mika.
