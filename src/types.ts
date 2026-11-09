export type Role = 'admin' | 'kepsek' | 'guru' | 'musyrif' | 'santri';

export interface UserSession {
  username: string;
  nama: string;
  role: Role;
  peran: string[];
  siswa: string;
  wajibGanti: boolean;
  wali: string[];
}

export interface Pengguna {
  id: string;
  username: string;
  nama: string;
  role: Role;
  hash: string;
  peran: string;
  siswa?: string;
  wajib_ganti?: string;
  password?: string;
}

export interface Siswa {
  id: string;
  nis: string;
  nama: string;
  kelas: string;
  nisn?: string;
  kamar?: string;
}

export interface Presensi {
  id: string;
  tanggal: string;
  kelas: string;
  siswa: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpa';
  catatan?: string;
  oleh: string;
  mapel: string;
}

export interface Penilaian {
  id: string;
  tanggal: string;
  kelas: string;
  siswa: string;
  mapel: string;
  jenis: string;
  nilai: string;
  catatan?: string;
  oleh: string;
  tp?: string;
}

export interface Perilaku {
  id: string;
  tanggal: string;
  kelas: string;
  siswa: string;
  jenis: 'Positif' | 'Negatif';
  aspek: string;
  kejadian: string;
  poin: string;
  tindak_lanjut?: string;
  oleh: string;
}

export interface Ujian {
  id: string;
  tanggal: string;
  kelas: string;
  mapel: string;
  jenis: string;
  ruang: string;
  pengawas: string;
  hadir: string;
  catatan?: string;
  oleh: string;
  foto?: string;
}

export interface JenisNilai {
  id: string;
  mapel: string;
  nama: string;
  kategori: 'Formatif' | 'Sumatif';
}

export interface Mapel {
  id: string;
  nama: string;
  kelompok: string;
}

export interface TP {
  id: string;
  mapel: string;
  tingkat: string;
  lingkup: string;
  deskripsi: string;
  oleh: string;
}

export interface Pengaturan {
  id: string;
  kunci: string;
  nilai: string;
}

export interface Kelas {
  id: string;
  nama: string;
  wali: string;
  nipy?: string;
  target_ziyadah?: string;
  wali_user?: string;
  rapor_terbit?: string;
}

export interface Pengampu {
  id: string;
  username: string;
  kelas: string;
  mapel: string;
}

export interface Wali {
  id: string;
  periode: string;
  kelas: string;
  siswa: string;
  sakit: string;
  izin: string;
  alfa: string;
  catatan: string;
  oleh: string;
}

export interface Kegiatan {
  id: string;
  periode: string;
  kelas: string;
  siswa: string;
  jenis: 'Ekstrakurikuler' | 'Prestasi';
  kegiatan: string;
  nilai?: string;
  keterangan: string;
  oleh: string;
}

export interface RaporAkademikManual {
  id: string;
  periode: string;
  kelas: string;
  siswa: string;
  mapel: string;
  nilai?: string;
  deskripsi: string;
  oleh: string;
}

export interface PenilaianEkskul {
  id: string;
  periode: string;
  kelas: string;
  siswa: string;
  ekskul: string;
  predikat: 'A' | 'B' | 'C' | 'D';
  keterangan: string;
  oleh: string;
}

export interface NilaiPondok {
  id: string;
  periode: string;
  kelas: string;
  siswa: string;
  kategori: string;
  subjek: string;
  predikat: string;
  deskripsi: string;
  sumber: string;
  oleh: string;
}

export interface ItemMutabaah {
  id: string;
  nama: string;
  kelompok: string;
  urut: string;
}

export interface Mutabaah {
  id: string;
  tanggal: string;
  kelas: string;
  siswa: string;
  selesai: string; // comma separated IDs
  oleh: string;
}

export interface MI {
  id: string;
  periode: string;
  kelas: string;
  siswa: string;
  kecerdasan: string;
  sumber: 'Observasi' | 'Kuesioner';
  skor: string;
  catatan?: string;
  oleh: string;
}

export interface PetaMI {
  id: string;
  sumber: 'Kegiatan' | 'Mapel';
  nama: string;
  kecerdasan: string;
}

