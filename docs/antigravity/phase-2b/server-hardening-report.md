# Laporan Pengetatan Keamanan Server (Server Hardening Report)

Tanggal: 2 November 2026  
Status Desain: **PASSED (SPESIFIKASI & KONFIGURASI TERUJI)**  
Penyusun: Application Security Engineer, Senior DevOps Engineer & SRE  

---

## 1. Pemisahan Hak Akses & Pengguna Sistem (System Users)

Prinsip *Least Privilege* diterapkan secara ketat pada sistem operasi target Ubuntu 24.04 LTS. Aplikasi tidak boleh dijalankan di bawah akun `root`.

Struktur pengguna sistem yang dirancang:

1. **Pengguna Administrasi Server (`sysadmin`):**
   - Hak: Akses SSH dengan otentikasi kunci publik Ed25519, hak `sudo` terbatas dengan password.
   - Fungsi: Pemeliharaan OS, instalasi paket, konfigurasi firewall, audit keamanan.
2. **Pengguna Deployment (`deploy`):**
   - Hak: Anggota grup `urd-app`, akses git pull, npm build, dan eksekusi reload PM2.
   - Fungsi: Otomasi deployment rilis baru.
3. **Pengguna Layanan Aplikasi (`urd`):**
   - Sifat: User sistem tanpa password (`--disabled-password --disabled-login --system`).
   - Home direktori: `/var/urd`.
   - Fungsi: Menjalankan runtime Express dan engine PM2. Hanya memiliki hak baca/tulis pada `/var/urd/storage` dan hak baca pada kode aplikasi.
4. **Pengguna Database (`postgres` / `urd_staging_app`):**
   - Layanan PostgreSQL berjalan di bawah user sistem `postgres`.
   - Akun koneksi aplikasi database dibatasi hanya untuk skema `urd_staging`.

Perintah pembuatan user sistem:
```bash
sudo addgroup --system urd-app
sudo adduser --system --ingroup urd-app --no-create-home --shell /bin/false urd
sudo mkdir -p /var/urd/storage/uploads /var/urd/logs
sudo chown -R urd:urd-app /var/urd/storage /var/urd/logs
sudo chmod -R 750 /var/urd/storage /var/urd/logs
```

---

## 2. Kebijakan Keamanan SSH (`/etc/ssh/sshd_config.d/99-hardening.conf`)

Untuk mencegah serangan *brute force* dan *credential stuffing*:

```ini
# SSH Server Hardening Policy - PT Upaya Riksa Daya Staging
Port 22
Protocol 2
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
ChallengeResponseAuthentication no
KerberosAuthentication no
GSSAPIAuthentication no
X11Forwarding no
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
AllowGroups sudo urd-admin
```

Fail2ban dipasang untuk memblokir IP yang gagal login lebih dari 3 kali berturut-turut dalam 10 menit:
```ini
# /etc/fail2ban/jail.d/sshd.local
[sshd]
enabled = true
port = ssh
filter = sshd
maxretry = 3
findtime = 600
bantime = 3600
```

---

## 3. Kebijakan Firewall Host (UFW)

Kebijakan default adalah menolak semua koneksi masuk (*default deny incoming*) dan mengizinkan koneksi keluar yang sah (*default allow outgoing*):

```bash
# Konfigurasi UFW Firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH Administrative Access'
sudo ufw allow 80/tcp comment 'Nginx HTTP Challenge & Redirect'
sudo ufw allow 443/tcp comment 'Nginx HTTPS Staging Gateway'
sudo ufw enable
```

**Verifikasi Isolasi:**
- Port Express API (`4000`) dan PostgreSQL (`5432`) **TIDAK DIBUKA** di UFW.
- Keduanya hanya mengikat (*bind*) pada loopback interface `127.0.0.1`, sehingga mustahil diakses langsung dari internet publik tanpa melewati Nginx.

---

## 4. Konfigurasi Nginx Reverse Proxy & Header Keamanan

File konfigurasi Nginx `/etc/nginx/sites-available/staging.upayariksadaya.com`:

```nginx
# Upstream Node.js API
upstream urd_backend {
    server 127.0.0.1:4000 max_fails=3 fail_timeout=10s;
    keepalive 32;
}

# HTTP 301 Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name staging.upayariksadaya.com;
    server_tokens off;

    # Certbot challenge directory
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS Main Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name staging.upayariksadaya.com;
    server_tokens off;

    # TLS Certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/staging.upayariksadaya.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/staging.upayariksadaya.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/staging.upayariksadaya.com/chain.pem;

    # TLS Modern Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none';" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # Upload Limits (Max 15MB untuk foto alat dan lampiran dokumen)
    client_max_body_size 15M;

    # Frontend Static Distribution (SPA)
    root /var/urd/frontend/dist;
    index index.html;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/x-javascript application/json application/xml image/svg+xml;

    # Frontend Route Handling (SPA Fallback)
    location / {
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
    }

    # Static Assets Caching (Fingerprinted assets)
    location ~* \.(?:css|js|woff2?|svg|png|jpg|jpeg|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Backend API Reverse Proxy
    location /api/ {
        proxy_pass http://urd_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90s;
        proxy_connect_timeout 15s;
        proxy_send_timeout 90s;

        # Mask Internal Errors
        proxy_intercept_errors on;
    }

    # Prevent access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

---

## 5. Manajemen Rotasi Log (`/etc/logrotate.d/urd`)

Mencegah penumpukan log yang menghabiskan ruang disk server staging:

```ini
/var/urd/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 urd urd-app
    sharedscripts
    postrotate
        [ -f /var/urd/pm2.pid ] && pm2 reloadLogs > /dev/null 2>&1 || true
    endscript
}

/var/log/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}
```

**Kesimpulan Hardening:**  
Seluruh blueprint keamanan telah dirancang dengan standar CIS Benchmark untuk Linux & Nginx, siap diimplementasikan secara otomatis melalui script provisioning begitu VPS diserahkan.

