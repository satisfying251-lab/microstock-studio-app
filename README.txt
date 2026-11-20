MICROSTOCK STUDIO V3.2 — MENU & AI LOADING FIX

TARGET
- Android 11, including OPPO F11 Pro.
- Static PWA hosted on GitHub Pages.
- No paid API is bundled. Gemini cloud mode requires the user's own API key.
- This release fixes a startup issue that could prevent every menu from working when the optional Transformers.js CDN import failed.

INSTALL / UPDATE
1. Extract this ZIP.
2. Upload the five files inside this folder to the ROOT of the existing GitHub repository, replacing the old files:
   index.html
   app.js
   manifest.webmanifest
   sw.js
   README.txt
3. Commit/push the changes and wait for GitHub Pages to finish deploying.
4. Open the GitHub Pages site in Chrome Android and refresh.
5. If the old version is still shown, close the installed PWA and reopen the website in Chrome. The service worker cache name has changed to V3.2.
6. If needed, use Chrome > Site settings > Storage > Clear only the site's cached data. Be aware that clearing site data can also erase locally saved metadata. Export CSV/JSON first.

MENU FUNCTIONS
- Batch Analyzer: select multiple images, inspect thumbnails, choose an analysis mode, run analysis, stop processing.
- Hasil Metadata: edit title, description, keywords, category; export CSV/JSON; copy keywords; clear saved metadata.
- Strategi Stock: save research notes, calculate a seasonal upload window, create variation ideas, track weekly target.
- Keyword Database: save manual keyword research for Image/Vector/Video, filter by type, export CSV, clear database.
- AI Studio: build and copy a microstock prompt; open third-party public image/video generator sites.
- Mesin AI: explain local/cloud processing and clear the Gemini key from the current page session.

UPLOAD
- Supports JPG/JPEG and PNG in the file picker; multiple files up to 100 per selection.
- The app checks image signature/extension and asks the browser to decode each image before showing it.
- If an Android Gallery provider returns an unusual file object or unsupported encoding, that specific image may still fail. Test with one ordinary JPG and one ordinary PNG first.

IMPORTANT AI LIMITATIONS
- Navigation and non-AI menus no longer depend on the external Transformers.js CDN.
- Local captioning loads Transformers.js and its model only when the user starts local/hybrid analysis. It requires internet and may use substantial RAM, storage cache, battery and data.
- Local captioning is a lightweight caption draft, not a full visual-language model. It does not reliably produce 49 semantic keywords.
- Gemini cloud analysis requires a user-provided API key. Availability, model names and free quota can change. When cloud mode is used, selected images are sent to Google.
- Hybrid mode without a Gemini key uses local captioning and a filename-based fallback if the model cannot load. Review the output; it is not equivalent to full AI image understanding.
- AI Studio does not host an image/video generation engine. It creates prompts and links to external public demos. Free queues and access are not guaranteed.
- GitHub Pages is static hosting and does not provide a private GPU or backend.
- The app stores metadata locally in the browser; it does not store original image files. Browser/site data clearing may erase local records.

TESTS PERFORMED FOR THIS PACKAGE
- JavaScript syntax check: passed with Node.js.
- All six navigation tab IDs exist in the HTML.
- Every direct app.js element-ID reference was checked against the HTML; no missing IDs found.
- These are static code checks, not a live test on the user's OPPO device or on their GitHub Pages deployment.