export interface Setoran {
  id: string;
  tanggal: string;
  kelas: string;
  siswa: string;
  jenis: 'Ziyadah' | 'Murojaah' | 'Tahsin';
  surat?: string;
  dari?: string;
  sampai?: string;
  materi?: string;
  kualitas: 'Mutqin' | 'Lancar' | 'Cukup' | 'Perlu Mengulang';
  catatan?: string;
  oleh: string;
}

export interface Piket {
  id: string;
  tanggal: string;
  kegiatan: string;
  kamar: string;
  musyrif: string;
  catatan?: string;
  foto?: string;
  rekap?: string; // counts e.g. "5,2,1,0,0,0"
  oleh: string;
}

export interface PiketAbsen {
  id: string;
  piket: string;
  siswa: string;
  status: string;
  keterangan?: string;
}

export interface KegiatanPiket {
  id: string;
  nama: string;
}

export interface SoalMI {
  id: string;
  kecerdasan: string;
  pernyataan: string;
}

export interface KuesionerMI {
  id: string;
  periode: string;
  kelas: string;
  siswa: string;
  tanggal: string;
  jawaban: string; // e.g. "q01:3,q02:4"
  oleh: string;
}

// Global Quran data: 114 Surahs
export const SURAH: [string, number][] = [
  ["Al-Fatihah", 7], ["Al-Baqarah", 286], ["Ali Imran", 200], ["An-Nisa", 176], ["Al-Ma'idah", 120],
  ["Al-An'am", 165], ["Al-A'raf", 206], ["Al-Anfal", 75], ["At-Taubah", 129], ["Yunus", 109],
  ["Hud", 123], ["Yusuf", 111], ["Ar-Ra'd", 43], ["Ibrahim", 52], ["Al-Hijr", 99],
  ["An-Nahl", 128], ["Al-Isra", 111], ["Al-Kahf", 110], ["Maryam", 98], ["Taha", 135],
  ["Al-Anbiya", 112], ["Al-Hajj", 78], ["Al-Mu'minun", 118], ["An-Nur", 64], ["Al-Furqan", 77],
  ["Asy-Syu'ara", 227], ["An-Naml", 93], ["Al-Qasas", 88], ["Al-Ankabut", 69], ["Ar-Rum", 60],
  ["Luqman", 34], ["As-Sajdah", 30], ["Al-Ahzab", 73], ["Saba", 54], ["Fatir", 45],
  ["Yasin", 83], ["As-Saffat", 182], ["Sad", 88], ["Az-Zumar", 75], ["Gafir", 85],
  ["Fussilat", 54], ["Asy-Syura", 53], ["Az-Zukhruf", 89], ["Ad-Dukhan", 59], ["Al-Jasiyah", 37],
  ["Al-Ahqaf", 35], ["Muhammad", 38], ["Al-Fath", 29], ["Al-Hujurat", 18], ["Qaf", 45],
  ["Az-Zariyat", 60], ["At-Tur", 49], ["An-Najm", 62], ["Al-Qamar", 55], ["Ar-Rahman", 78],
  ["Al-Waqi'ah", 96], ["Al-Hadid", 29], ["Al-Mujadalah", 22], ["Al-Hasyr", 24], ["Al-Mumtahanah", 13],
  ["As-Saff", 14], ["Al-Jumu'ah", 11], ["Al-Munafiqun", 11], ["At-Tagabun", 18], ["At-Talaq", 12],
  ["At-Tahrim", 12], ["Al-Mulk", 30], ["Al-Qalam", 52], ["Al-Haqqah", 52], ["Al-Ma'arij", 44],
  ["Nuh", 28], ["Al-Jinn", 28], ["Al-Muzzammil", 20], ["Al-Muddassir", 56], ["Al-Qiyamah", 40],
  ["Al-Insan", 31], ["Al-Mursalat", 50], ["An-Naba", 40], ["An-Nazi'at", 46], ["Abasa", 42],
  ["At-Takwir", 29], ["Al-Infitar", 19], ["Al-Mutaffifin", 36], ["Al-Insyiqaq", 25], ["Al-Buruj", 22],
  ["At-Tariq", 17], ["Al-A'la", 19], ["Al-Gasyiyah", 26], ["Al-Fajr", 30], ["Al-Balad", 20],
  ["Asy-Syams", 15], ["Al-Lail", 21], ["Ad-Duha", 11], ["Asy-Syarh", 8], ["At-Tin", 8],
  ["Al-Alaq", 19], ["Al-Qadr", 5], ["Al-Bayyinah", 8], ["Az-Zalzalah", 8], ["Al-Adiyat", 11],
  ["Al-Qari'ah", 11], ["At-Takasur", 8], ["Al-Asr", 3], ["Al-Humazah", 9], ["Al-Fil", 5],
  ["Quraisy", 4], ["Al-Ma'un", 7], ["Al-Kausar", 3], ["Al-Kafirun", 6], ["An-Nasr", 3],
  ["Al-Masad", 5], ["Al-Ikhlas", 4], ["Al-Falaq", 5], ["An-Nas", 6]
];

