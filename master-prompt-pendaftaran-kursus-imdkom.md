# PENGEMBANGAN SISTEM PENDAFTARAN KURSUS ONLINE IMDKOM

## 1. Tujuan Pengembangan

Saya ingin mengembangkan fitur pendaftaran kursus online untuk website IMDKOM.

Sistem ini harus memungkinkan calon peserta melakukan pendaftaran kursus tanpa harus membuat akun atau login terlebih dahulu.

Sistem pendaftaran harus terintegrasi dengan:

- Website IMDKOM.
- Firebase sebagai database utama.
- Google Spreadsheet sebagai penyimpanan data tambahan yang tersinkronisasi otomatis.
- Cloudinary untuk penyimpanan bukti pembayaran.
- WhatsApp untuk konfirmasi pendaftaran.
- Dashboard admin untuk pengelolaan dan verifikasi peserta.

Sistem harus menggunakan token atau kode unik sebagai identitas setiap pendaftaran. Token tersebut digunakan oleh peserta untuk melakukan tracking status pendaftaran dan melihat jadwal kursus.

Prioritaskan pengembangan berdasarkan alur bisnis dan logika sistem berikut.

---

## 2. Alur Utama Pendaftaran Peserta

### Tahap 1 — Pengunjung Masuk ke Website

1. Pengunjung membuka website IMDKOM.
2. Pengunjung tidak perlu login.
3. Pengunjung membuka halaman Kursus dan Pelatihan.
4. Pengunjung memilih program kursus yang ingin diikuti.
5. Sistem mengarahkan pengunjung ke halaman detail program.
6. Pada halaman detail program terdapat tombol atau link **Daftar**.

### Tahap 2 — Membuat Token Pendaftaran

Ketika pengunjung mengeklik tombol **Daftar** pada halaman detail program:

1. Sistem secara otomatis membuat token atau kode unik pendaftaran.
2. Token harus bersifat unik untuk setiap pendaftaran.
3. Token menjadi identitas utama yang menghubungkan seluruh data pendaftaran peserta.
4. Token akan digunakan untuk tracking pendaftaran dan identifikasi data di dashboard admin.
5. Token belum disimpan secara permanen ke database sampai peserta berhasil mengajukan formulir pendaftaran.
6. Jika peserta membatalkan proses pendaftaran sebelum pengajuan, token tidak boleh tersimpan di database.

Setiap token hanya boleh terhubung dengan satu data pendaftaran.

### Tahap 3 — Formulir Pendaftaran

Setelah mengeklik **Daftar**, peserta diarahkan ke halaman formulir pendaftaran.

Formulir harus menyesuaikan program kursus yang sebelumnya dipilih.

Program kursus otomatis terisi dan tidak perlu dipilih ulang oleh peserta.

#### A. Data Pribadi

1. **Nama peserta**
   - Wajib diisi.
   - Input teks.
   - Otomatis menggunakan format huruf kapital.

2. **Tempat dan tanggal lahir**
   - Wajib diisi.
   - Menggunakan date picker untuk tanggal lahir.

3. **NIK**
   - Field hanya muncul jika usia peserta sudah mencapai 17 tahun.
   - Perhitungan usia berdasarkan tanggal lahir.
   - NIK menjadi field wajib jika ditampilkan.

4. **Jenis kelamin**
   - Wajib diisi.
   - Menggunakan dropdown.

5. **Alamat saat ini**
   - Wajib diisi.
   - Input manual.

6. **Nomor telepon / WhatsApp**
   - Peserta dapat memasukkan lebih dari dua nomor.
   - Minimal satu nomor harus tersedia dan aktif.
   - Berikan keterangan bahwa nomor yang dimasukkan harus aktif.

#### B. Data Pendidikan dan Pekerjaan

7. **Pendidikan terakhir**
   - Sediakan dua kolom:
     - Asal sekolah atau perguruan tinggi.
     - Jurusan.

8. **Pekerjaan**
   - Input manual.

#### C. Data Program Kursus

9. **Program kursus**
   - Otomatis terisi berdasarkan program yang dipilih pada halaman sebelumnya.

10. **Alasan memilih program**
    - Menggunakan beberapa opsi pilihan.
    - Contoh:
      - Sama sekali belum bisa mengoperasikan.
      - Ingin memperdalam ilmu.
      - Ingin mendapatkan sertifikat.
      - Alasan lainnya.

