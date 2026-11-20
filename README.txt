MICROSTOCK STUDIO - MVP 1.0

Isi paket:
- index.html : tampilan aplikasi
- app.js : generator metadata, Library, CSV
- manifest.webmanifest : identitas PWA
- sw.js : cache offline

CARA MENJALANKAN / MEMASANG DI ANDROID
1. Upload seluruh isi folder ini ke hosting HTTPS gratis, misalnya GitHub Pages.
2. Buka alamat website tersebut menggunakan Chrome Android.
3. Pilih menu Chrome (tiga titik) > Tambahkan ke layar utama / Install app.
4. Buka Microstock Studio dari ikon di layar utama.

Catatan:
- PWA perlu dibuka dari alamat HTTPS agar bisa dipasang dan service worker aktif. Membuka file HTML langsung tidak cukup untuk instalasi PWA.
- Generator versi ini memakai template dan kamus lokal, bukan model AI vision. Deskripsi gambar harus ditulis pengguna.
- Library tersimpan di browser/perangkat. Export CSV secara berkala sebagai cadangan.
- Periksa semua keyword sebelum mengunggah. Persyaratan metadata berbeda antar marketplace.