export const SURAH_AYAT: Record<string, number> = Object.fromEntries(SURAH);

export const KUAL = ['Mutqin', 'Lancar', 'Cukup', 'Perlu Mengulang'] as const;

export const KUAL_SKOR: Record<string, number> = {
  'Mutqin': 4,
  'Lancar': 3,
  'Cukup': 2,
  'Perlu Mengulang': 1
};

export const PRD = [
  'Berkembang Sangat Baik',
  'Berkembang Sesuai Harapan',
  'Mulai Berkembang',
  'Belum Berkembang'
] as const;

export const KAT_PONDOK = [
  'Syakhsiyyah Islamiyyah',
  'Languages',
  'Tahsin dan Tahfizh',
  'Multiple Intelligences',
  "I'dadi"
] as const;

export const KEL_PONDOK = ['Languages', "I'dadi"];

export const MI_LIST: [string, string][] = [
  ['Linguistik', 'kemampuan berbahasa: berbicara, menulis, membaca, dan menyampaikan gagasan dengan kata-kata'],
  ['Logis-Matematis', 'kemampuan berpikir logis, bernalar, dan memecahkan masalah yang berkaitan dengan angka'],
  ['Visual-Spasial', 'kemampuan membayangkan ruang, bentuk, dan warna serta menuangkannya dalam gambar atau rancangan'],
  ['Musikal', 'kepekaan terhadap nada, irama, dan melodi'],
  ['Kinestetik', 'kemampuan mengendalikan gerak tubuh dan keterampilan jasmani'],
  ['Interpersonal', 'kemampuan bekerja sama, memahami, dan berinteraksi dengan orang lain'],
  ['Intrapersonal', 'kemampuan memahami diri sendiri, mengelola emosi, dan menetapkan tujuan'],
  ['Naturalis', 'kepekaan terhadap alam, tumbuhan, hewan, dan lingkungan sekitar'],
  ['Eksistensial', 'kecenderungan merenungkan makna kehidupan dan pertanyaan mendasar tentang keberadaan'],
  ['Spiritual', 'kedekatan dengan nilai keimanan, ibadah, dan akhlak']
];

export const MI_NAMA = MI_LIST.map(x => x[0]);
export const MI_SUMBER = ['Observasi', 'Kuesioner'] as const;

export const PIKET_STATUS = [
  'Hadir Awal Waktu',
  'Hadir Tepat Waktu',
  'Hadir Terlambat',
  'Sakit',
  'Izin',
  'Tanpa Keterangan'
] as const;

export const PSH = ['Awal', 'Tepat', 'Terlambat', 'Sakit', 'Izin', 'TK'] as const;

export const ASPEK = ['Akhlak', 'Disiplin', 'Adab', 'Kebersihan', 'Ibadah', 'Tanggung Jawab'];

export const ST = ['Hadir', 'Izin', 'Sakit', 'Alpa'] as const;

export const KEL = [
  'Kelompok A (Umum)',
  'Kelompok B (Umum)',
  'Kelompok C (Peminatan)',
  'Mata Pelajaran Pondok',
  'Languages',
  "I'dadi"
];

export const MUTK = ['Ibadah Wajib', 'Ibadah Sunnah', 'Halaqah Quran'];