11. **Sumber informasi mengenai IMDKOM**
    - Sediakan pilihan:
      - Sosial media.
      - Website.
      - Iklan.
      - Teman atau saudara.

---

## 3. Sistem Pembayaran

Setelah mengisi data pendaftaran, peserta akan masuk ke bagian pembayaran.

Sediakan dua metode pembayaran.

### A. QRIS Statis

Jika peserta memilih QRIS:

1. Sistem menampilkan QR Code pembayaran.
2. QR Code dapat disimpan oleh peserta.
3. Peserta memasukkan nominal pembayaran secara manual.
4. Peserta melakukan pembayaran menggunakan aplikasi pembayaran yang mendukung QRIS.

### B. Transfer Bank

Jika peserta memilih transfer bank:

1. Sistem menampilkan daftar rekening pembayaran IMDKOM.
2. Setiap nomor rekening memiliki tombol **Copy**.
3. Peserta dapat menyalin nomor rekening.
4. Informasi rekening dapat dikelola dan diubah melalui dashboard admin.

### C. Upload Bukti Pembayaran

Setelah melakukan pembayaran, peserta diminta mengunggah bukti pembayaran.

Ketentuan:

- Gunakan Cloudinary yang sudah digunakan pada website IMDKOM.
- Simpan URL bukti pembayaran ke Firebase.
- Hubungkan bukti pembayaran dengan token pendaftaran peserta.
- Bukti pembayaran nantinya dapat dilihat admin melalui dashboard.

### D. Kode Referral

Sediakan kolom kode referral.

Fungsinya:

- Peserta dapat memasukkan kode referral untuk mendapatkan potongan harga.
- Kode referral diperoleh dari informasi website atau media sosial IMDKOM.
- Sistem perlu menyiapkan mekanisme validasi kode referral.

---

## 4. Persetujuan dan Pengajuan Pendaftaran

Sebelum mengirimkan formulir, peserta harus melihat **Agreement Checkbox**.

Ketentuan:

1. Peserta wajib mencentang persetujuan.
2. Tombol **Daftar** tidak dapat diproses sebelum persetujuan diberikan.
3. Sistem melakukan validasi seluruh field wajib.
4. Setelah peserta mengeklik **Daftar** dan pengajuan berhasil, data pendaftaran disimpan ke Firebase.
5. Token unik disimpan bersama seluruh data peserta.
6. Data pendaftaran otomatis masuk ke daftar pengajuan di dashboard admin.
7. Data juga dikirim atau disinkronkan ke Google Spreadsheet.

Setelah pengajuan berhasil:

- Tampilkan notifikasi pendaftaran berhasil.
- Tampilkan token pendaftaran kepada peserta.
- Berikan instruksi agar peserta menyimpan token tersebut.
- Sediakan tombol untuk menyalin token.
- Arahkan peserta ke WhatsApp IMDKOM untuk melakukan konfirmasi otomatis.

Pesan WhatsApp harus menyertakan token pendaftaran sehingga admin dapat mengidentifikasi peserta dengan mudah.

Pesan harus menginformasikan bahwa peserta telah melakukan pendaftaran dan pembayaran.

---

## 5. Sistem Database

Gunakan dua media penyimpanan data.

### A. Firebase

Firebase menjadi database utama website.

Data yang harus disimpan meliputi:

- Token pendaftaran.
- Identitas peserta.
- Informasi pendidikan.
- Informasi pekerjaan.
- Program kursus yang dipilih.
- Alasan mengikuti kursus.
- Sumber informasi IMDKOM.
- Informasi pembayaran.
- Metode pembayaran.
- Nominal pembayaran.
- Kode referral jika digunakan.
- URL bukti pembayaran.
- Status pengajuan.
- Status verifikasi pembayaran.
- Status verifikasi data.
- Informasi jadwal kursus.

Seluruh data harus memiliki relasi dengan token pendaftaran masing-masing.

### B. Google Spreadsheet

Data pendaftaran juga harus tersinkronisasi secara otomatis ke Google Spreadsheet.

Spreadsheet berfungsi sebagai penyimpanan data tambahan dan memudahkan admin melakukan rekapitulasi peserta.

Pastikan proses sinkronisasi tidak membuat data ganda.

Firebase tetap menjadi sumber data utama.

