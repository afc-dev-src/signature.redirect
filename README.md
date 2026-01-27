# AFC SME Finance Inc. — Signature App (Transparent PNG)

Minimal signature capture app using **Signature Pad** (MIT), styled to AFC palette (white background, dark blue/red details), with a **Return to Form** button.

## Features
- Transparent PNG export (no background)
- Undo / Clear controls
- Centered brand header
- **Return to Form** button + optional post-download prompt
- Accepts `?form=<URL>` (or `?return=<URL>`) to dynamically set the return destination

## Deploy on GitHub Pages
1. Create a new public repo (e.g., `afc-signature-app`).
2. Upload these files to the repo root.
3. Go to **Settings → Pages**.
4. Under **Source**, pick the `main` branch and `/ (root)`. Save.
5. Site URL: `https://<username>.github.io/<repo>/`.

## Using with Microsoft Forms
- Add a **File upload** question and put your site link in the description.
- You can append your form URL to this page like:
  `https://<username>.github.io/<repo>/?form=https://forms.office.com/Pages/...`
- After the user taps **Save PNG**, the app offers to return to your form URL.

## Vendor (no CDN) Option
To avoid external dependencies, download the UMD bundle:
`https://cdn.jsdelivr.net/npm/signature_pad@5.1.3/dist/signature_pad.umd.min.js`
Save as `vendor/signature_pad.umd.min.js` and replace the CDN script tag in `index.html` with the local path.

## License
- This project includes the **MIT License** for Signature Pad (kept in `LICENSE`).
- Footer also shows a copy via a collapsible <details> block.

© 2026 AFC SME Finance Inc. All rights reserved.