export const ITEM_AWAL: [string, string][] = [
  ['Tahajud', 'Ibadah Sunnah'],
  ['Sahur', 'Ibadah Sunnah'],
  ['Qobliyah Subuh', 'Ibadah Sunnah'],
  ['Subuh', 'Ibadah Wajib'],
  ['Halaqah Quran (Subuh)', 'Halaqah Quran'],
  ['Syuruk', 'Ibadah Sunnah'],
  ['Dhuha', 'Ibadah Sunnah'],
  ['Qobliyah Dzuhur', 'Ibadah Sunnah'],
  ['Dzuhur', 'Ibadah Wajib'],
  ["Ba'diyah Dzuhur", 'Ibadah Sunnah'],
  ['Ashar', 'Ibadah Wajib'],
  ['Halaqah Quran (Ashar)', 'Halaqah Quran'],
  ['Qobliyah Maghrib', 'Ibadah Sunnah'],
  ['Maghrib', 'Ibadah Wajib'],
  ['Isya', 'Ibadah Wajib'],
  ["Ba'diyah Isya", 'Ibadah Sunnah'],
  ['Halaqah Quran (Isya)', 'Halaqah Quran']
];

export const KEGIATAN_AWAL = [
  "Shalat Subuh Berjamaah",
  "Halaqah Quran",
  "Shalat Dzuhur Berjamaah",
  "Shalat Ashar Berjamaah",
  "Shalat Maghrib Berjamaah",
  "Shalat Isya Berjamaah",
  "Belajar Malam",
  "Apel Pagi"
];

