# Panduan Agen Engineering (AGENTS.md): PT Upaya Riksa Daya

Dokumen ini memuat aturan arsitektur, identitas merek, keamanan, dan kualitas yang wajib dipatuhi oleh setiap agen AI maupun engineer yang memelihara repository **PT Upaya Riksa Daya**.

## 1. Aturan Identitas & Branding (Wajib)
- Nama perusahaan dan identitas tunggal aplikasi adalah **PT Upaya Riksa Daya**.
- **DILARANG** menggunakan nama produk "SIRUK3" pada antarmuka, judul halaman, komponen, logo, atau branding baru.
- Gunakan selalu logo resmi `logo-urd.png` (`frontend/src/assets/logo-urd.png`) tanpa mengubah proporsi atau menggantinya dengan ikon generik.
- Bahasa utama antarmuka pengguna adalah **Bahasa Indonesia** yang jelas dan sesuai terminologi K3 (Riksa Uji, Objek Uji, Ahli K3, LHPP, Suket K3, Disnaker).

## 2. Arsitektur & Pemisahan Direktori
- Pertahankan pemisahan ketat antara `frontend/` (React + Vite + Tailwind CSS + Axios + React Router) dan `backend/` (Node.js + Express.js + PostgreSQL `pg` + Joi + JWT).
- Seluruh akses database di `backend/` wajib menggunakan parameterized SQL (`$1, $2, ...`) melalui `backend/src/database/pool.js`. Jangan memperkenalkan ORM atau konkatenasi string SQL mentah.
- Seluruh perubahan skema database harus ditambahkan sebagai berkas migrasi bernomor urut di `backend/migrations/`.

## 3. Aturan Halaman Login & Keamanan
- Saat pengguna yang belum login membuka root path (`/`), sistem wajib mengarahkan langsung ke `/login` tanpa menampilkan halaman landing publik.
- **DILARANG** menampilkan daftar akun demo, email contoh yang dapat diklik, atau kata sandi default pada halaman `/login`.
- Setiap endpoint di `backend/src/modules/` wajib dilindungi oleh middleware `authenticate` dan `authorize(...roles)` serta divalidasi menggunakan skema `Joi`.
- Tabel `audit_logs` bersifat append-only (dilindungi oleh trigger PostgreSQL `trg_audit_logs_immutable`).

## 4. Standar Kualitas Anti-Slop & Ponytail
- Jangan pernah menggunakan karakter em dash (`—`) pada teks antarmuka atau copywriting (Anti-Slop Rule R-02).
- Gunakan hanya satu library ikon (`@phosphor-icons/react`).
- Pastikan tidak ada tombol mati (`onClick={() => {}}`); setiap kontrol UI harus terhubung ke alur data nyata dan menangani state loading, empty, serta error.
- Jalankan `npm --prefix backend test`, `npm --prefix frontend test`, dan `npm --prefix frontend run build` sebelum menyelesaikan perubahan.

## 5. Skills Agen AI Tersedia (skills/ & .skills/)
Direktori `skills/` (dan symlink `.skills/`) di root project memuat skill standar yang wajib dibaca dan dirujuk oleh agen AI saat merancang fitur:
- **Ponytail** (`skills/ponytail/SKILL.md`): Prinsip solusi teringkas dan efisien tanpa over-engineering (YAGNI, lazy senior dev mode, modul bantuan: `ponytail-audit`, `ponytail-debt`, `ponytail-gain`, `ponytail-help`, `ponytail-review`).
- **UI/UX Pro Max** (`skills/ui-ux-pro-max/SKILL.md`): Panduan desain antarmuka, tata letak, data warna, tipografi, dan interaksi profesional (lengkap dengan folder `data/` dan `scripts/`).
- **Anti-Slop** (`skills/antislop/SKILL.md`): Aturan pencegahan output AI generik/slop (lengkap dengan modul pendukung: `antislop-ui`, `antislop-copywriting`, `antislop-human`, `antislop-layoutmobile`, `antislop-code`).


