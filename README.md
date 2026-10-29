# Osborne website

One-page website for Osborne: cybersecurity and brand protection for the AI era.

Plain HTML, CSS and JavaScript. No build step and no dependencies.

## Preview locally

```bash
python -m http.server 8766 --bind 127.0.0.1
```

Then open http://127.0.0.1:8766/ (or open `index.html` directly).

## Files

- `index.html`: content and structure
- `styles.css`: pastel-green design tokens, layout, responsive and reduced-motion rules
- `main.js`: hero signal field, before/now toggle, protection rings, local enquiry-brief builder
- `tools/verify.mjs`: content and safety checks (`node tools/verify.mjs`, `node tools/verify.mjs --control`)

## Status

- Published at https://osborneos.com via GitHub Pages.
- The enquiry builder only copies or downloads a text brief on the visitor's device. Nothing is sent. A real contact route still needs to be chosen and approved.
- Fonts load from Google Fonts (Libre Baskerville, IBM Plex Sans, IBM Plex Mono).
- Brand and IP protection are labelled as developing services. The site deliberately makes no claims about clients, certifications, metrics, round-the-clock cover or guaranteed outcomes.
