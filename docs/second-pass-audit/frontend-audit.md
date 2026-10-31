# Audit frontend

## Pemeriksaan source dan regresi

- Route fitur memakai `React.lazy` dan `Suspense`; route tests mencakup root redirect, validasi login, role guard dan render 13 halaman internal.
- Finalisasi LHPP ditampilkan untuk Marketing/Admin Sistem; Inspector mengirim hasil ke Marketing.
- Kontrol finalisasi BAP dipisahkan dari edit/signature Inspector. Marketing tidak mendapat kontrol edit teknis.
- Queue memakai label “LHPP Siap Finalisasi”; aksi review lama dihilangkan dari alur aktif.
- Pemeriksaan source sebelumnya tidak menemukan tombol kosong `onClick={() => {}}` atau library ikon selain Phosphor.

## Belum selesai

- Vitest bukan interaksi browser. Dialog/dropdown/upload/filter/pagination/refresh/error state dan navigasi per role belum diuji manual.
- Frontend ESLint gagal dengan 30 error dan 2 warning di AuthProvider, ThemeProvider, AppLayout, Modal, DashboardPage, InspectorDashboardView, StepSignatures, OrderDetailModal, SuketPage, `offline-sync.js`, dan file lain.
- Dark/light seluruh route belum diverifikasi.

Severity: P1 untuk triase lint/state mati yang memengaruhi alur; P2 untuk browser regression seluruh halaman.
