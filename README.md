# JobConnect — Sistem Informasi Rekrutmen dan Pencocokan Kandidat dengan Lowongan Kerja Berbasis Web

[![Laravel](https://img.shields.io/badge/Laravel-11.x-FF2D20?style=for-the-badge&logo=laravel)](https://laravel.com)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com)
[![MySQL](https://img.shields.io/badge/MySQL-8.x-4479A1?style=for-the-badge&logo=mysql)](https://mysql.com)

---

## 1. Deskripsi Project

**JobConnect** adalah platform sistem informasi rekrutmen berbasis web terpadu yang dirancang untuk mempertemukan pencari kerja (kandidat) dengan perusahaan (recruiter) serta diawasi oleh administrator. Platform ini dilengkapi algoritma **Skill Matching** otomatis yang menghitung persentase kecocokan antara keahlian yang dimiliki kandidat dan kriteria teknis yang disyaratkan oleh lowongan kerja, sehingga proses seleksi awal menjadi lebih akurat, objektif, dan transparan.

---

## 2. Fitur Utama

### 🧑‍💼 Portal Kandidat (Candidate)
- **Autentikasi & Akun**: Registrasi, login, logout, dan manajemen sesi berbasis token.
- **Profil Profesional**: Pengelolaan data diri, kontak, bio, resume/CV PDF, dan foto profil.
- **Riwayat Lengkap**: Manajemen riwayat pendidikan, pengalaman kerja, dan portofolio proyek.
- **Keahlian (Skills)**: Pengelolaan daftar keahlian teknis untuk keperluan kalkulasi matching.
- **Eksplorasi Lowongan**: Pencarian lowongan dengan filter kategori, tipe kerja (Full Time, Part Time, dsb.), dan lokasi.
- **Skill Matching**: Preview persentase kecocokan langsung pada detail lowongan (*Matched Skills* vs *Missing Skills*).
- **Simpan Lowongan**: Menyimpan lowongan favorit untuk dilamar di kemudian hari.
- **Pelamaran Kerja**: Pengajuan lamaran dengan surat lamaran (*cover letter*) terintegrasi.
- **Pelacakan Status (Timeline)**: Monitoring tahapan lamaran secara transparan (*Submitted &rarr; Screening &rarr; Interview &rarr; Test &rarr; Accepted / Rejected*).
- **Jadwal Wawancara**: Tinjauan undangan wawancara online (link meeting) maupun offline (lokasi fisik).
- **Pusat Notifikasi**: Penerimaan notifikasi instan saat status lamaran atau wawancara diperbarui.

### 🏢 Portal Perusahaan (Company / Recruiter)
- **Autentikasi & Profil**: Registrasi instan, kelola profil perusahaan, deskripsi, alamat, website, dan logo.
- **Dokumen Legal & Verifikasi**: Unggah dokumen legalitas perusahaan untuk audit dan verifikasi oleh administrator.
- **Manajemen Lowongan (CRUD)**: Pembuatan lowongan baru, penetapan skill wajib, rentang gaji, tenggat waktu, tutup, dan buka kembali lowongan.
- **Manajemen Pelamar**: Pemantauan pelamar masuk per lowongan, pengurutan berdasarkan skor kecocokan skill, dan review CV.
- **Catatan Rekruter**: Penambahan catatan evaluasi internal (*recruiter notes*) pada berkas pelamar.
- **Pembaruan Status Lamaran**: Pengubahan status tahapan pelamar secara terstruktur.
- **Manajemen Wawancara**: Penjadwalan interview (tanggal, jam, metode online/offline, meeting link/lokasi), reschedule, penyelesaian, dan pembatalan.
- **Laporan & Statistik**: Dashboard analitik pipeline rekrutmen, rasio konversi pelamar, dan statistik performa lowongan.
- **Notifikasi Recruiter**: Pemberitahuan otomatis ketika ada pelamar baru atau status verifikasi diperbarui.

### 🛡️ Portal Administrator (Super Admin)
- **Control Center Dashboard**: Ringkasan 8 metrik KPI sistem (total pengguna, kandidat, perusahaan, lowongan aktif, lamaran, dan wawancara) serta feed aktivitas terkini.
- **Manajemen Pengguna**: Audit seluruh akun pengguna, filter role, dan kontrol status aktif/nonaktif akun (dengan proteksi *self-deactivation*).
- **Verifikasi Perusahaan**: Verifikasi legalitas profil dan tinjauan dokumen legal perusahaan (*approve* / *reject*).
- **Moderasi Lowongan**: Pengawasan seluruh lowongan yang ditayangkan perusahaan di platform.
- **Monitoring Lamaran & Wawancara**: Pemantauan data seluruh proses lamaran dan wawancara lintas perusahaan.
- **Kategori Pekerjaan**: Manajemen master data kategori pekerjaan (CRUD).
- **Laporan Sistem**: Laporan komprehensif metrik pertumbuhan dan aktivitas rekrutmen global.
- **Notifikasi Administrator**: Log notifikasi sistem dan siaran aktivitas penting.

---

## 3. Teknologi yang Digunakan

### Frontend
- **React.js 19.x** (Komponen modular berbasis UI hooks modern)
- **Vite 8.x** (Build tool dan development server berkecepatan tinggi)
- **Tailwind CSS 4.x** (Utilitas styling modern dengan palet warna terstandarisasi)
- **Axios 1.x** (HTTP Client dengan request/response interceptor untuk Sanctum Bearer token)
- **React Router 7.x** (Client-side routing dengan proteksi otorisasi berbasis Role)

### Backend
- **Laravel 11.x** (Framework PHP modern berbasis arsitektur MVC)
- **Laravel Sanctum 4.x** (Autentikasi API berbasis Bearer Token yang aman dan ringan)
- **RESTful API Architecture** (Endpoint terstandarisasi dengan validasi ketat dan JSON response)

### Database
- **MySQL 8.x** (Relational Database Management System)

### Perkakas Pengembangan
- **XAMPP / Laragon** (Local web & database server)
- **Visual Studio Code / Antigravity IDE**
- **Git & GitHub** (Version Control System)

---

## 4. Arsitektur Sistem

```
+-------------------------------------------------------------+
|                 FRONTEND (React.js + Vite)                  |
|  - Public Landing & Jobs Exploration                        |
|  - Candidate Portal Layout & Modules                        |
|  - Company Recruiter Layout & Modules                       |
|  - Admin Control Center Layout & Modules                    |
+-------------------------------------------------------------+
                              |
                     HTTPS / JSON REST API
                   (Axios with Bearer Token)
                              |
                              v
+-------------------------------------------------------------+
|                 BACKEND (Laravel 11 API)                    |
|  - Middleware: auth:sanctum & role:admin|company|candidate   |
|  - Controllers: Auth, Candidate, Company, Admin             |
|  - Services: SkillMatchingService                           |
|  - Model & ORM (Eloquent Relationships)                     |
+-------------------------------------------------------------+
                              |
                       SQL Connection
                              |
                              v
+-------------------------------------------------------------+
|                     DATABASE (MySQL)                        |
|  - 18 Relational Domain Tables                              |
|  - Foreign Key Constraints & Cascade Operations             |
+-------------------------------------------------------------+
```

Aplikasi memisahkan antarmuka pengguna (*frontend*) dan logika bisnis (*backend*) secara *decoupled*. Frontend React mengirimkan permintaan data asinkron via Axios ke REST API Laravel yang dilindungi middleware otorisasi berbasis peran (Role-Based Access Control).

---

## 5. Struktur Folder Project

```
Website/
├── README.md                  # Dokumentasi utama project
├── .gitignore                 # Aturan pengecualian file git level root
│
├── backend/                   # Backend Application (Laravel 11)
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/   # Controller modul Candidate, Company, Admin & Auth
│   │   │   └── Middleware/    # Middleware otorisasi Role
│   │   ├── Models/            # Model Eloquent (User, JobVacancy, Application, dll)
│   │   └── Services/          # Service layer (SkillMatchingService)
│   ├── config/                # Konfigurasi aplikasi, auth, cors, database
│   ├── database/
│   │   ├── migrations/        # 18 file migrasi database
│   │   └── seeders/           # DatabaseSeeder, AdminSeeder, DummyDataSeeder
│   ├── routes/
│   │   └── api.php            # 101 endpoint REST API aplikasi
│   ├── storage/               # File uploads (CV, logo, dokumen legal)
│   ├── .env.example           # Contoh konfigurasi environment backend
│   └── composer.json          # Dependensi PHP backend
│
└── frontend/                  # Frontend Application (React 19 + Vite 8)
    ├── public/                # Aset statis publik
    ├── src/
    │   ├── components/        # Komponen UI (candidate, company, dashboard, layout)
    │   ├── context/           # AuthContext untuk manajemen sesi pengguna
    │   ├── layouts/           # AdminLayout, CompanyLayout, CandidateLayout
    │   ├── pages/             # Halaman antarmuka (public, auth, candidate, company, admin)
    │   ├── routes/            # AppRoutes (Protected & Role-based routes)
    │   ├── services/          # HTTP API services (api, candidate, company, admin)
    │   ├── App.jsx            # Komponen root aplikasi
    │   └── main.jsx           # Entry point React
    ├── .env.example           # Contoh konfigurasi environment frontend
    ├── package.json           # Dependensi Node.js & library frontend
    └── vite.config.js         # Konfigurasi Vite bundler & Tailwind CSS
```

---

## 6. Kebutuhan Sistem (System Requirements)

- **PHP**: `>= 8.2.0` (Direkomendasikan PHP 8.2.x dengan ekstensi `pdo_mysql`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `json`, `fileinfo`)
- **Composer**: `>= 2.8.0`
- **Node.js**: `>= 20.x` (Teruji pada Node.js v22.17.0)
- **NPM**: `>= 10.x` (Teruji pada NPM 10.9.2)
- **Database**: MySQL `>= 8.0` (Laragon / XAMPP)
- **Web Server**: Apache / Nginx (Production) atau Built-in artisan & Vite (Development)

---

## 7. Panduan Instalasi (Installation Guide)

### Langkah 1: Clone Repository
```bash
git clone https://github.com/username/recruitment-system.git
cd recruitment-system
```

### Langkah 2: Setup Backend (Laravel)
```bash
cd backend

# 1. Install dependensi PHP
composer install

# 2. Salin file environment
copy .env.example .env

# 3. Generate App Key
php artisan key:generate

# 4. Konfigurasi database di file .env:
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=recruitment_system
# DB_USERNAME=root
# DB_PASSWORD=

# 5. Jalankan migrasi dan seeder awal
php artisan migrate --seed

# 6. Buat symbolic link untuk folder storage uploads
php artisan storage:link
```

### Langkah 3: Setup Frontend (React + Vite)
```bash
cd ../frontend

# 1. Install dependensi Node.js
npm install

# 2. Salin file environment (opsional, default: http://127.0.0.1:8000/api)
copy .env.example .env
```

---

## 8. Menjalankan Aplikasi (Run Project)

Buka dua terminal terpisah:

### Terminal 1: Jalankan Backend API
```bash
cd backend
php artisan serve
```
Backend API berjalan di: **`http://127.0.0.1:8000`**

### Terminal 2: Jalankan Frontend Dev Server
```bash
cd frontend
npm run dev
```
Aplikasi web berjalan di: **`http://localhost:5173`**

---

## 9. Akun Bawaan (Default Credentials)

Akun default yang disediakan melalui `AdminSeeder`:

| Role | Nama Pengguna | Email | Password |
| :--- | :--- | :--- | :--- |
| **Super Admin** | Super Admin | `recruitment@gmail.com` | `A12345678` |

> **Catatan Akun Pengguna:**
> Database bersih dari data dummy. Akun **Perusahaan (Company/Recruiter)** dan **Kandidat (Candidate)** dapat didaftarkan secara mandiri melalui halaman **Daftar** (`/register`) pada aplikasi.

---

## 10. Dokumentasi REST API

### 🔑 Autentikasi Publik
- `POST /api/register` : Pendaftaran akun baru (Candidate / Company).
- `POST /api/login` : Login akun dan perolehan Sanctum Bearer Token.
- `POST /api/logout` : Logout dan pencabutan token saat ini *(Protected)*.
- `GET /api/me` : Mendapatkan profil pengguna yang sedang login *(Protected)*.
- `GET /api/job-categories` : Mendapatkan master daftar kategori pekerjaan *(Public/Auth)*.
- `GET /api/skills` : Mendapatkan master daftar skill *(Public/Auth)*.

### 👤 Modul Kandidat (`role:candidate`)
- `GET /api/jobs` : Daftar seluruh lowongan pekerjaan aktif.
- `GET /api/jobs/{id}` : Detail lowongan kerja dan status lamaran/simpan.
- `GET /api/jobs/{id}/match` : Kalkulasi preview kecocokan skill kandidat terhadap lowongan.
- `POST /api/jobs/{id}/apply` : Mengirim lamaran pekerjaan beserta cover letter.
- `POST /api/jobs/{id}/save` & `DELETE /api/jobs/{id}/save` : Simpan / hapus bookmark lowongan.
- `GET /api/candidate/profile` & `PUT /api/candidate/profile` : Lihat dan update profil kandidat.
- `POST /api/candidate/profile/cv` & `POST /api/candidate/profile/photo` : Unggah CV dan foto profil.
- `GET|POST|PUT|DELETE /api/candidate/educations` : CRUD riwayat pendidikan.
- `GET|POST|PUT|DELETE /api/candidate/experiences` : CRUD riwayat pengalaman kerja.
- `GET|POST|PUT|DELETE /api/candidate/portfolios` : CRUD data portofolio.
- `GET|POST|DELETE /api/candidate/skills` : Kelola daftar keahlian kandidat.
- `GET /api/candidate/applications` & `GET /api/candidate/applications/{id}` : Riwayat lamaran & timeline.
- `GET /api/candidate/saved-jobs` : Daftar lowongan yang disimpan.
- `GET /api/candidate/interviews` & `GET /api/candidate/interviews/{id}` : Jadwal wawancara kandidat.
- `GET /api/candidate/notifications` : Notifikasi kandidat & aksi mark-read.

### 🏢 Modul Perusahaan (`role:company`)
- `GET /api/company/dashboard` : Ringkasan metrik dashboard recruiter.
- `GET|PUT /api/company/profile` : Lihat & update profil perusahaan.
- `POST /api/company/profile/logo` : Unggah logo perusahaan.
- `GET|POST|DELETE /api/company/documents` : Unggah dan kelola berkas legalitas perusahaan.
- `GET|POST|GET(id)|PUT|DELETE /api/company/jobs` : CRUD lowongan pekerjaan perusahaan.
- `PATCH /api/company/jobs/{id}/status` : Mengubah status lowongan (`active` / `closed`).
- `GET /api/company/applications` & `GET /api/company/applications/{id}` : Kelola daftar pelamar masuk.
- `PATCH /api/company/applications/{id}/status` : Update status seleksi pelamar.
- `GET|POST /api/company/applications/{id}/notes` : Lihat & tambah catatan evaluasi pelamar.
- `GET|POST /api/company/applications/{id}/interviews` : Jadwalkan interview untuk pelamar.
- `GET|PUT|PATCH /api/company/interviews` : Kelola, reschedule, selesaikan, atau batalkan wawancara.
- `GET /api/company/reports` : Laporan analitik rekrutmen perusahaan.
- `GET /api/company/notifications` : Notifikasi recruiter & aksi mark-read.

### 🛡️ Modul Admin (`role:admin`)
- `GET /api/admin/dashboard` : Metrik sistem, KPI pengguna, dan feed aktivitas.
- `GET|PATCH|DELETE /api/admin/users` : Manajemen data pengguna & kontrol status akun.
- `GET|PATCH /api/admin/companies` : Tinjauan perusahaan & verifikasi status.
- `GET|PATCH /api/admin/company-documents` : Validasi dokumen legalitas perusahaan.
- `GET|PATCH|DELETE /api/admin/jobs` : Moderasi lowongan pekerjaan global.
- `GET /api/admin/applications` : Monitoring seluruh lamaran dalam sistem.
- `GET /api/admin/interviews` : Monitoring jadwal wawancara seluruh perusahaan.
- `GET|POST|PUT|DELETE /api/admin/categories` : CRUD master data kategori lowongan.
- `GET /api/admin/reports` : Laporan statistik global sistem.
- `GET /api/admin/notifications` : Log notifikasi administratif.

---

## 11. Dokumentasi Basis Data (18 Tabel Utama)

1. **`users`**: Menyimpan kredensial akun pengguna, email, kata sandi ter-hash, role (`admin`, `company`, `candidate`), dan status akun (`active`, `inactive`).
2. **`candidate_profiles`**: Menyimpan rincian profil kandidat (nama lengkap, tanggal lahir, jenis kelamin, alamat, bio, path CV resume, dan foto profil).
3. **`candidate_educations`**: Menyimpan riwayat pendidikan formal (institusi, jenjang, jurusan, tahun mulai, tahun lulus, dan IPK).
4. **`candidate_experiences`**: Menyimpan rekam jejak pengalaman kerja (posisi, perusahaan, tanggal mulai, tanggal selesai, dan deskripsi tugas).
5. **`candidate_portfolios`**: Menyimpan portofolio karya kandidat (judul proyek, deskripsi, link demo/repository, dan gambar).
6. **`skills`**: Master data keahlian teknis dan profesional yang dapat dipilih oleh kandidat maupun lowongan.
7. **`candidate_skills`**: Tabel relasi (*pivot*) yang menghubungkan kandidat dengan keahlian yang dimilikinya.
8. **`companies`**: Menyimpan profil resmi perusahaan (nama, deskripsi, logo, alamat, kontak telepon, website, dan status verifikasi).
9. **`job_categories`**: Master data klasifikasi kategori pekerjaan (misal: Teknologi Informasi, Keuangan, Desain).
10. **`job_vacancies`**: Menyimpan lowongan kerja yang diunggah perusahaan (judul, deskripsi, persyaratan, tipe pekerjaan, rentang gaji, tenggat waktu, dan status aktif/tutup).
11. **`job_skills`**: Tabel relasi (*pivot*) yang mendefinisikan daftar keahlian yang disyaratkan oleh lowongan tertentu.
12. **`applications`**: Menyimpan pengajuan lamaran kerja dari kandidat untuk suatu lowongan, termasuk skor persentase kecocokan (*match_percentage*) dan status seleksi terkini.
13. **`application_status_histories`**: Mencatat rekam jejak kronologis (*audit trail*) setiap perubahan status lamaran beserta waktu pencatatannya.
14. **`application_notes`**: Menyimpan catatan evaluasi internal dari recruiter untuk pelamar tertentu.
15. **`interviews`**: Menyimpan agenda wawancara pelamar (tanggal, jam, metode online/offline, link pertemuan, lokasi, status, dan catatan).
16. **`notifications`**: Menyimpan pesan pemberitahuan alur kerja yang ditujukan kepada pengguna spesifik.
17. **`saved_jobs`**: Tabel relasi bookmark lowongan yang disimpan oleh kandidat.
18. **`company_documents`**: Menyimpan berkas dokumen legalitas resmi (SIUP, NIB, NPWP) untuk verifikasi perusahaan oleh admin.

---

## 12. Otorisasi dan Hak Akses (Role-Based Access Control)

Sistem menerapkan prinsip pemisahan hak akses berbasis peran (RBAC) di level backend middleware dan routing frontend:

- **ADMIN**: Memiliki otoritas tertinggi untuk memoderasi lowongan, mengelola master kategori, mengaudit status pengguna, dan menyetujui/menolak verifikasi legalitas perusahaan. Dilarang mengakses mutasi data internal pelamar/perusahaan di luar lingkup audit.
- **COMPANY**: Terisolasi penuh pada entitas bisnisnya sendiri. Hanya dapat melihat, mengubah, dan menghapus lowongan miliknya, mengakses pelamar yang melamar pada lowongannya, serta menjadwalkan wawancara untuk perusahaannya. Upaya mengakses data perusahaan lain dicegah dengan HTTP 403 (*Forbidden*).
- **CANDIDATE**: Terisolasi penuh pada data pribadi. Hanya dapat melihat dan mengedit profilnya sendiri, melamar pekerjaan, melihat riwayat lamarannya, serta menghadiri jadwal wawancaranya. Dilarang mengakses panel admin atau recruiter.

---

## 13. Algoritma Pencocokan Keahlian (Skill Matching)

Sistem menggunakan kalkulasi pencocokan eksak berbasis himpunan keahlian yang diimplementasikan pada `App\Services\SkillMatchingService`:

$$\text{Persentase Kecocokan} = \left( \frac{\text{Jumlah Skill Kandidat yang Cocok}}{\text{Total Skill yang Disyaratkan Lowongan}} \right) \times 100\%$$

### Contoh Perhitungan:
- Lowongan Kerja membutuhkan **4 Skill**: `['PHP', 'Laravel', 'MySQL', 'REST API']`
- Kandidat memiliki **3 Skill** yang cocok: `['PHP', 'Laravel', 'MySQL']`
- Perhitungan:
  $$\frac{3}{4} \times 100\% = 75.00\%$$

Nilai persentase ini dihitung secara dinamis saat kandidat melihat lowongan dan disimpan secara permanen pada kolom `match_percentage` di tabel `applications` saat lamaran diajukan.

---

## 14. Diagram Alur Rekrutmen (End-to-End Workflow)

```
[ COMPANY ]                     [ CANDIDATE ]                     [ ADMINISTRATOR ]
     |                                |                                   |
     |-- Unggah Dokumen Legal ------> |                                   |
     |                                |                                   |-- Verifikasi Perusahaan
     |                                |                                   |
     |-- Terbitkan Lowongan Kerja --->|                                   |
     |                                |-- Jelajahi & Cari Lowongan        |
     |                                |-- Review Skor Kecocokan Skill     |
     |                                |-- Kirim Lamaran Pekerjaan ------> |
     |                                |                                   |
     |<-- Terima Berkas Pelamar ------|                                   |
     |-- Screening Kualifikasi        |                                   |
     |-- Jadwalkan Wawancara -------->|-- Terima Notifikasi Interview     |
     |                                |-- Hadiri Wawancara Online/Offline |
     |-- Selesaikan Wawancara         |                                   |
     |-- Catat Evaluasi Recruiter     |                                   |
     |-- Keputusan: DITERIMA / DITOLAK                                   |
     |                                |-- Terima Status Akhir & Milestone |
     v                                v                                   v
```

---

## 15. Kesiapan Deployment (Deployment Preparation)

### Kebutuhan Server Produksi:
- Web Server: Nginx atau Apache dengan dukungan HTTPS/SSL.
- PHP `>= 8.2` dengan FPM dan ekstensi lengkap.
- MySQL `>= 8.0` atau MariaDB `>= 10.5`.
- Reverse Proxy atau Virtual Host terpisah untuk frontend dan backend, atau menyatukan bundle build frontend ke dalam folder `public` Laravel.

### Build Frontend untuk Produksi:
```bash
cd frontend
npm run build
```
Hasil kompilasi produksi yang teroptimasi, ter-minifikasi, dan siap saji berada pada direktori:
**`frontend/dist/`**

### Optimasi Backend Laravel Produksi:
```bash
cd backend
composer install --optimize-autoloader --no-dev
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## 16. Keamanan Sistem (Security Checklist)

- [x] **Autentikasi Token Aman**: Menggunakan Laravel Sanctum dengan personal access tokens.
- [x] **Pencegahan IDOR (Insecure Direct Object References)**: Pemeriksaan kepemilikan entitas (*ownership verification*) di setiap controller (`$company->id === $job->company_id`).
- [x] **Enkripsi Kata Sandi**: Seluruh kata sandi di-hash menggunakan algoritma Bcrypt (`Hash::make`).
- [x] **Validasi File Upload**: Validasi tipe MIME (PDF, DOCX, JPG, PNG) dan pembatasan ukuran berkas maksimal untuk mencegah *arbitrary file upload*.
- [x] **Perlindungan Rahasia (.env)**: File `.env` dan kredensial sensitif dikecualikan dari repositori melalui `.gitignore`.
- [x] **CORS & CSRF Safeguards**: Pengaturan CORS terdefinisi untuk origin domain yang diizinkan.

---

## 17. Panduan Alur Presentasi & Demo (15-Step Demo Checklist)

Gunakan alur 15 langkah berikut untuk mendemonstrasikan sistem secara optimal saat presentasi:

1. **Buka Landing Page** (`http://localhost:5173`) & tunjukkan fitur publik, cara kerja, dan lowongan unggulan.
2. **Daftarkan / Login sebagai Recruiter** (klik *Daftar Sekarang* dan pilih role Perusahaan, atau login dengan akun yang telah didaftarkan).
3. **Buka Dashboard Perusahaan** & tunjukkan 8 metrik ringkasan rekrutmen.
4. **Buat Lowongan Pekerjaan Baru** pada menu *Lowongan Kerja* dengan memilih spesifikasi skill tertentu.
5. **Logout** dari akun perusahaan.
6. **Daftarkan / Login sebagai Kandidat** (klik *Daftar Sekarang* dan pilih role Pencari Kerja, atau login dengan akun kandidat).
7. **Buka Dashboard Kandidat** & periksa kelengkapan profil dan skill yang dimiliki.
8. **Buka Halaman Cari Lowongan** & temukan lowongan yang baru saja dibuat oleh perusahaan.
9. **Tinjau Skor Kecocokan Skill (Matching Preview)** pada halaman detail lowongan (misal 100% atau 75%).
10. **Kirim Lamaran Pekerjaan** beserta cover letter.
11. **Buka Halaman Lamaran Saya** & tunjukkan timeline status lamaran yang berada pada tahap `Diajukan`.
12. **Login kembali sebagai Recruiter** & buka menu *Pelamar Masuk* untuk melihat lamaran kandidat yang baru masuk beserta persentase kecocokannya.
13. **Ubah Status ke Screening & Buat Jadwal Wawancara** (tentukan tanggal, jam, metode online, dan link Google Meet/Zoom).
14. **Login sebagai Kandidat** & tunjukkan notifikasi baru serta jadwal wawancara pada menu *Jadwal Wawancara*.
15. **Login sebagai Recruiter & Finalisasi**, tandai wawancara selesai dan ubah status akhir pelamar menjadi `Diterima` (*Accepted*), lalu verifikasi pembaruan status akhir pada sisi kandidat.

---

## 18. Kontributor & Lisensi

- **Pengembang**: Tim Pengembang Workshop RPL / Sistem Informasi Rekrutmen
- **Lisensi**: Proyek ini dikembangkan untuk keperluan akademik dan dilindungi lisensi MIT.
