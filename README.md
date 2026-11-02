# Mitra Payment — Live Chat (Vercel)

## Fitur
- Widget chat langsung di landing page.
- Pesan pengunjung disimpan 30 hari dan di-refresh berkala.
- Panel admin di `/admin.html`, dibatasi `CHAT_ADMIN_TOKEN`.
- Penyimpanan menggunakan Upstash Redis (tidak menyimpan pesan di browser saja).

## Deploy
1. Buat database Upstash Redis dan salin `UPSTASH_REDIS_REST_URL` serta `UPSTASH_REDIS_REST_TOKEN`.
2. Deploy folder ini sebagai project Vercel (framework preset Other; build command kosong).
3. Tambahkan Environment Variables di Vercel:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `CHAT_ADMIN_TOKEN` (buat token acak panjang, jangan bagikan ke pengunjung).
4. Redeploy setelah environment variables disimpan.
5. Buka `/admin.html`, masukkan `CHAT_ADMIN_TOKEN`, lalu pilih percakapan untuk membalas.

**Catatan:** Chat hanya berfungsi setelah deployment dan konfigurasi Redis selesai. HTML lokal atau dibuka langsung dari file Android tidak dapat mengakses API `/api`.