export const SOAL_AWAL: [string, string][] = [
  ["Linguistik", "Saya senang membaca buku, artikel, atau kitab di waktu luang."],
  ["Linguistik", "Saya mudah menyampaikan pendapat dengan kata-kata, baik lisan maupun tulisan."],
  ["Linguistik", "Saya suka menulis cerita, puisi, atau catatan harian."],
  ["Linguistik", "Saya mudah mengingat kosakata baru, termasuk kosakata bahasa Arab atau Inggris."],
  ["Linguistik", "Saya suka berpidato, berdiskusi, atau bercerita di depan teman."],
  ["Logis-Matematis", "Saya senang berhitung dan mengerjakan soal-soal yang berhubungan dengan angka."],
  ["Logis-Matematis", "Saya suka mencari tahu sebab dan alasan dari suatu kejadian."],
  ["Logis-Matematis", "Saya senang memecahkan teka-teki, sudoku, atau soal logika."],
  ["Logis-Matematis", "Saya suka mengelompokkan dan mengurutkan sesuatu secara teratur."],
  ["Logis-Matematis", "Saya mudah menemukan pola atau aturan dalam suatu masalah."],
  ["Visual-Spasial", "Saya senang menggambar, mewarnai, atau mendesain sesuatu."],
  ["Visual-Spasial", "Saya mudah membayangkan bentuk dan letak benda dalam pikiran."],
  ["Visual-Spasial", "Saya mudah memahami peta, diagram, dan gambar."],
  ["Visual-Spasial", "Saya peka terhadap warna dan tata letak yang indah."],
  ["Visual-Spasial", "Saya lebih mudah mengingat sesuatu jika melihat gambarnya."],
  ["Musikal", "Saya mudah mengenali nada atau irama dari lagu, nasyid, atau lantunan yang saya dengar."],
  ["Musikal", "Saya senang bersenandung, bernyanyi, atau melantunkan bacaan dengan irama."],
  ["Musikal", "Saya suka memainkan alat musik, rebana, atau mengetukkan irama."],
  ["Musikal", "Saya mudah menghafal jika dibantu irama atau lagu."],
  ["Musikal", "Saya terganggu jika mendengar nada yang tidak tepat."],
  ["Kinestetik", "Saya senang kegiatan yang banyak bergerak seperti olahraga, pramuka, atau senam."],
  ["Kinestetik", "Saya sulit duduk diam dalam waktu lama."],
  ["Kinestetik", "Saya mudah belajar sesuatu dengan langsung mempraktikkannya."],
  ["Kinestetik", "Saya terampil memakai tangan, misalnya membuat kerajinan atau memperbaiki barang."],
  ["Kinestetik", "Gerakan badan saya luwes dan terkoordinasi."],
  ["Interpersonal", "Saya mudah berteman dan bergaul dengan siapa saja."],
  ["Interpersonal", "Saya senang belajar atau bekerja dalam kelompok."],
  ["Interpersonal", "Saya peka terhadap perasaan teman dan senang menolong."],
  ["Interpersonal", "Teman-teman sering meminta pendapat atau bantuan saya."],
  ["Interpersonal", "Saya mudah menjadi penengah ketika teman berselisih."],
  ["Intrapersonal", "Saya tahu dengan baik kelebihan dan kekurangan saya."],
  ["Intrapersonal", "Saya senang menyendiri untuk berpikir dan merenung."],
  ["Intrapersonal", "Saya punya target pribadi dan berusaha mencapainya."],
  ["Intrapersonal", "Saya mampu mengendalikan emosi dengan baik."],
  ["Intrapersonal", "Saya senang mengevaluasi apa yang sudah saya lakukan."],
  ["Naturalis", "Saya senang berada di alam terbuka seperti kebun, sawah, atau gunung."],
  ["Naturalis", "Saya suka merawat tanaman atau hewan."],
  ["Naturalis", "Saya mudah mengenali jenis tumbuhan dan hewan."],
  ["Naturalis", "Saya peduli terhadap kebersihan dan kelestarian lingkungan."],
  ["Naturalis", "Saya tertarik mengamati cuaca, bintang, dan gejala alam."],
  ["Eksistensial", "Saya sering bertanya tentang tujuan hidup dan makna keberadaan manusia."],
  ["Eksistensial", "Saya suka memikirkan hal-hal besar seperti alam semesta, kematian, dan akhirat."],
  ["Eksistensial", "Saya senang berdiskusi tentang pertanyaan mendasar tentang kehidupan."],
  ["Eksistensial", "Saya sering merenungkan apa yang ingin saya capai dalam hidup."],
  ["Eksistensial", "Saya tertarik memahami hikmah di balik suatu peristiwa."],
  ["Spiritual", "Saya merasa tenang dan dekat dengan Allah ketika beribadah."],
  ["Spiritual", "Saya berusaha menjaga shalat dan ibadah sunnah dengan penuh kesadaran."],
  ["Spiritual", "Saya senang membaca dan mempelajari Al-Qur'an dan hadits."],
  ["Spiritual", "Saya berusaha jujur dan berakhlak baik dalam setiap keadaan."],
  ["Spiritual", "Saya mudah bersyukur dan bersabar saat menghadapi masalah."]
];

export const DEF_SETTINGS: Record<string, string> = {
  tahun_ajaran: '2026/2027',
  semester: 'Ganjil',
  mulai: '2026-07-01',
  selesai: '2026-12-31',
  bobot_kehadiran: '20',
  bobot_sumatif: '30',
  bobot_formatif: '50',
  jenis_sumatif: 'UTS,UAS',
  status_hadir: 'Hadir',
  tuntas: '75',
  batas_cukup: '85',
  batas_baik: '95',
  sebutan: 'Santri',
  alamat_aplikasi: 'https://sadiga.granada.sch.id',
  nama_sekolah: 'SMP IT Granada',
  alamat_sekolah: 'Jl. Raya Pesantren No. 12, Granada',
  kota: 'Granada',
  tanggal_rapor: '2026-12-20',
  kepala_sekolah: 'Drs. H. Ahmad Fauzi, M.Pd.',
  nipy_kepala_sekolah: '197508122002121001',
  ambang_bsb: '90',
  ambang_bsh: '80',
  ambang_mb: '70',
  mut_bsb: '90',
  mut_bsh: '75',
  mut_mb: '50',
  sikap_bsb: '20',
  sikap_bsh: '10',
  sikap_mb: '0',
  tfz_bsb: '90',
  tfz_bsh: '75',
  tfz_mb: '50',
  mi_bsb: '3.5',
  mi_bsh: '2.75',
  mi_mb: '2',
  mi_w_obs: '40',
  mi_w_kues: '30',
  mi_w_keg: '30'
};
