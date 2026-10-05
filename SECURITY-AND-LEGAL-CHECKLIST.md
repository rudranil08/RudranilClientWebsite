# Security and legal checklist for Rudranil's projects

Written 5 Oct 2026. I'm an AI assistant, not a lawyer or a security auditor. Treat the legal pages as a solid starting template and have someone qualified review them (especially the refund and liability wording) before you rely on them.

---
## A. Your 11 security items, against the client website

The client site is a **static site**: no server, no database, no logins, no API. That means several items on the list have nothing to attach to. Faking them would add risk, not remove it.

| Item | Status | What I did |
|---|---|---|
| Hide API keys | Done (nothing to hide) | The site has no API keys. WhatsApp number and email are public by design. |
| Authentication | Not applicable | No accounts or logins exist, so there is nothing to authenticate. |
| Environment variables | Not applicable | None used. See section B for your other repos, where they matter. |
| Protect admin routes | Not applicable | There is no admin area. Don't add one to this site. |
| Sanitize forms | Done | Control characters stripped, lengths capped (HTML `maxlength` and JS), dropdown values checked against allow-lists, output URL-encoded. The form stores and sends nothing to a server. |
| Protect against XSS | Done | Removed every `innerHTML`. All text goes in via `textContent`. All inline scripts and `style=""` removed. Strict CSP blocks any injected script. I tested `<img onerror>` and `<script>` payloads in the form: nothing ran. |
| Check user access | Not applicable | No users. |
| Rate limiting | Partly | Nothing to rate-limit server-side. Submit button locks for 4 seconds after sending. Vercel also provides DDoS protection and firewall rules in its dashboard (check what your plan includes). |
| Secure API endpoints | Not applicable | The site has none. `connect-src 'none'` in the CSP means the page can't call any API even if something tried. |
| Check CORS | Done | No cross-origin requests. `Cross-Origin-Resource-Policy: same-origin` and `Cross-Origin-Opener-Policy: same-origin` set. |
| Security headers | Done | `vercel.json`: CSP (default-src 'none'), HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, COOP, CORP. Verified on a local server that applies the same headers: no CSP violations on any page. |

Other hardening: Google Fonts removed (fonts self-hosted, so no visitor data leaves your site), all external links use `rel="noopener noreferrer"`, `security.txt` added.

**Honest limits:** your phone number and email are on the page, so expect some spam. That's the cost of being contactable. If it gets bad, switch to a WhatsApp Business profile with auto-replies and block spammers.

---
## B. Real problems I found in your GitHub repos (public)

I cloned your 7 public repos and scanned files and full git history for keys and secrets.

### 1. FIX FIRST: `CODING.VSC`, weather app has a real-looking API key committed
`weatherapp.html/getWeather.js` line 2 has a 32-character OpenWeatherMap key in plain text, in a public repo.
- **Do now:** log in to OpenWeatherMap, generate a new key, delete the old one. Deleting the line from the file is not enough because it stays in git history; rotating the key is the fix.
- Browser-only apps can never keep a key secret. If you want to keep the app public, put the call behind a small Vercel serverless function that holds the key as an environment variable.

### 2. `TripwiseAi`: no key committed, but one slip away
`Services/Config.swift` is tracked and contains `"PASTE YOUR API KEY HERE"`. The moment you paste a real key and commit, it's public. Also the repo's `.gitignore` has no secrets rules.
```bash
echo "Services/Config.swift" >> .gitignore
git mv Services/Config.swift Services/Config.example.swift   # commit the template
git rm --cached Services/Config.swift 2>/dev/null
# then create your own local Config.swift copy with the real key (now ignored)
```
Note: any key shipped inside an iOS app can be extracted. Fine for a demo; before a real App Store release, call Gemini through your own backend.

### 3. `RExchange`: key handling is good, endpoints are unprotected
Good: key read from `process.env` on the server only, `.env` is git-ignored, only `.env.example` is committed, nothing leaked in history.

Problems (they matter because each request spends your Gemini quota):
- `/api/ai/parse` and `/api/ai/match` have **no authentication and no rate limiting**. Anyone who finds the URL can call them in a loop.
- `/api/ai/match` **does not validate input**. It casts the body to `Listing[]` and accepts an array of any size.
- `next.config.ts` has no security headers.
- Key is sent in the URL (`?key=`), which can end up in logs.
- I found no real authentication in the code (the login page has no auth logic), so there is also no user-access check yet. Fine for a hackathon demo, not for production.