---

## 6. Sistem Tracking Peserta

Peserta tidak perlu membuat akun untuk melakukan tracking.

Buat halaman khusus dengan nama:

**Tracking dan Jadwal Program Saya**

Alurnya:

1. Peserta membuka halaman Kursus di website.
2. Peserta mengeklik menu **Tracking dan Jadwal Program Saya**.
3. Sistem menampilkan formulir tracking.
4. Peserta memasukkan token pendaftaran.
5. Peserta memasukkan empat digit terakhir nomor telepon yang terdaftar.
6. Sistem melakukan validasi token dan nomor telepon.
7. Jika data cocok, peserta diarahkan ke halaman tracking pribadi.
8. Jika tidak cocok, sistem menampilkan pesan kesalahan.

### Informasi yang Ditampilkan di Halaman Tracking

Peserta dapat melihat perkembangan proses pendaftarannya.

Sediakan status berikut:

1. Pengajuan.
2. Verifikasi pembayaran.
3. Verifikasi data.
4. Jadwal terbit.
5. Lihat jadwal.

Setiap status harus menunjukkan apakah proses sudah selesai atau masih menunggu verifikasi admin.

Jika jadwal sudah diterbitkan, peserta dapat melihat informasi jadwal kursusnya.

Peserta hanya boleh melihat data yang terhubung dengan token dan nomor telepon yang berhasil diverifikasi.

---

## 7. Dashboard Admin

Buat sistem pengelolaan pendaftaran di dashboard admin.

Admin dapat melihat seluruh data pengajuan yang masuk secara otomatis.

### A. Daftar Pengajuan

Tampilkan daftar peserta yang telah mengajukan pendaftaran.

Informasi minimal:

- Token.
- Nama peserta.
- Nomor WhatsApp.
- Program kursus.
- Tanggal pendaftaran.
- Status pendaftaran.

Admin dapat membuka detail masing-masing peserta.

### B. Verifikasi Pembayaran

Admin dapat:

- Melihat nominal pembayaran.
- Melihat metode pembayaran.
- Melihat bukti pembayaran.
- Memeriksa kesesuaian pembayaran.
- Mengubah status menjadi terverifikasi jika sesuai.

Jika pembayaran belum sesuai, status tetap menunggu verifikasi.

### C. Verifikasi Data Peserta

Admin melakukan pengecekan data peserta.

Verifikasi dilakukan melalui follow-up WhatsApp kepada calon peserta jika diperlukan.

Jika data sudah benar:

- Admin memberikan status terverifikasi.
- Status verifikasi data berubah menjadi selesai.

### D. Pembuatan Jadwal

Setelah proses verifikasi selesai, admin dapat membuat jadwal kursus peserta.

Sediakan fasilitas untuk:

- Mengatur jadwal kursus.
- Menentukan informasi pelaksanaan kursus.
- Menyimpan jadwal peserta.
- Menghubungkan jadwal dengan token pendaftaran.

### E. Penerbitan Jadwal

Setelah jadwal selesai dibuat, admin mengeklik tombol **Terbitkan Jadwal**.

Setelah diterbitkan:

- Status jadwal peserta berubah menjadi terbit.
- Informasi jadwal dapat dilihat peserta melalui halaman tracking.
- Jadwal harus terhubung dengan token peserta yang bersangkutan.

---

## 8. Pengelolaan Rekening Pembayaran

Tambahkan pengaturan rekening pembayaran pada dashboard admin.

Admin dapat:

- Menambahkan rekening bank.
- Mengubah nomor rekening.
- Mengubah nama pemilik rekening.
- Mengaktifkan atau menonaktifkan rekening.
- Mengelola informasi QRIS statis yang ditampilkan kepada peserta.

Informasi pembayaran yang ditampilkan di halaman pendaftaran harus mengikuti pengaturan aktif dari admin.

---

## 9. Logika Status Pendaftaran

Gunakan status terpisah untuk setiap tahapan agar proses dapat dipantau dengan jelas.

| Tahapan | Status |
|---|---|
| Pengajuan | Menunggu / Diterima |
| Verifikasi pembayaran | Menunggu / Terverifikasi |
| Verifikasi data | Menunggu / Terverifikasi |
| Jadwal | Belum dibuat / Dibuat |
| Penerbitan jadwal | Belum terbit / Terbit |

