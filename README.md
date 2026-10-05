# Rudranil Dhol, client website

Static site: no build step, no server, no database.

## Files
- `index.html`, `privacy.html`, `terms.html`: the pages
- `styles.css`, `app.js`: styling and behaviour (kept separate so the security policy can block all inline code)
- `fonts/`: self-hosted fonts (SIL Open Font License, licence files included)
- `vercel.json`: security headers (CSP, HSTS, X-Frame-Options and more)
- `.well-known/security.txt`: where to report a security problem

## Deploy on Vercel
1. Put these files in a new GitHub repo (the files at the top level, not inside a subfolder).
2. In Vercel: Add New > Project > import the repo. Framework preset: **Other**. No build command, no output directory.
3. Deploy, then test the live URL at https://securityheaders.com and https://observatory.mozilla.org

## Editing
- Phone and email: `app.js` (CONFIG block at the top), and the plain-text copies in the footer of each page and in `privacy.html`.
- Prices: `index.html`, "Prices" section.
- If you edit `app.js` or `styles.css`, nothing else needs to change. Do NOT add inline `<script>` or `style="..."` to the HTML, the security policy will block it. Put it in the .js or .css file instead.
- `.well-known/security.txt` expires on 2027-10-05. Update the date each year.