Fixes:
```ts
// next.config.ts
import type { NextConfig } from "next";
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];
const nextConfig: NextConfig = {
  async headers() { return [{ source: "/(.*)", headers: securityHeaders }]; },
};
export default nextConfig;
```
```ts
// app/api/ai/match/route.ts: validate like /parse already does, and cap sizes
const MatchInput = z.union([
  z.object({ listingA: ListingSchema, listingB: ListingSchema }),
  z.object({ currentListing: ListingSchema, candidateListings: z.array(ListingSchema).max(50) }),
]);
const parsed = MatchInput.safeParse(body);
if (!parsed.success) return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
```
```ts
// rate limiting on both routes (Upstash has a free tier; works on serverless)
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
const limiter = new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(10, "1 m") });
const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "anon";
if (!(await limiter.limit(ip)).success)
  return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
```
```ts
// send the key in a header, not the URL
fetch(endpointWithoutKey, { headers: { "x-goog-api-key": GEMINI_API_KEY, "Content-Type": "application/json" }, ... })
```
Also: set a **daily quota or budget cap** on the Gemini key in Google AI Studio / Cloud console, and once real login exists, check the user's session at the top of each route and return 401 if missing.

### Clean repos
`Roamly`, `qr-design-gdc`, `qatar1b_transit_analysis` and the portfolio repo had no secrets in files or history. `qr-design-gdc` has a good `.gitignore`.

---
## C. The "20 things" list, applied to the client website

| # | Item | Status |
|---|---|---|
| 1 | Privacy policy | Added (`privacy.html`) |
| 2 | Terms of service | Added (`terms.html`) |
| 3 | Refund policy | Added, inside `terms.html`. **These are my suggested defaults. Change them to what you're willing to honour.** |
| 4 | Cookie policy | Added as a section in `privacy.html`: the site sets no cookies |
| 5 | Cookie consent banner | Not needed: no cookies, no analytics, no third-party scripts. Add one only if you later add analytics. |
| 6 | Check form consents | Added a required consent checkbox linking to the privacy notice |
| 7 | No unnecessary data | Form asks only name, business (optional), type, need, note. Nothing is stored. |
| 8 | Audit third-party SDKs | None left. Removed Google Fonts (self-hosted now). |
| 9 | Remove dark patterns | None found. Added a Pause button on the auto-rotating demo (also an accessibility rule). |
| 10 | Remove hidden fees | Prices say "from", final price in writing first, domain/hosting costs listed as separate on the page and in terms |
| 11 | Remove fake reviews | **Found and fixed:** the demo phones showed made-up "4.8 on Google" ratings. Replaced with a generic "Your Google reviews" label. No testimonials on the site. |
| 12 | Remove unsupported claims | Softened "live in 5 days" to "usually", "reply the same day" to "aim to reply within a day", and "load quickly" to "built to load quickly". |
| 13 | Alt text | No photos on the site. Decorative SVGs are hidden from screen readers. |
| 14 | Colour contrast | Checked with axe-core (automated): no violations. |
| 15 | Keyboard navigation | Skip link added, visible focus outlines, all controls reachable by keyboard. axe-core passes on all 3 pages. |
| 16 | Business details | Name, city, phone and email in every page footer. Add a GSTIN here if you ever register for GST. |
| 17 | Age consent for kids' data | Statement in privacy page: site is for adults and business owners, no children's data collected |
| 18 | Unsubscribe link in emails | Applies to your **cold outreach**, not the website. Put this at the bottom of every message (see below). |
| 19 | License fonts/images | Both fonts are SIL OFL (free for commercial use), licence files are in `/fonts`. No stock photos used; all graphics are hand-drawn SVG. |
| 20 | Data deletion request | Process described in privacy page (email "Delete my data", done within 30 days). **Only promise this if you'll actually do it.** |

**Footer for outreach emails and WhatsApp intros:**
> I found your business details on Google Maps. This is a one-time message. Reply STOP and I won't contact you again. Rudranil Dhol, freelance web developer, Chennai. rudranildhol@gmail.com

---
## D. Things only you can do
1. Rotate the OpenWeatherMap key (B1).
2. Turn on two-factor authentication for GitHub, Vercel and your Gmail. Stolen accounts are a far more likely attack than anything on this static site.
3. After deploying, check your live URL at securityheaders.com and observatory.mozilla.org.
4. Read `privacy.html` and `terms.html` line by line and edit anything that isn't true for you (for example how long you keep messages, the 14-day free fix period, and the refund rules).
5. Have a lawyer or an experienced freelancer look over the legal pages once. Laws on data and consumer protection in India are evolving (including the Digital Personal Data Protection Act, 2023), and I can't guarantee these pages meet every requirement.