Status harus tersimpan di Firebase dan dapat dibaca oleh dashboard admin maupun halaman tracking peserta.

Perubahan status oleh admin harus langsung tercermin pada halaman tracking peserta.

---

## 10. Persyaratan Teknis dan Keamanan

Pastikan implementasi memenuhi ketentuan berikut:

1. Jangan mengharuskan peserta membuat akun untuk mendaftar.
2. Setiap pengajuan memiliki token unik.
3. Token harus dibuat dengan mekanisme yang aman dan tidak mudah ditebak.
4. Token tidak disimpan permanen jika peserta belum mengajukan pendaftaran.
5. Validasi dilakukan pada sisi frontend dan backend.
6. Data peserta tidak boleh dapat diakses hanya dengan mengetahui token.
7. Tracking harus memverifikasi token dan empat digit terakhir nomor telepon.
8. Batasi percobaan verifikasi untuk mencegah penyalahgunaan.
9. Pastikan URL bukti pembayaran tersimpan dengan benar.
10. Pastikan sinkronisasi Firebase dan Google Spreadsheet tidak menghasilkan duplikasi.
11. Gunakan pengaturan akses berbasis role untuk dashboard admin.
12. Jangan mengekspos data pribadi peserta kepada pengunjung lain.
13. Pastikan proses pengajuan tidak menghasilkan data ganda ketika tombol diklik berulang kali.

---

## 11. Alur Besar Sistem

Secara keseluruhan, sistem harus berjalan dengan alur berikut:

1. Pengunjung website.
2. Halaman Kursus dan Pelatihan.
3. Pilih program kursus.
4. Halaman detail program.
5. Klik Daftar.
6. Generate token unik.
7. Formulir pendaftaran.
8. Pengisian data peserta.
9. Pilih metode pembayaran.
10. Pembayaran dan upload bukti.
11. Agreement Checkbox.
12. Pengajuan pendaftaran.
13. Simpan data ke Firebase.
14. Sinkronisasi Google Spreadsheet.
15. Konfirmasi WhatsApp.
16. Data masuk dashboard admin.
17. Verifikasi pembayaran.
18. Verifikasi data.
19. Pembuatan jadwal.
20. Terbitkan jadwal.
21. Peserta melakukan tracking.
22. Peserta melihat jadwal kursus.

---

## 12. Instruksi Pengembangan

Sebelum mulai melakukan coding:

1. Pelajari terlebih dahulu struktur website IMDKOM yang sudah ada.
2. Identifikasi framework, struktur folder, komponen, sistem routing, Firebase, dan integrasi Cloudinary yang sudah digunakan.
3. Jangan membuat ulang sistem yang sebenarnya sudah tersedia.
4. Gunakan kembali komponen dan konfigurasi yang sudah ada jika memungkinkan.
5. Pastikan fitur baru tidak merusak halaman dan fungsi website yang sudah berjalan.
6. Buat struktur database yang konsisten dan mudah dikembangkan.
7. Pisahkan logika pendaftaran, pembayaran, tracking, dan pengelolaan admin.
8. Terapkan validasi dan keamanan sejak awal.

### Tahapan Implementasi

**Fase 1: Form pendaftaran dan token unik.**

**Fase 2: Pembayaran dan upload bukti pembayaran.**

**Fase 3: Integrasi Firebase dan Google Spreadsheet.**

**Fase 4: Dashboard admin dan verifikasi peserta.**

**Fase 5: Tracking peserta dan jadwal kursus.**

**Fase 6: Pengujian keseluruhan alur dan keamanan sistem.**

Untuk setiap fase, pastikan seluruh proses dapat berjalan dan diuji sebelum melanjutkan ke fase berikutnya.

### Hasil Akhir yang Diharapkan

Sebuah sistem pendaftaran kursus online IMDKOM yang terintegrasi, mudah digunakan oleh peserta tanpa login, memiliki token unik untuk setiap pendaftaran, menyediakan proses pembayaran, memungkinkan admin melakukan verifikasi, serta memberikan fasilitas tracking dan informasi jadwal kursus secara mandiri kepada peserta.

Jangan hanya membuat UI atau tampilan statis. Seluruh tombol, formulir, validasi, penyimpanan data, perubahan status, dan integrasi harus memiliki fungsi yang benar-benar berjalan.
