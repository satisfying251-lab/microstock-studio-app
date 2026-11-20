MICROSTOCK STUDIO V3.1 — OPPO F11 PRO OPTIMIZED

TARGET DEVICE
- OPPO F11 Pro, RAM 6 GB, storage 64 GB, Android 11, Wi-Fi.
- PWA website, can be added to Home Screen from Chrome.
- Workload runs sequentially by default (one image at a time).

INSTALL / UPDATE THROUGH GITHUB PAGES
1. Download and extract this ZIP.
2. Upload the five files from the folder to the ROOT of your existing GitHub repository, replacing the older versions.
3. Commit changes and wait for GitHub Pages deployment.
4. Open your existing GitHub Pages URL in Chrome Android.
5. Refresh the page. If the old app remains, clear the site's cached data in Chrome and reopen.
6. Chrome menu > Add to Home screen / Install app.

CURRENT FEATURES
- Batch select up to 100 JPG, PNG, WebP images.
- Local image captioning using Transformers.js; model downloads on first use and needs internet.
- Optional Gemini cloud metadata. Gemini requires the user's own API key; the free tier and quotas can change.
- Hybrid mode: local caption then Gemini if a key is supplied; without a key, it falls back to a basic draft and flags review.
- Metadata fields: title, description, 49 keyword target, category, CSV and JSON export.
- Keyword research database for Image, Vector, Video, saved in browser localStorage.
- AI Studio prompt builder and links to third-party public generator demos.
- Strategy planner and seasonal planning.
- IndexedDB persistence for metadata results only; original image files are not stored.

PHONE-SAFETY SETTINGS
- Concurrency defaults to 1. Do not change to 2 unless the phone remains cool and responsive.
- First test local captioning on 1–3 images. The model download and inference require internet and may consume RAM, storage cache, battery, and data.
- Select up to 100 files, but process in small batches for reliability.
- Close other heavy apps and keep free storage available. Stop if the phone becomes hot.
- Export CSV/JSON periodically. Browser/site data clearing can delete local records.

IMPORTANT LIMITATIONS / HONEST SCOPE
- Local captioning is not equivalent to a full visual-language model and does not guarantee 49 accurate keywords.
- Gemini cloud metadata requires a user-supplied API key; Google free quota is limited and may change. Images are sent to Google when cloud analysis is used.
- AI Horde and LTX Video links open third-party public services. They are not embedded GPU engines inside this PWA; anonymous/free availability, queue, and output quality are not guaranteed.
- GitHub Pages is static hosting and does not provide a private GPU or backend.
- No promise of unlimited generation or paid-model-equivalent quality.
- Always review accuracy, releases, trademarks, people/property rights, and each marketplace's AI content rules before submission.


PERBAIKAN UPLOAD V3.1.1
- Tidak lagi menolak gambar hanya karena MIME type dari Android kosong/generic.
- Memeriksa ekstensi dan mencoba decode gambar di browser sebelum menerima file.
- Menampilkan jumlah file yang terbaca dan nama file yang gagal.
- Mendukung JPG/JPEG, PNG, WebP, GIF, BMP jika browser dapat mendekodenya.
- HEIC/HEIF bisa tetap tidak didukung oleh browser Android; konversi ke JPG/PNG bila ditolak.
- Cache service worker dinaikkan agar pembaruan file terpasang.


VERSI 3.1.2 - PERBAIKAN UPLOAD GALERI ANDROID
- Menerima variasi MIME Android seperti image/jpg dan image/pjpeg.
- Memeriksa tanda tangan file JPEG/PNG/GIF/WebP/BMP jika MIME tidak tersedia.
- Jika createImageBitmap gagal, otomatis mencoba decoder gambar browser sebagai fallback.
- Pesan kesalahan upload dibuat lebih informatif.
- Cache service worker dinaikkan ke V3.1.2 agar pembaruan tidak tertahan cache lama.
Catatan: HEIC/HEIF tetap bergantung pada dukungan decoder browser Android.

VERSI 3.1.3 - FORMAT FILE
- Pemilih file Android kini secara eksplisit menampilkan JPG/JPEG dan PNG.
- Upload multi-file tetap didukung hingga batas batch aplikasi.
