import { supabase } from './supabase';
import {
  DEF_SETTINGS,
  ITEM_AWAL,
  KEGIATAN_AWAL,
  KUAL_SKOR,
  MI_LIST,
  MI_NAMA,
  MI_SUMBER,
  Pengaturan,
  Pengguna,
  PIKET_STATUS,
  PRD,
  Role,
  Siswa,
  SOAL_AWAL,
  SURAH_AYAT,
  UserSession
} from '../types';

export const SALT = 'SADIGA';

// Helper to hash passwords consistently in JS
export function hash(pwd: string): string {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  const str = SALT + pwd;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const p1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const p2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `hash_${p1}${p2}${p1}${p2}`;
}

export function sandiAcak(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < 7; i++) {
    s += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return s;
}

export function getUuid(): string {
  return 'u_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

const STORAGE_KEY = 'sadiga_db_v1';
const SCRIPT_URL_KEY = 'sadiga_apps_script_url';

export interface DatabaseState {
  Pengguna: any[];
  Siswa: any[];
  Presensi: any[];
  Penilaian: any[];
  Perilaku: any[];
  Ujian: any[];
  JenisNilai: any[];
  Mapel: any[];
  TP: any[];
  Pengaturan: any[];
  Kelas: any[];
  Pengampu: any[];
  Wali: any[];
  Kegiatan: any[];
  NilaiPondok: any[];
  ItemMutabaah: any[];
  Mutabaah: any[];
  MI: any[];
  PetaMI: any[];
  Setoran: any[];
  Piket: any[];
  PiketAbsen: any[];
  KegiatanPiket: any[];
  SoalMI: any[];
  KuesionerMI: any[];
  RaporAkademikManual: any[];
}

function getInitialDb(): DatabaseState {
  const pengaturan: Pengaturan[] = Object.entries(DEF_SETTINGS).map(([kunci, nilai], idx) => ({
    id: `p_${idx + 1}`,
    kunci,
    nilai
  }));

  const itemMutabaah = ITEM_AWAL.map((x, i) => ({
    id: 'm' + (i < 9 ? '0' : '') + (i + 1),
    nama: x[0],
    kelompok: x[1],
    urut: String(i + 1)
  }));

  const soalMI = SOAL_AWAL.map((x, i) => ({
    id: 'q' + (i < 9 ? '0' : '') + (i + 1),
    kecerdasan: x[0],
    pernyataan: x[1]
  }));

  const kegiatanPiket = KEGIATAN_AWAL.map((x, i) => ({
    id: 'k' + (i + 1),
    nama: x
  }));

  const mapel = [
    { id: 'm1', nama: 'Pendidikan Agama Islam', kelompok: 'Kelompok A (Umum)' },
    { id: 'm2', nama: 'Bahasa Indonesia', kelompok: 'Kelompok A (Umum)' },
    { id: 'm3', nama: 'Matematika', kelompok: 'Kelompok A (Umum)' },
    { id: 'm4', nama: 'Ilmu Pengetahuan Alam', kelompok: 'Kelompok A (Umum)' },
    { id: 'm5', nama: 'Bahasa Arab', kelompok: 'Languages' },
    { id: 'm6', nama: 'Bahasa Inggris', kelompok: 'Languages' },
    { id: 'm7', nama: "Tahfizh & Tajwid Al-Qur'an", kelompok: 'Mata Pelajaran Pondok' },
    { id: 'm8', nama: 'Aqidah Akhlak', kelompok: "I'dadi" },
    { id: 'm9', nama: 'Fiqih Ibadah', kelompok: "I'dadi" }
  ];

  const jenisNilai = [
    { id: 'jn1', mapel: 'Pendidikan Agama Islam', nama: 'Tugas Harian', kategori: 'Formatif' },
    { id: 'jn2', mapel: 'Pendidikan Agama Islam', nama: 'Ulangan Harian', kategori: 'Formatif' },
    { id: 'jn3', mapel: 'Pendidikan Agama Islam', nama: 'UTS', kategori: 'Sumatif' },
    { id: 'jn4', mapel: 'Pendidikan Agama Islam', nama: 'UAS', kategori: 'Sumatif' },
    { id: 'jn5', mapel: 'Bahasa Arab', nama: 'Hifdz Mufradat', kategori: 'Formatif' },
    { id: 'jn6', mapel: 'Bahasa Arab', nama: 'Ujian Lisan', kategori: 'Sumatif' },
    { id: 'jn7', mapel: 'Bahasa Arab', nama: 'Ujian Tulis', kategori: 'Sumatif' }
  ];

  const kelas = [
    { id: 'k1', nama: '7A Putra', wali: 'Ustadz Ahmad Al-Farisi', nipy: '19850110201001', target_ziyadah: '100', wali_user: 'ustadz.ahmad', rapor_terbit: 'ya' },
    { id: 'k2', nama: '7B Putra', wali: 'Ustadz Bilal Ramadhan', nipy: '19880415201201', target_ziyadah: '100', wali_user: 'ustadz.bilal', rapor_terbit: '' },
    { id: 'k3', nama: '8A Putra', wali: 'Ustadz Zaid Habiburrahman', nipy: '19820719200801', target_ziyadah: '120', wali_user: 'ustadz.zaid', rapor_terbit: 'ya' }
  ];

  const siswa = [
    { id: 's1', nis: '26001', nisn: '0081234501', nama: 'Muhammad Fatih Robbani', kelas: '7A Putra', kamar: 'Abu Bakar - 01', jk: 'L' },
    { id: 's2', nis: '26002', nisn: '0081234502', nama: 'Ahmad Rayyan Al-Ghifari', kelas: '7A Putra', kamar: 'Abu Bakar - 01', jk: 'L' },
    { id: 's3', nis: '26003', nisn: '0081234503', nama: 'Hasan Basri Al-Faqih', kelas: '7A Putra', kamar: 'Abu Bakar - 02', jk: 'L' },
    { id: 's4', nis: '26004', nisn: '0081234504', nama: 'Zaid bin Tsabit', kelas: '7A Putra', kamar: 'Abu Bakar - 02', jk: 'L' },
    { id: 's5', nis: '26005', nisn: '0081234505', nama: 'Umar Khalid Wardana', kelas: '7A Putra', kamar: 'Abu Bakar - 03', jk: 'L' },
    { id: 's6', nis: '26006', nisn: '0081234506', nama: 'Farhan Az-Zuhri', kelas: '7B Putra', kamar: 'Umar - 01', jk: 'L' },
    { id: 's7', nis: '26007', nisn: '0081234507', nama: 'Ibrahim Khalilurrahman', kelas: '7B Putra', kamar: 'Umar - 01', jk: 'L' },
    { id: 's8', nis: '26008', nisn: '0081234508', nama: 'Salman Al-Farisi', kelas: '8A Putra', kamar: 'Utsman - 01', jk: 'L' }
  ];

  const pengguna: Pengguna[] = [
    { id: 'u1', username: 'admin', nama: 'Administrator Granada', role: 'admin', hash: hash('admin123'), peran: 'admin' },
    { id: 'u1b', username: 'mudir', nama: 'Mudir Granada', role: 'mudir', hash: hash('mudir123'), peran: 'mudir' },
    { id: 'u2', username: 'kepsek', nama: 'Drs. H. Ahmad Fauzi, M.Pd.', role: 'kepsek', hash: hash('kepsek123'), peran: 'kepsek' },
    { id: 'u3', username: 'ustadz.ahmad', nama: 'Ustadz Ahmad Al-Farisi', role: 'guru', hash: hash('guru123'), peran: 'guru', wajib_ganti: '' },
    { id: 'u4', username: 'musyrif.zaid', nama: 'Ustadz Zaid Musyrif', role: 'musyrif', hash: hash('musyrif123'), peran: 'musyrif' },
    { id: 'u5', username: '26001', nama: 'Muhammad Fatih Robbani', role: 'santri', hash: hash('santri123'), peran: 'santri', siswa: 's1', wajib_ganti: '' }
  ];

  const tp = [
    { id: 'tp1', mapel: 'Pendidikan Agama Islam', tingkat: '7', lingkup: 'Al-Qur\'an dan Hadits', deskripsi: 'memahami ketentuan hukum bacaan Alif Lam Syamsiyah dan Alif Lam Qamariyah serta menerapkannya dalam tilawah', oleh: 'ustadz.ahmad' },
    { id: 'tp2', mapel: 'Pendidikan Agama Islam', tingkat: '7', lingkup: 'Aqidah Islamiyah', deskripsi: 'meneladani sifat-sifat mulia Asmaul Husna Al-Alim, Al-Khabir, As-Sami, dan Al-Bashir dalam keseharian', oleh: 'ustadz.ahmad' },
    { id: 'tp3', mapel: 'Bahasa Arab', tingkat: '7', lingkup: 'Ta\'aruf wa Tarkib', deskripsi: 'mampu melakukan percakapan perkenalan diri dan memahami struktur mubtada-khabar sederhana', oleh: 'ustadz.ahmad' }
  ];

  const petaMI = [
    { id: 'pmi1', sumber: 'Mapel', nama: 'Bahasa Arab', kecerdasan: 'Linguistik' },
    { id: 'pmi2', sumber: 'Mapel', nama: 'Bahasa Indonesia', kecerdasan: 'Linguistik' },
    { id: 'pmi3', sumber: 'Mapel', nama: 'Matematika', kecerdasan: 'Logis-Matematis' },
    { id: 'pmi4', sumber: 'Mapel', nama: 'Ilmu Pengetahuan Alam', kecerdasan: 'Naturalis' },
    { id: 'pmi5', sumber: 'Mapel', nama: 'Aqidah Akhlak', kecerdasan: 'Spiritual' },
    { id: 'pmi6', sumber: 'Kegiatan', nama: 'Panahan & Futsal', kecerdasan: 'Kinestetik' },
    { id: 'pmi7', sumber: 'Kegiatan', nama: 'Khitobah & Muhadharah', kecerdasan: 'Linguistik' },
    { id: 'pmi8', sumber: 'Kegiatan', nama: 'Pramuka Penggalang', kecerdasan: 'Interpersonal' }
  ];

  const pengampu = [
    { id: 'pg1', username: 'ustadz.ahmad', kelas: '7A Putra', mapel: 'Pendidikan Agama Islam' },
    { id: 'pg2', username: 'ustadz.ahmad', kelas: '7A Putra', mapel: 'Bahasa Arab' },
    { id: 'pg3', username: 'ustadz.ahmad', kelas: '7B Putra', mapel: 'Bahasa Arab' }
  ];

  const mutabaah = [
    { id: 'mt1', tanggal: '2026-11-08', kelas: '7A Putra', siswa: 'Muhammad Fatih Robbani', selesai: 'm01,m03,m04,m05,m07,m08,m09,m10,m11,m12,m13,m14,m15,m16,m17', oleh: 'musyrif.zaid' },
    { id: 'mt2', tanggal: '2026-11-07', kelas: '7A Putra', siswa: 'Muhammad Fatih Robbani', selesai: 'm03,m04,m05,m08,m09,m11,m14,m15,m17', oleh: 'musyrif.zaid' },
    { id: 'mt3', tanggal: '2026-11-08', kelas: '7A Putra', siswa: 'Ahmad Rayyan Al-Ghifari', selesai: 'm03,m04,m05,m09,m11,m14,m15', oleh: 'musyrif.zaid' }
  ];

  const setoran = [
    { id: 'st1', tanggal: '2026-11-08', kelas: '7A Putra', siswa: 'Muhammad Fatih Robbani', jenis: 'Ziyadah', surat: 'An-Naba', dari: '1', sampai: '20', materi: '', kualitas: 'Mutqin', catatan: 'Makharijul huruf sangat baik', oleh: 'ustadz.ahmad' },
    { id: 'st2', tanggal: '2026-11-06', kelas: '7A Putra', siswa: 'Muhammad Fatih Robbani', jenis: 'Murojaah', surat: 'An-Nazi\'at', dari: '1', sampai: '46', materi: '', kualitas: 'Lancar', catatan: 'Lancar, perhatikan dengung', oleh: 'ustadz.ahmad' },
    { id: 'st3', tanggal: '2026-11-05', kelas: '7A Putra', siswa: 'Muhammad Fatih Robbani', jenis: 'Tahsin', surat: '', dari: '', sampai: '', materi: 'Jilid 4 hal 15', kualitas: 'Lancar', catatan: 'Mad thabi\'i konsisten', oleh: 'ustadz.ahmad' }
  ];

  const perilaku = [
    { id: 'pr1', tanggal: '2026-11-04', kelas: '7A Putra', siswa: 'Muhammad Fatih Robbani', jenis: 'Positif', aspek: 'Akhlak', kejadian: 'Membantu merapikan sajadah masjid dan mengimami shalat sunnah', poin: '10', tindak_lanjut: 'Diberikan apresiasi di halaqah', oleh: 'musyrif.zaid' },
    { id: 'pr2', tanggal: '2026-11-06', kelas: '7A Putra', siswa: 'Muhammad Fatih Robbani', jenis: 'Positif', aspek: 'Disiplin', kejadian: 'Hadir halaqah paling awal dan membantu memimpin tilawah', poin: '5', tindak_lanjut: 'Pertahankan keteladanan', oleh: 'ustadz.ahmad' }
  ];

  const penilaian = [
    { id: 'pn1', tanggal: '2026-10-15', kelas: '7A Putra', siswa: 'Muhammad Fatih Robbani', mapel: 'Pendidikan Agama Islam', jenis: 'Tugas Harian', nilai: '92', catatan: 'Sangat rapi dan lengkap', oleh: 'ustadz.ahmad', tp: 'tp1' },
    { id: 'pn2', tanggal: '2026-10-22', kelas: '7A Putra', siswa: 'Muhammad Fatih Robbani', mapel: 'Pendidikan Agama Islam', jenis: 'Ulangan Harian', nilai: '88', catatan: 'Pemahaman konsep bagus', oleh: 'ustadz.ahmad', tp: 'tp2' },
    { id: 'pn3', tanggal: '2026-10-30', kelas: '7A Putra', siswa: 'Muhammad Fatih Robbani', mapel: 'Pendidikan Agama Islam', jenis: 'UTS', nilai: '90', catatan: '', oleh: 'ustadz.ahmad', tp: 'tp1' },
    { id: 'pn4', tanggal: '2026-10-15', kelas: '7A Putra', siswa: 'Muhammad Fatih Robbani', mapel: 'Bahasa Arab', jenis: 'Hifdz Mufradat', nilai: '95', catatan: 'Hafalan kosa kata mutqin', oleh: 'ustadz.ahmad', tp: 'tp3' },
    { id: 'pn5', tanggal: '2026-10-28', kelas: '7A Putra', siswa: 'Muhammad Fatih Robbani', mapel: 'Bahasa Arab', jenis: 'Ujian Lisan', nilai: '90', catatan: 'Fasih bertutur bahasa Arab', oleh: 'ustadz.ahmad', tp: 'tp3' },
    { id: 'pn6', tanggal: '2026-10-15', kelas: '7A Putra', siswa: 'Ahmad Rayyan Al-Ghifari', mapel: 'Pendidikan Agama Islam', jenis: 'Tugas Harian', nilai: '84', catatan: '', oleh: 'ustadz.ahmad', tp: 'tp1' }
  ];

  const presensi = [
    { id: 'ps1', tanggal: '2026-10-15', kelas: '7A Putra', siswa: 'Muhammad Fatih Robbani', mapel: 'Pendidikan Agama Islam', status: 'Hadir', catatan: '', oleh: 'ustadz.ahmad' },
    { id: 'ps2', tanggal: '2026-10-22', kelas: '7A Putra', siswa:
