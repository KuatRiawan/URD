# UAT Reminder dan Renewal

## Schema yang diuji

Migration 005 membuat `renewal_followups.suket_id`. Migration 006 menambahkan `object_id` nullable untuk follow-up unit sebelum Suket diterbitkan. Database test aktual memiliki kedua kolom.

## Skenario

| ID | Kondisi | Expected | Actual/status |
|---|---|---|---|
| REN-01 | Follow-up dengan `suket_id` | Terbaca untuk Suket/unit terkait | CODE REVIEWED |
| REN-02 | Follow-up dengan `object_id` | Terbaca walau belum ada Suket | CODE REVIEWED |
| REN-03 | Kedua relasi terisi | Follow-up terbaru dipakai | CODE REVIEWED |
| REN-04 | Salah satu relasi null | Query tidak gagal dan relasi yang ada tetap dipakai | CODE REVIEWED |
| REN-05 | Dua follow-up satu unit | Record terbaru dipakai | CODE REVIEWED |
| REN-06 | Renewal aktif | Retry tidak membuat order aktif duplikat | PASS |
| REN-07 | Suket kedaluwarsa | Masuk kandidat sesuai kode saat ini | PASS |

## Jadwal

Scheduler internal memakai H90/H60/H30/H14/H0. Client scheduler memakai H7/H14/H30. Perbedaan ini bukan dipilih ulang dalam UAT dan tetap PENDING OWNER DECISION.

Tidak ada email atau WhatsApp nyata yang dikirim.
