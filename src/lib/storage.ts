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

// Helper untuk mengubah nama modul aplikasi ke nama tabel Supabase (snake_case)
function getTableName(sheetName: string): string {
  const map: Record<string, string> = {
    ItemMutabaah: 'item_mutabaah',
    JenisNilai: 'jenis_nilai',
    KegiatanPiket: 'kegiatan_piket',
    NilaiPondok: 'nilai_pondok',
    PetaMI: 'peta_mi',
    PiketAbsen: 'piket_absen',
    SoalMI: 'soal_mi',
    KuesionerMI: 'kuesioner_mi',
    RaporAkademikManual: 'rapor_akademik_manual'
  };
  return map[sheetName] || sheetName.toLowerCase();
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
    { id: 'ps2', tanggal: '2026-10-22', kelas: '7A Putra', siswa: 'Muhammad Fatih Robbani', mapel: 'Pendidikan Agama Islam', status: 'Hadir', catatan: '', oleh: 'ustadz.ahmad' },
    { id: 'ps3', tanggal: '2026-10-29', kelas: '7A Putra', siswa: 'Muhammad Fatih Robbani', mapel: 'Pendidikan Agama Islam', status: 'Hadir', catatan: '', oleh: 'ustadz.ahmad' },
    { id: 'ps4', tanggal: '2026-10-15', kelas: '7A Putra', siswa: 'Muhammad Fatih Robbani', mapel: 'Bahasa Arab', status: 'Hadir', catatan: '', oleh: 'ustadz.ahmad' },
    { id: 'ps5', tanggal: '2026-10-22', kelas: '7A Putra', siswa: 'Muhammad Fatih Robbani', mapel: 'Bahasa Arab', status: 'Hadir', catatan: '', oleh: 'ustadz.ahmad' }
  ];

  const wali = [
    { id: 'w1', periode: '2026/2027 Ganjil', kelas: '7A Putra', siswa: 'Muhammad Fatih Robbani', sakit: '1', izin: '0', alfa: '0', catatan: 'Alhamdulillah ananda menunjukkan adab dan kesungguhan belajar yang sangat baik. Terus pertahankan kedisiplinan dan hafalan Al-Qur\'an.', oleh: 'ustadz.ahmad' }
  ];

  const kegiatan = [
    { id: 'kg1', periode: '2026/2027 Ganjil', kelas: '7A Putra', siswa: 'Muhammad Fatih Robbani', jenis: 'Ekstrakurikuler', kegiatan: 'Panahan & Futsal', nilai: 'A', keterangan: 'Aktif mengikuti latihan teknik dan memiliki kepemimpinan tim yang baik', oleh: 'ustadz.ahmad' },
    { id: 'kg2', periode: '2026/2027 Ganjil', kelas: '7A Putra', siswa: 'Muhammad Fatih Robbani', jenis: 'Prestasi', kegiatan: 'Juara 1 MHQ 2 Juz Antar Pesantren', nilai: '', keterangan: 'Tingkat Kabupaten, diselenggarakan Kemenag 2026', oleh: 'ustadz.ahmad' }
  ];

  const piket = [
    { id: 'pk1', tanggal: '2026-11-08', kegiatan: 'Shalat Subuh Berjamaah', kamar: 'Abu Bakar - 01', musyrif: 'Ustadz Zaid Musyrif', catatan: 'Santri bangun sebelum adzan dan membersihkan kamar', foto: '', rekap: '2,0,0,0,0,0', oleh: 'musyrif.zaid' }
  ];
  const piketAbsen = [
    { id: 'pka1', piket: 'pk1', siswa: 'Muhammad Fatih Robbani', status: 'Hadir Awal Waktu', keterangan: 'Muadzin' },
    { id: 'pka2', piket: 'pk1', siswa: 'Ahmad Rayyan Al-Ghifari', status: 'Hadir Awal Waktu', keterangan: '' }
  ];

  return {
    Pengguna: pengguna,
    Siswa: siswa,
    Presensi: presensi,
    Penilaian: penilaian,
    Perilaku: perilaku,
    Ujian: [],
    JenisNilai: jenisNilai,
    Mapel: mapel,
    TP: tp,
    Pengaturan: pengaturan,
    Kelas: kelas,
    Pengampu: pengampu,
    Wali: wali,
    Kegiatan: kegiatan,
    NilaiPondok: [],
    ItemMutabaah: itemMutabaah,
    Mutabaah: mutabaah,
    MI: [],
    PetaMI: petaMI,
    Setoran: setoran,
    Piket: piket,
    PiketAbsen: piketAbsen,
    KegiatanPiket: kegiatanPiket,
    SoalMI: soalMI,
    KuesionerMI: [],
    RaporAkademikManual: []
  };
}

class StorageEngine {
  public state: DatabaseState;
  private currentSession: UserSession | null = null;
  private appsScriptUrl: string = '';

  constructor() {
    this.appsScriptUrl = localStorage.getItem(SCRIPT_URL_KEY) || '';
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        this.state = JSON.parse(raw);
        if (!this.state.RaporAkademikManual) this.state.RaporAkademikManual = [];
      } catch {
        this.state = getInitialDb();
        this.saveLocal();
      }
    } else {
      this.state = getInitialDb();
      this.saveLocal();
    }
  }

  public getAppsScriptUrl(): string {
    return this.appsScriptUrl;
  }

  public setAppsScriptUrl(url: string) {
    this.appsScriptUrl = url.trim();
    localStorage.setItem(SCRIPT_URL_KEY, this.appsScriptUrl);
  }

  public exportBackup(): string {
    return JSON.stringify(this.state, null, 2);
  }

  public importBackup(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (typeof data === 'object' && data.Pengguna && data.Siswa) {
        this.state = data;
        this.saveLocal();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  public resetDatabase() {
    this.state = getInitialDb();
    this.saveLocal();
  }

  private saveLocal() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  }

  public getSession(): UserSession | null {
    if (this.currentSession) return this.currentSession;
    const raw = sessionStorage.getItem('sadiga_session');
    if (raw) {
      try {
        this.currentSession = JSON.parse(raw);
        return this.currentSession;
      } catch {
        return null;
      }
    }
    return null;
  }

  public setSession(session: UserSession | null) {
    this.currentSession = session;
    if (session) {
      sessionStorage.setItem('sadiga_session', JSON.stringify(session));
    } else {
      sessionStorage.removeItem('sadiga_session');
    }
  }

  // Settings lookup
  public getSettings(): Record<string, string> {
    const o = { ...DEF_SETTINGS };
    (this.state.Pengaturan || []).forEach(r => {
      if (r.kunci && r.nilai !== undefined && r.nilai !== '') {
        o[r.kunci] = r.nilai;
      }
    });
    return o;
  }

  public getPeriode(): string {
    const P = this.getSettings();
    return `${P.tahun_ajaran || ''} ${P.semester || ''}`.trim();
  }

  public getWaliKelas(username: string): string[] {
    return (this.state.Kelas || [])
      .filter(k => k.wali_user === username)
      .map(k => k.nama);
  }

  public getPengampu(username: string): any[] {
    return (this.state.Pengampu || []).filter(p => p.username === username);
  }

  // Authentication via Supabase / Local Fallback (Auto-Repair Hash)
  public async login(u: string, p: string): Promise<{ ok: boolean; msg?: string; token?: string; user?: UserSession }> {
    const un = String(u).trim();
    const computedHash = hash(p);
    let userRow: any = null;

    try {
      const { data, error } = await supabase
        .from('pengguna')
        .select('*')
        .ilike('username', un)
        .maybeSingle();

      if (!error && data) {
        userRow = data;
      }
    } catch (err) {
      console.warn('Gagal koneksi login Supabase, fallback ke local:', err);
    }

    // Fallback ke local state jika dari cloud tidak ditemukan
    if (!userRow) {
      userRow = (this.state.Pengguna || []).find(x => x.username.toLowerCase() === un.toLowerCase());
    }

    // Jika user tidak ada sama sekali
    if (!userRow) {
      return { ok: false, msg: 'Username tidak ditemukan.' };
    }

    // Verifikasi hash (toleran terhadap perbedaan huruf besar/kecil)
    const storedHash = String(userRow.hash || '').toLowerCase();
    const isPasswordValid = storedHash === computedHash.toLowerCase();

    if (!isPasswordValid) {
      return { ok: false, msg: 'Kata sandi salah.' };
    }

    const peranList = String(userRow.peran || userRow.role || 'guru')
      .split(',')
      .map(x => x.trim())
      .filter(Boolean);

    let role: Role = 'guru';
    if (peranList.includes('admin')) role = 'admin';
    else if (peranList.includes('mudir')) role = 'mudir';
    else if (peranList.length === 1 && peranList[0] === 'santri') role = 'santri';
    else if (peranList.length === 1 && peranList[0] === 'kepsek') role = 'kepsek';

    const user: UserSession = {
      username: userRow.username,
      nama: userRow.nama || userRow.username,
      role,
      peran: peranList,
      siswa: userRow.siswa || '',
      wajibGanti: userRow.wajib_ganti === '1',
      wali: this.getWaliKelas(userRow.username)
    };

    const token = getUuid();
    this.setSession(user);
    return { ok: true, token, user };
  }
  // Core API router
  public async api(action: string, sheetName: string, data?: any): Promise<any> {
    const user = this.getSession();
    if (!user) throw new Error('Sesi berakhir. Silakan masuk kembali.');

    switch (action) {
      case 'list':
        return this.list(sheetName);
      case 'save':
        return this.saveRow(sheetName, data);
      case 'saveMany':
        return this.saveManyRows(sheetName, data);
      case 'remove':
        return this.removeRow(sheetName, data);
      case 'rekap':
        return this.rekap(data);
      case 'rapor':
        return this.raporData(data);
      case 'raporPondok':
        return this.raporPondokData(data);
      case 'draftPondok':
        return this.draftPondok(data);
      case 'gantiSandi':
        return this.gantiSandi(data);
      case 'buatAkun':
        return this.buatAkun(data);
      case 'mutabaahSaya':
        return this.mutabaahSaya();
      case 'raporSaya':
        return this.raporSaya(data);
      case 'terbitkanRapor':
        return this.terbitkanRapor(data);
      case 'saveMI':
        return this.saveMI(data);
      case 'saveKuesioner':
        return this.saveKuesioner(data);
      case 'listPiket':
        return this.listPiket(data);
      case 'getPiket':
        return this.getPiket(data);
      case 'savePiket':
        return this.savePiket(data);
      case 'setKamar':
        return this.setKamar(data);
      default:
        throw new Error('Aksi tidak dikenal: ' + action);
    }
  }

  public list(sheetName: string): any[] {
    const list = this.state[sheetName as keyof DatabaseState] || [];
    
    // Background fetch dari Supabase menggunakan getTableName
    const tableName = getTableName(sheetName);
    supabase.from(tableName).select('*').then(({ data, error }) => {
      if (!error && data && data.length > 0) {
        (this.state as any)[sheetName] = data;
        this.saveLocal();
      }
    }).catch(() => {});

    return JSON.parse(JSON.stringify(list));
  }

  public async saveRow(sheetName: string, d: any): Promise<boolean> {
    const table = this.state[sheetName as keyof DatabaseState] as any[];
    if (!table) throw new Error('Modul tidak dikenal: ' + sheetName);

    const user = this.getSession()!;
    let ex = d.id ? table.find(r => r.id === d.id) : null;

    if (sheetName === 'Mutabaah' && !ex) {
      ex = table.find(r => r.siswa === d.siswa && r.tanggal === d.tanggal) || null;
      if (ex) d.id = ex.id;
    }

    if (sheetName === 'Pengguna') {
      if (table.some(r => r.username.toLowerCase() === d.username.toLowerCase() && r.id !== d.id)) {
        throw new Error('Username sudah dipakai.');
      }
      if (d.password) {
        d.hash = hash(d.password);
      } else if (ex) {
        d.hash = ex.hash;
      } else {
        throw new Error('Kata sandi wajib diisi.');
      }
      delete d.password;
    }

    if (!ex) {
      d.id = d.id || getUuid();
    }

    if (sheetName === 'ItemMutabaah' && !ex && !d.id) {
      d.id = 'm' + Date.now().toString(36);
    }

    if (['Wali', 'Kegiatan', 'NilaiPondok', 'MI'].includes(sheetName)) {
      d.periode = ex ? ex.periode : this.getPeriode();
    }

    if (sheetName === 'Kelas' && d.wali_user && !d.wali) {
      const w = this.state.Pengguna.find(u => u.username === d.wali_user);
      if (w) d.wali = w.nama;
    }

    if (sheetName === 'NilaiPondok') {
      d.sumber = 'manual';
    }

    if (!['Pengguna', 'Siswa', 'Mapel', 'JenisNilai', 'Pengaturan', 'Kelas', 'ItemMutabaah', 'PetaMI', 'KegiatanPiket', 'SoalMI', 'Pengampu'].includes(sheetName)) {
      d.oleh = ex ? ex.oleh : user.username;
    }

    if (ex) {
      const idx = table.findIndex(r => r.id === ex.id);
      table[idx] = { ...ex, ...d };
    } else {
      table.push(d);
    }

    this.saveLocal();

    try {
      const tableName = getTableName(sheetName);
      await supabase.from(tableName).upsert([d], { onConflict: 'id' });
    } catch (err) {
      console.warn('Gagal sync ke cloud:', err);
    }

    return true;
  }

  public async saveManyRows(sheetName: string, items: any[]): Promise<number> {
    const table = this.state[sheetName as keyof DatabaseState] as any[];
    if (!table) throw new Error('Modul tidak dikenal: ' + sheetName);
    const user = this.getSession()!;

    items.forEach(x => {
      x.id = getUuid();
      x.oleh = user.username;
      table.push(x);
    });

    this.saveLocal();

    try {
      const tableName = getTableName(sheetName);
      await supabase.from(tableName).upsert(items, { onConflict: 'id' });
    } catch (err) {
      console.warn('Gagal sync batch ke cloud:', err);
    }

    return items.length;
  }

  public async removeRow(sheetName: string, d: { id: string }): Promise<boolean> {
    const table = this.state[sheetName as keyof DatabaseState] as any[];
    if (!table) throw new Error('Modul tidak dikenal: ' + sheetName);

    const idx = table.findIndex(r => r.id === d.id);
    if (idx === -1) throw new Error('Data tidak ditemukan.');

    if (sheetName === 'Piket') {
      this.state.PiketAbsen = this.state.PiketAbsen.filter(a => a.piket !== d.id);
    }

    table.splice(idx, 1);
    this.saveLocal();

    try {
      const tableName = getTableName(sheetName);
      await supabase.from(tableName).delete().eq('id', d.id);
    } catch (err) {
      console.warn('Gagal hapus di cloud:', err);
    }

    return true;
  }

  public rekap(d: { kelas: string; mapel: string }): any[] {
    if (!d || !d.kelas || !d.mapel) throw new Error('Pilih kelas dan mata pelajaran.');
    const P = this.getSettings();
    const hadirStatus = (P.status_hadir || 'Hadir').split(',').map(s => s.trim()).filter(Boolean);
    const sumJ = (P.jenis_sumatif || 'UTS,UAS').split(',').map(s => s.trim()).filter(Boolean);
    const W = {
      h: parseFloat(P.bobot_kehadiran || '20') || 20,
      s: parseFloat(P.bobot_sumatif || '30') || 30,
      f: parseFloat(P.bobot_formatif || '50') || 50
    };

    const kat: Record<string, string> = {};
    (this.state.JenisNilai || []).forEach(j => {
      if (j.mapel === d.mapel && j.kategori) kat[j.nama] = j.kategori;
    });

    const isSum = (jName: string) => kat[jName] ? kat[jName] === 'Sumatif' : sumJ.includes(jName);

    const presensi = (this.state.Presensi || []).filter(r =>
      r.kelas === d.kelas &&
      r.mapel === d.mapel &&
      (!P.mulai || r.tanggal >= P.mulai) &&
      (!P.selesai || r.tanggal <= P.selesai)
    );

    const penilaian = (this.state.Penilaian || []).filter(r =>
      r.kelas === d.kelas &&
      r.mapel === d.mapel &&
      (!P.mulai || r.tanggal >= P.mulai) &&
      (!P.selesai || r.tanggal <= P.selesai)
    );

    const tingkatKelas = String(d.kelas || '').trim().split(/[\s\-_.]+/)[0];
    const tps = (this.state.TP || []).filter(t => t.mapel === d.mapel && t.tingkat === tingkatKelas);

    const students = (this.state.Siswa || []).filter(s => s.kelas === d.kelas);

    return students.map(s => {
      const p = presensi.filter(r => r.siswa === s.nama);
      const kh = p.length ? (100 * p.filter(r => hadirStatus.includes(r.status)).length) / p.length : null;

      const n = penilaian.filter(r => r.siswa === s.nama && !isNaN(parseFloat(r.nilai)));
      const val = (r: any) => parseFloat(String(r.nilai).replace(',', '.'));

      const sumScores = n.filter(r => isSum(r.jenis)).map(val);
      const formScores = n.filter(r => !isSum(r.jenis)).map(val);

      const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
      const su = avg(sumScores);
      const fo = avg(formScores);

      const parts: [number, number][] = [];
      if (kh !== null) parts.push([kh, W.h]);
      if (su !== null) parts.push([su, W.s]);
      if (fo !== null) parts.push([fo, W.f]);

      const ws = parts.reduce((t, x) => t + x[1], 0);
      const akhir = ws ? Math.round(parts.reduce((t, x) => t + x[0] * x[1], 0) / ws) : null;

      const ts = tps.map(t => {
        const scores = n.filter(r => r.tp === t.id).map(val);
        const v = avg(scores);
        return v === null ? null : { deskripsi: t.deskripsi, nilai: v };
      }).filter(Boolean) as { deskripsi: string; nilai: number }[];

      return {
        siswa: s.nama,
        kehadiran: kh !== null ? Math.round(kh) : null,
        sumatif: su !== null ? Math.round(su) : null,
        formatif: fo !== null ? Math.round(fo) : null,
        akhir,
        lengkap: parts.length === 3,
        deskripsi: this.deskripsiTP(ts, P)
      };
    });
  }

  private deskripsiTP(ts: { deskripsi: string; nilai: number }[], P: Record<string, string>): string {
    if (!ts.length) return 'Belum ada penilaian pada tujuan pembelajaran.';
    const T = parseFloat(P.tuntas || '75') || 75;
    const C = parseFloat(P.batas_cukup || '85') || 85;
    const B = parseFloat(P.batas_baik || '95') || 95;
    const S = P.sebutan || 'Santri';

    const clean = (x: string) => String(x).replace(/[.!?]+$/, '').trim();
    const join = (a: string[]) => {
      if (a.length < 2) return a[0] || '';
      if (a.length === 2) return a[0] + ' dan ' + a[1];
      return a.slice(0, -1).join(', ') + ', dan ' + a[a.length - 1];
    };

    const g: Record<string, string[]> = { sb: [], b: [], c: [], p: [] };
    ts.slice().sort((x, y) => y.nilai - x.nilai).forEach(t => {
      const k = t.nilai < T ? 'p' : t.nilai <= C ? 'c' : t.nilai <= B ? 'b' : 'sb';
      g[k].push(clean(t.deskripsi));
    });

    const seg: string[] = [];
    if (g.sb.length) seg.push('menunjukkan penguasaan yang sangat baik dalam ' + join(g.sb));
    if (g.b.length) seg.push('menunjukkan penguasaan yang baik dalam ' + join(g.b));
    if (g.c.length) seg.push('cukup mampu ' + join(g.c));

    let out = seg.length ? S + ' ' + seg.join('; ') + '.' : '';
    if (g.p.length) out += (out ? '\n' : '') + S + ' masih perlu bimbingan dalam ' + join(g.p) + '.';
    return out;
  }

  public raporData(d: { kelas: string; siswa?: string }): any {
    if (!d || !d.kelas) throw new Error('Pilih kelas.');
    const P = this.getSettings();
    const per = this.getPeriode();
    const mp = (this.state.Mapel || []).filter(m => !['Languages', "I'dadi", 'Kegiatan Pondok'].includes(m.kelompok));

    const R: Record<string, Record<string, any>> = {};
    mp.forEach(m => {
      R[m.nama] = {};
      this.rekap({ kelas: d.kelas, mapel: m.nama }).forEach(r => {
        R[m.nama][r.siswa] = r;
      });
    });

    const kls = (this.state.Kelas || []).find(k => k.nama === d.kelas) || {};
    const wali = (this.state.Wali || []).filter(w => w.kelas === d.kelas && w.periode === per);
    const keg = (this.state.Kegiatan || []).filter(k => k.kelas === d.kelas && k.periode === per);

    const URUT_KEL = ['Kelompok A (Umum)', 'Kelompok B (Umum)', 'Kelompok C (Peminatan)', 'Mata Pelajaran Pondok', 'Kegiatan Pondok'];
    const grp = (m: any) => m.kelompok || 'Mata Pelajaran';
    const names: string[] = [];
    mp.forEach(m => {
      const g = grp(m);
      if (!names.includes(g)) names.push(g);
    });
    names.sort((a, b) => {
      const i = URUT_KEL.indexOf(a), j = URUT_KEL.indexOf(b);
      return (i < 0 ? 99 : i) - (j < 0 ? 99 : j);
    });

    const slim = (k: any) => ({ kegiatan: k.kegiatan, nilai: k.nilai, keterangan: k.keterangan });

    const santri = (this.state.Siswa || [])
      .filter(s => s.kelas === d.kelas && (!d.siswa || s.nama === d.siswa))
      .map(s => {
        const w = wali.find(x => x.siswa === s.nama) || {};
        const mineKeg = keg.filter(k => k.siswa === s.nama);
        return {
          nama: s.nama,
          nisg: s.nis,
          nisn: s.nisn || '',
          kelompok: names.map(g => ({
            nama: g,
            rows: mp
              .filter(m => grp(m) === g && R[m.nama]?.[s.nama] && R[m.nama][s.nama].akhir !== null)
              .map(m => {
                const r = R[m.nama][s.nama];
                const manual = (this.state.RaporAkademikManual || []).find(x =>
                  x.periode === per &&
                  x.kelas === d.kelas &&
                  x.siswa === s.nama &&
                  x.mapel === m.nama
                );
                return {
                  mapel: m.nama,
                  nilai: manual && manual.nilai !== undefined && manual.nilai !== '' ? parseFloat(manual.nilai) : r.akhir,
                  deskripsi: manual && manual.deskripsi ? manual.deskripsi : r.deskripsi,
                  isManual: !!manual,
                  autoDeskripsi: r.deskripsi
                };
              })
          })).filter(g => g.rows.length > 0),
          sakit: w.sakit || '0',
          izin: w.izin || '0',
          alfa: w.alfa || '0',
          catatan: w.catatan || '',
          ekskul: mineKeg.filter(k => k.jenis === 'Ekstrakurikuler').map(slim),
          prestasi: mineKeg.filter(k => k.jenis === 'Prestasi').map(slim)
        };
      });

    return {
      tipe: 'akademik',
      kelas: d.kelas,
      tahun: P.tahun_ajaran,
      semester: P.semester,
      sekolah: {
        nama: P.nama_sekolah,
        alamat: P.alamat_sekolah,
        kota: P.kota,
        tanggal: P.tanggal_rapor,
        kepsek: P.kepala_sekolah,
        nipy: P.nipy_kepala_sekolah
      },
      wali: {
        nama: kls.wali || '',
        nipy: kls.nipy || ''
      },
      santri
    };
  }

  public raporPondokData(d: { kelas: string; siswa?: string }): any {
    if (!d || !d.kelas) throw new Error('Pilih kelas.');
    const P = this.getSettings();
    const per = this.getPeriode();
    const kls = (this.state.Kelas || []).find(k => k.nama === d.kelas) || {};
    const rows = (this.state.NilaiPondok || []).filter(r => r.kelas === d.kelas && r.periode === per);

    const KAT_PONDOK = ['Syakhsiyyah Islamiyyah', 'Languages', 'Tahsin dan Tahfizh', 'Multiple Intelligences', "I'dadi"];

    const santri = (this.state.Siswa || [])
      .filter(s => s.kelas === d.kelas && (!d.siswa || s.nama === d.siswa))
      .map(s => ({
        nama: s.nama,
        nisg: s.nis,
        nisn: s.nisn || '',
        kategori: KAT_PONDOK.map(k => ({
          nama: k,
          rows: rows.filter(r => r.siswa === s.nama && r.kategori === k).map(r => ({
            subjek: r.subjek,
            predikat: r.predikat,
            deskripsi: r.deskripsi
          }))
        })).filter(g => g.rows.length > 0)
      }));

    return {
      tipe: 'pondok',
      kelas: d.kelas,
      tahun: P.tahun_ajaran,
      semester: P.semester,
      sekolah: {
        nama: P.nama_sekolah,
        alamat: P.alamat_sekolah,
        kota: P.kota,
        tanggal: P.tanggal_rapor,
        kepsek: P.kepala_sekolah,
        nipy: P.nipy_kepala_sekolah
      },
      wali: {
        nama: kls.wali || '',
        nipy: kls.nipy || ''
      },
      santri
    };
  }

  public draftPondok(d: { kelas: string }): number {
    if (!d || !d.kelas) throw new Error('Pilih kelas.');
    const P = this.getSettings();
    const per = this.getPeriode();
    const user = this.getSession()!;
    const cand: any[] = [];

    const getPredikat = (x: number) => {
      if (x >= parseFloat(P.ambang_bsb || '90')) return PRD[0];
      if (x >= parseFloat(P.ambang_bsh || '80')) return PRD[1];
      if (x >= parseFloat(P.ambang_mb || '70')) return PRD[2];
      return PRD[3];
    };

    const pondokMapels = (this.state.Mapel || []).filter(m => ['Languages', "I'dadi"].includes(m.kelompok));
    pondokMapels.forEach(m => {
      this.rekap({ kelas: d.kelas, mapel: m.nama }).forEach(r => {
        if (r.akhir !== null) {
          cand.push({
            siswa: r.siswa,
            kategori: m.kelompok,
            subjek: m.nama,
            predikat: getPredikat(r.akhir),
            deskripsi: r.deskripsi
          });
        }
      });
    });

    const sikapRes = this.computeSikap(d.kelas, P);
    Object.keys(sikapRes).forEach(nm => {
      cand.push({
        siswa: nm,
        kategori: 'Syakhsiyyah Islamiyyah',
        subjek: 'Sikap dan Akhlak',
        predikat: sikapRes[nm].predikat,
        deskripsi: sikapRes[nm].deskripsi
      });
    });

    const mutRes = this.computeMutabaah(d.kelas, P);
    Object.keys(mutRes).forEach(nm => {
      mutRes[nm].forEach(g => {
        cand.push({
          siswa: nm,
          kategori: 'Syakhsiyyah Islamiyyah',
          subjek: "Mutaba'ah Yaumiyah - " + g.kelompok,
          predikat: g.predikat,
          deskripsi: g.deskripsi
        });
      });
    });

    const tfRes = this.computeTahfizh(d.kelas, P);
    Object.keys(tfRes).forEach(nm => {
      tfRes[nm].forEach(r => {
        cand.push({
          siswa: nm,
          kategori: 'Tahsin dan Tahfizh',
          subjek: r.subjek,
          predikat: r.predikat,
          deskripsi: r.deskripsi
        });
      });
    });

    const miRes = this.computeMI(d.kelas, P);
    Object.keys(miRes).forEach(nm => {
      miRes[nm].forEach(r => {
        cand.push({
          siswa: nm,
          kategori: 'Multiple Intelligences',
          subjek: r.subjek,
          predikat: r.predikat,
          deskripsi: r.deskripsi
        });
      });
    });

    if (!cand.length) {
      throw new Error("Belum ada data untuk dibuat draf.");
    }

    let count = 0;
    cand.forEach(c => {
      const old = this.state.NilaiPondok.find(x =>
        x.periode === per &&
        x.kelas === d.kelas &&
        x.siswa === c.siswa &&
        x.kategori === c.kategori &&
        x.subjek === c.subjek
      );

      if (old && old.sumber === 'manual') return;

      if (old) {
        Object.assign(old, c, { sumber: 'otomatis' });
      } else {
        this.state.NilaiPondok.push({
          id: getUuid(),
          periode: per,
          kelas: d.kelas,
          sumber: 'otomatis',
          oleh: user.username,
          ...c
        });
      }
      count++;
    });

    this.saveLocal();
    return count;
  }

  private computeSikap(kelas: string, P: Record<string, string>): Record<string, { predikat: string; deskripsi: string }> {
    const rows = (this.state.Perilaku || []).filter(r =>
      r.kelas === kelas &&
      (!P.mulai || r.tanggal >= P.mulai) &&
      (!P.selesai || r.tanggal <= P.selesai)
    );
    const out: Record<string, { predikat: string; deskripsi: string }> = {};

    const joinId = (a: string[]) => {
      if (a.length < 2) return a[0] || '';
      if (a.length === 2) return a[0] + ' dan ' + a[1];
      return a.slice(0, -1).join(', ') + ', dan ' + a[a.length - 1];
    };

    const pred = (x: number, a: number, b: number, c: number) =>
      x >= a ? PRD[0] : x >= b ? PRD[1] : x >= c ? PRD[2] : PRD[3];

    (this.state.Siswa || []).filter(s => s.kelas === kelas).forEach(s => {
      const mine = rows.filter(r => r.siswa === s.nama);
      if (!mine.length) return;

      let net = 0;
      const by: Record<string, number> = {};
      mine.forEach(r => {
        const p = parseFloat(r.poin) || 0;
        const v = r.jenis === 'Negatif' ? -p : p;
        const a = r.aspek || 'Umum';
        net += v;
        by[a] = (by[a] || 0) + v;
      });

      const pos = Object.keys(by).filter(a => by[a] > 0);
      const neg = Object.keys(by).filter(a => by[a] < 0);

      const S = P.sebutan || 'Santri';
      let t = pos.length ? S + ' menunjukkan sikap yang baik dan terus berkembang dalam aspek ' + joinId(pos) + '.' : '';
      if (neg.length) t += (t ? '\n' : '') + S + ' masih perlu bimbingan dan pembiasaan dalam aspek ' + joinId(neg) + '.';

      out[s.nama] = {
        predikat: pred(net, parseFloat(P.sikap_bsb || '20'), parseFloat(P.sikap_bsh || '10'), parseFloat(P.sikap_mb || '0')),
        deskripsi: t || S + ' menunjukkan sikap yang cukup stabil.'
      };
    });

    return out;
  }

  private computeMutabaah(kelas: string, P: Record<string, string>): Record<string, { kelompok: string; predikat: string; deskripsi: string }[]> {
    const items = [...(this.state.ItemMutabaah || [])].sort((x, y) => (+x.urut || 0) - (+y.urut || 0));
    const rows = (this.state.Mutabaah || []).filter(r =>
      r.kelas === kelas &&
      (!P.mulai || r.tanggal >= P.mulai) &&
      (!P.selesai || r.tanggal <= P.selesai)
    );

    const out: Record<string, { kelompok: string; predikat: string; deskripsi: string }[]> = {};
    const A = parseFloat(P.mut_bsb || '90');
    const B = parseFloat(P.mut_bsh || '75');
    const M = parseFloat(P.mut_mb || '50');

    const joinId = (a: string[]) => {
      if (a.length < 2) return a[0] || '';
      if (a.length === 2) return a[0] + ' dan ' + a[1];
      return a.slice(0, -1).join(', ') + ', dan ' + a[a.length - 1];
    };

    const pred = (x: number, a: number, b: number, c: number) =>
      x >= a ? PRD[0] : x >= b ? PRD[1] : x >= c ? PRD[2] : PRD[3];

    (this.state.Siswa || []).filter(s => s.kelas === kelas).forEach(s => {
      const mine = rows.filter(r => r.siswa === s.nama);
      if (!mine.length || !items.length) return;

      const pct: Record<string, number> = {};
      items.forEach(i => {
        pct[i.id] = (100 * mine.filter(r => String(r.selesai).split(',').includes(i.id)).length) / mine.length;
      });

      const groups: string[] = [];
      items.forEach(i => {
        if (!groups.includes(i.kelompok)) groups.push(i.kelompok);
      });

      const S = P.sebutan || 'Santri';
      out[s.nama] = groups.map(g => {
        const its = items.filter(i => i.kelompok === g);
        const avg = its.reduce((t, i) => t + pct[i.id], 0) / its.length;
        const bk: Record<string, string[]> = { a: [], b: [], c: [], p: [] };
        its.forEach(i => {
          const k = pct[i.id] >= A ? 'a' : pct[i.id] >= B ? 'b' : pct[i.id] >= M ? 'c' : 'p';
          bk[k].push(i.nama);
        });

        const seg: string[] = [];
        if (bk.a.length) seg.push('sangat konsisten dalam ' + joinId(bk.a));
        if (bk.b.length) seg.push('konsisten dalam ' + joinId(bk.b));
        if (bk.c.length) seg.push('mulai konsisten dalam ' + joinId(bk.c));

        let t = seg.length ? S + ' ' + seg.join('; ') + '.' : '';
        if (bk.p.length) t += (t ? '\n' : '') + S + ' masih perlu pembiasaan dalam ' + joinId(bk.p) + '.';
        return { kelompok: g, predikat: pred(avg, A, B, M), deskripsi: t };
      });
    });

    return out;
  }

  private computeTahfizh(kelas: string, P: Record<string, string>): Record<string, { subjek: string; predikat: string; deskripsi: string }[]> {
    const kls = (this.state.Kelas || []).find(k => k.nama === kelas) || {};
    const target = parseFloat(kls.target_ziyadah || '0') || 0;
    const rows = (this.state.Setoran || []).filter(r =>
      r.kelas === kelas &&
      (!P.mulai || r.tanggal >= P.mulai) &&
      (!P.selesai || r.tanggal <= P.selesai)
    );

    const A = parseFloat(P.tfz_bsb || '90');
    const B = parseFloat(P.tfz_bsh || '75');
    const M = parseFloat(P.tfz_mb || '50');
    const S = P.sebutan || 'Santri';

    const skor = (l: any[]) => {
      const v = l.map(r => KUAL_SKOR[r.kualitas]).filter(Boolean);
      return v.length ? v.reduce((t, x) => t + x, 0) / v.length : null;
    };

    const kualitasKata = (avg: number) => {
      return avg >= 3.5 ? 'sangat lancar dan mutqin' : avg >= 2.5 ? 'lancar' : avg >= 1.5 ? 'cukup lancar tetapi masih memerlukan banyak koreksi' : 'belum lancar dan perlu banyak mengulang';
    };

    const pred = (x: number, a: number, b: number, c: number) =>
      x >= a ? PRD[0] : x >= b ? PRD[1] : x >= c ? PRD[2] : PRD[3];

    const out: Record<string, { subjek: string; predikat: string; deskripsi: string }[]> = {};

    (this.state.Siswa || []).filter(s => s.kelas === kelas).forEach(s => {
      const mine = rows.filter(r => r.siswa === s.nama);
      if (!mine.length) return;
      const res: any[] = [];

      const z = mine.filter(r => r.jenis === 'Ziyadah');
      if (z.length) {
        const total = z.reduce((t, r) => t + (r.surat && +r.dari && +r.sampai ? Math.max(0, +r.sampai - +r.dari + 1) : 0), 0);
        const last = z.slice().sort((x, y) => y.tanggal.localeCompare(x.tanggal))[0];
        const q = skor(z);
        const qp = q === null ? 0 : (q / 4) * 100;
        const ratio = target ? Math.min(100, (total / target) * 100) : null;
        const sc = ratio === null ? qp : 0.6 * ratio + 0.4 * qp;

        let t = S + ' menambah hafalan baru sebanyak ' + total + ' ayat pada semester ini' + (ratio === null ? '' : ' (' + Math.round((total / target) * 100) + '% dari target ' + target + ' ayat)');
        if (last && last.surat) t += ', hingga ' + last.surat + ' ayat ' + last.sampai;
        t += '.' + (q === null ? '' : ' Setoran ziyadah ' + kualitasKata(q) + '.');
        res.push({ subjek: 'Tahfizh - Ziyadah', predikat: pred(sc, A, B, M), deskripsi: t });
      }

      const m = mine.filter(r => r.jenis === 'Murojaah');
      if (m.length) {
        const q = skor(m);
        res.push({
          subjek: 'Tahfizh - Murojaah',
          predikat: pred(q === null ? 0 : (q / 4) * 100, A, B, M),
          deskripsi: S + ' melaksanakan murojaah sebanyak ' + m.length + ' kali' + (q === null ? '.' : '; hafalan lama ' + kualitasKata(q) + '.')
        });
      }

      const h = mine.filter(r => r.jenis === 'Tahsin');
      if (h.length) {
        const q = skor(h);
        const lastH = h.slice().sort((x, y) => y.tanggal.localeCompare(x.tanggal))[0];
        res.push({
          subjek: 'Tahsin',
          predikat: pred(q === null ? 0 : (q / 4) * 100, A, B, M),
          deskripsi: S + ' mengikuti tahsin sebanyak ' + h.length + ' kali' + (lastH?.materi ? ' (materi terakhir: ' + lastH.materi + ')' : '') + (q === null ? '.' : '; bacaan ' + kualitasKata(q) + '.')
        });
      }

      out[s.nama] = res;
    });

    return out;
  }

  private computeMI(kelas: string, P: Record<string, string>): Record<string, { subjek: string; predikat: string; deskripsi: string }[]> {
    const per = this.getPeriode();
    const rows = (this.state.MI || []).filter(r => r.kelas === kelas && r.periode === per);
    const peta = this.state.PetaMI || [];
    const keg = (this.state.Kegiatan || []).filter(k => k.kelas === kelas && k.periode === per && k.jenis === 'Ekstrakurikuler');

    const nm: Record<string, Record<string, number>> = {};
    peta.filter(p => p.sumber === 'Mapel').forEach(p => {
      if (nm[p.nama]) return;
      nm[p.nama] = {};
      this.rekap({ kelas, mapel: p.nama }).forEach(r => {
        if (r.akhir !== null) nm[p.nama][r.siswa] = r.akhir;
      });
    });

    const s4 = (x: number) => x >= parseFloat(P.ambang_bsb || '90') ? 4 : x >= parseFloat(P.ambang_bsh || '80') ? 3 : x >= parseFloat(P.ambang_mb || '70') ? 2 : 1;
    const HURUF: Record<string, number> = { A: 4, B: 3, C: 2, D: 1 };

    const pred = (x: number, a: number, b: number, c: number) =>
      x >= a ? PRD[0] : x >= b ? PRD[1] : x >= c ? PRD[2] : PRD[3];

    const W = {
      Observasi: parseFloat(P.mi_w_obs || '40') || 40,
      Kuesioner: parseFloat(P.mi_w_kues || '30') || 30,
      Kegiatan: parseFloat(P.mi_w_keg || '30') || 30
    };

    const avg = (a: number[]) => a.length ? a.reduce((t, x) => t + x, 0) / a.length : null;
    const joinId = (a: string[]) => {
      if (a.length < 2) return a[0] || '';
      if (a.length === 2) return a[0] + ' dan ' + a[1];
      return a.slice(0, -1).join(', ') + ', dan ' + a[a.length - 1];
    };

    const out: Record<string, { subjek: string; predikat: string; deskripsi: string }[]> = {};

    (this.state.Siswa || []).filter(s => s.kelas === kelas).forEach(s => {
      const res: any[] = [];
      MI_LIST.forEach(mi => {
        const src: Record<string, number> = {};
        const ev: string[] = [];
        const sc: number[] = [];

        MI_SUMBER.forEach(sm => {
          const v = rows.filter(r => r.siswa === s.nama && r.kecerdasan === mi[0] && r.sumber === sm)
            .map(r => parseFloat(r.skor))
            .filter(x => !isNaN(x));
          const av = avg(v);
          if (av !== null) src[sm] = av;
        });

        peta.filter(p => p.kecerdasan === mi[0]).forEach(p => {
          if (p.sumber === 'Mapel' && nm[p.nama] && nm[p.nama][s.nama] !== undefined) {
            sc.push(s4(nm[p.nama][s.nama]));
            ev.push(p.nama);
          }
          if (p.sumber === 'Kegiatan') {
            keg.filter(k => k.siswa === s.nama && k.kegiatan === p.nama).forEach(k => {
              sc.push(HURUF[String(k.nilai).trim().toUpperCase()] || 3);
              ev.push(p.nama);
            });
          }
        });

        const avSc = avg(sc);
        if (avSc !== null) src.Kegiatan = avSc;

        const ks = Object.keys(src) as (keyof typeof W)[];
        if (!ks.length) return;

        const ws = ks.reduce((t, k) => t + (W[k] || 0), 0);
        const skor = ws ? ks.reduce((t, k) => t + src[k] * (W[k] || 0), 0) / ws : avg(ks.map(k => src[k])) || 3;

        res.push({
          mi,
          skor,
          src: ks,
          ev: ev.filter((x, i) => ev.indexOf(x) === i)
        });
      });

      if (!res.length) return;
      res.sort((a, b) => b.skor - a.skor);

      out[s.nama] = res.map(r => {
        const pVal = pred(r.skor, parseFloat(P.mi_bsb || '3.5'), parseFloat(P.mi_bsh || '2.75'), parseFloat(P.mi_mb || '2'));
        const S = P.sebutan || 'Santri';
        const nama = r.mi[0];
        const frase = r.mi[1];
        const parts: string[] = [];
        const lv = PRD.indexOf(pVal as any);
        if (r.src.includes('Observasi')) parts.push('pengamatan guru');
        if (r.src.includes('Kuesioner')) parts.push('hasil kuesioner');
        if (r.ev.length) parts.push('keterlibatan dalam ' + joinId(r.ev));
        const dasar = parts.length ? ' Hal ini terlihat dari ' + joinId(parts) + '.' : '';

        let desc = '';
        if (lv === 0) desc = S + ' sangat menonjol dalam kecerdasan ' + nama + ', yaitu ' + frase + '.' + dasar;
        else if (lv === 1) desc = S + ' menunjukkan kecerdasan ' + nama + ' yang berkembang sesuai harapan, yaitu ' + frase + '.' + dasar;
        else if (lv === 2) desc = 'Kecerdasan ' + nama + ' (' + frase + ') mulai berkembang pada ' + S + ' dan perlu terus distimulasi melalui kegiatan yang sesuai.' + dasar;
        else desc = 'Kecerdasan ' + nama + ' (' + frase + ') belum tampak menonjol pada ' + S + ' dan perlu lebih banyak kesempatan untuk berkembang.' + dasar;

        return {
          subjek: 'Kecerdasan ' + r.mi[0],
          predikat: pVal,
          deskripsi: desc
        };
      });
    });

    return out;
  }

  public async gantiSandi(d: { lama: string; baru: string }): Promise<boolean> {
    const user = this.getSession()!;
    if (!d || !d.lama || !d.baru) throw new Error('Isi kata sandi lama dan baru.');
    if (d.baru.length < 6) throw new Error('Kata sandi baru minimal 6 karakter.');

    const r = this.state.Pengguna.find(x => x.username === user.username);
    if (!r || r.hash !== hash(d.lama)) throw new Error('Kata sandi lama salah.');

    r.hash = hash(d.baru);
    r.wajib_ganti = '';
    this.saveLocal();

    try {
      await supabase.from('pengguna').update({ hash: r.hash, wajib_ganti: '' }).eq('username', user.username);
    } catch (err) {
      console.warn('Gagal ganti sandi ke cloud:', err);
    }

    return true;
  }

  public async buatAkun(d: { kelas: string; ulang?: string[] }): Promise<any[]> {
    const user = this.getSession()!;
    if (user.role !== 'admin') throw new Error('Akses ditolak.');
    if (!d || !d.kelas) throw new Error('Pilih kelas.');

    const out: any[] = [];
    const only = d.ulang && d.ulang.length ? d.ulang : null;

    const students = this.state.Siswa.filter(s => s.kelas === d.kelas && (!only || only.includes(s.id)));
    for (const s of students) {
      const existing = this.state.Pengguna.find(u => u.siswa === s.id);
      const pw = sandiAcak();

      if (existing && !only) continue;

      if (existing) {
        existing.hash = hash(pw);
        existing.wajib_ganti = '1';
        out.push({ nama: s.nama, kelas: s.kelas, username: existing.username, password: pw, status: 'reset' });
        await this.saveRow('Pengguna', existing);
        continue;
      }

      const un = String(s.nis || '').trim();
      if (!un) {
        out.push({ nama: s.nama, kelas: s.kelas, username: '', password: '', status: 'NISG kosong' });
        continue;
      }
      if (this.state.Pengguna.some(u => u.username === un)) {
        out.push({ nama: s.nama, kelas: s.kelas, username: un, password: '', status: 'username sudah dipakai' });
        continue;
      }

      const newAcc = {
        id: getUuid(),
        username: un,
        nama: s.nama,
        role: 'santri',
        hash: hash(pw),
        peran: 'santri',
        siswa: s.id,
        wajib_ganti: '1'
      };

      out.push({ nama: s.nama, kelas: s.kelas, username: un, password: pw, status: 'baru' });
      await this.saveRow('Pengguna', newAcc);
    }

    return out;
  }

  public mutabaahSaya(): any {
    const user = this.getSession()!;
    const s = this.state.Siswa.find(x => x.id === user.siswa);
    if (!s) throw new Error('Akses ditolak.');
    const P = this.getSettings();

    const items = [...(this.state.ItemMutabaah || [])].sort((x, y) => (+x.urut || 0) - (+y.urut || 0));
    const rows = (this.state.Mutabaah || []).filter(r =>
      r.siswa === s.nama &&
      r.kelas === s.kelas &&
      (!P.mulai || r.tanggal >= P.mulai) &&
      (!P.selesai || r.tanggal <= P.selesai)
    ).map(r => ({ tanggal: r.tanggal, selesai: r.selesai }));

    return {
      siswa: { nama: s.nama, kelas: s.kelas },
      items,
      rows
    };
  }

  public raporSaya(d: { tipe: 'akademik' | 'pondok' }): any {
    const user = this.getSession()!;
    const s = this.state.Siswa.find(x => x.id === user.siswa);
    if (!s) throw new Error('Akses ditolak.');
    const k = this.state.Kelas.find(x => x.nama === s.kelas) || {};
    if (k.rapor_terbit !== 'ya') throw new Error('Rapor belum diterbitkan oleh wali kelas.');

    const q = { kelas: s.kelas, siswa: s.nama };
    return d && d.tipe === 'pondok' ? this.raporPondokData(q) : this.raporData(q);
  }

  public async terbitkanRapor(d: { kelas: string; terbit: boolean }): Promise<boolean> {
    const k = this.state.Kelas.find(x => x.nama === d.kelas);
    if (!k) throw new Error('Kelas belum ada di menu Data Kelas.');
    k.rapor_terbit = d.terbit ? 'ya' : '';
    await this.saveRow('Kelas', k);
    return true;
  }

  public async setKamar(d: { data: { id: string; kamar: string }[] }): Promise<number> {
    const byId: Record<string, any> = {};
    this.state.Siswa.forEach(s => { byId[s.id] = s; });

    let count = 0;
    for (const item of d.data) {
      if (byId[item.id]) {
        byId[item.id].kamar = String(item.kamar || '').trim();
        await this.saveRow('Siswa', byId[item.id]);
        count++;
      }
    }

    return count;
  }

  public async saveMI(d: { kelas: string; siswa: string; sumber: 'Observasi' | 'Kuesioner'; skor: Record<string, any>; catatan?: string }): Promise<number> {
    const user = this.getSession()!;
    const per = this.getPeriode();
    let count = 0;

    for (const nm of MI_NAMA) {
      const v = parseFloat(d.skor[nm]);
      if (isNaN(v)) continue;
      if (v < 1 || v > 4) throw new Error('Skor ' + nm + ' harus antara 1 dan 4.');

      let old = this.state.MI.find(r =>
        r.periode === per &&
        r.siswa === d.siswa &&
        r.sumber === d.sumber &&
        r.kecerdasan === nm &&
        r.oleh === user.username
      );

      const miRecord = {
        id: old ? old.id : getUuid(),
        periode: per,
        kelas: d.kelas,
        siswa: d.siswa,
        kecerdasan: nm,
        sumber: d.sumber,
        skor: String(v),
        catatan: d.catatan || '',
        oleh: user.username
      };

      await this.saveRow('MI', miRecord);
      count++;
    }

    return count;
  }

  public async saveKuesioner(d: { kelas: string; siswa: string; jawaban: Record<string, string> }): Promise<number> {
    const user = this.getSession()!;
    const by: Record<string, number[]> = {};
    const ids: string[] = [];

    this.state.SoalMI.forEach(q => {
      const v = parseFloat(d.jawaban[q.id]);
      if (isNaN(v)) return;
      if (v < 1 || v > 4) throw new Error('Jawaban harus 1 sampai 4.');
      (by[q.kecerdasan] = by[q.kecerdasan] || []).push(v);
      ids.push(q.id + ':' + v);
    });

    if (!ids.length) throw new Error('Belum ada jawaban.');

    const skor: Record<string, number> = {};
    Object.keys(by).forEach(k => {
      const sum = by[k].reduce((a, b) => a + b, 0);
      skor[k] = Math.round((sum / by[k].length) * 100) / 100;
    });

    await this.saveMI({
      kelas: d.kelas,
      siswa: d.siswa,
      sumber: 'Kuesioner',
      skor,
      catatan: 'Kuesioner mandiri'
    });

    const per = this.getPeriode();
    const old = this.state.KuesionerMI.find(r => r.periode === per && r.siswa === d.siswa && r.kelas === d.kelas);
    const today = new Date().toISOString().slice(0, 10);

    const record = {
      id: old ? old.id : getUuid(),
      periode: per,
      kelas: d.kelas,
      siswa: d.siswa,
      tanggal: today,
      jawaban: ids.join(','),
      oleh: user.username
    };

    await this.saveRow('KuesionerMI', record);
    return Object.keys(skor).length;
  }

  public listPiket(d?: { dari?: string; sampai?: string }): any[] {
    const user = this.getSession()!;
    const adm = user.role === 'admin' || user.role === 'mudir';
    return this.state.Piket.filter(r =>
      (adm || r.oleh === user.username) &&
      (!d || !d.dari || r.tanggal >= d.dari) &&
      (!d || !d.sampai || r.tanggal <= d.sampai)
    );
  }

  public getPiket(d: { id: string }): any[] {
    return this.state.PiketAbsen.filter(a => a.piket === d.id);
  }

  public async savePiket(d: {
    id?: string;
    tanggal: string;
    kegiatan: string;
    kamar: string;
    musyrif: string;
    catatan?: string;
    foto?: string;
    absen: { siswa: string; status: string; ket?: string }[];
  }): Promise<number> {
    const user = this.getSession()!;
    if (!d || !d.tanggal || !d.kegiatan || !d.kamar || !Array.isArray(d.absen) || !d.absen.length) {
      throw new Error('Lengkapi tanggal, kegiatan, kamar, dan daftar kehadiran.');
    }

    let ex = d.id ? this.state.Piket.find(r => r.id === d.id) : null;
    if (!ex) {
      ex = this.state.Piket.find(r => r.tanggal === d.tanggal && r.kegiatan === d.kegiatan && r.kamar === d.kamar) || null;
    }

    const id = ex ? ex.id : getUuid();
    const cnt = PIKET_STATUS.map(s => d.absen.filter(a => a.status === s).length);

    const piketObj = {
      id,
      tanggal: d.tanggal,
      kegiatan: d.kegiatan,
      kamar: d.kamar,
      musyrif: d.musyrif || user.nama,
      catatan: d.catatan || '',
      foto: d.foto || '',
      rekap: cnt.join(','),
      oleh: ex ? ex.oleh : user.username
    };

    await this.saveRow('Piket', piketObj);

    const newAbsen: any[] = [];
    d.absen.forEach(a => {
      newAbsen.push({
        id: getUuid(),
        piket: id,
        siswa: a.siswa,
        status: a.status,
        keterangan: a.ket || ''
      });
    });

    await this.saveManyRows('PiketAbsen', newAbsen);
    return d.absen.length;
  }

  public async saveRaporManual(d: { kelas: string; siswa: string; mapel: string; nilai?: string; deskripsi: string }): Promise<boolean> {
    const user = this.getSession()!;
    const per = this.getPeriode();
    if (!this.state.RaporAkademikManual) this.state.RaporAkademikManual = [];

    let ex = this.state.RaporAkademikManual.find(x =>
      x.periode === per &&
      x.kelas === d.kelas &&
      x.siswa === d.siswa &&
      x.mapel === d.mapel
    );

    const record = {
      id: ex ? ex.id : getUuid(),
      periode: per,
      kelas: d.kelas,
      siswa: d.siswa,
      mapel: d.mapel,
      nilai: d.nilai,
      deskripsi: d.deskripsi,
      oleh: user.username
    };

    await this.saveRow('RaporAkademikManual', record);
    return true;
  }

  public async resetRaporManual(d: { kelas: string; siswa: string; mapel: string }): Promise<boolean> {
    const per = this.getPeriode();
    const ex = (this.state.RaporAkademikManual || []).find(x =>
      x.periode === per && x.kelas === d.kelas && x.siswa === d.siswa && x.mapel === d.mapel
    );

    if (ex) {
      await this.removeRow('RaporAkademikManual', { id: ex.id });
    }
    return true;
  }

  public getLeger(kelas: string) {
    if (!kelas) throw new Error('Pilih kelas.');
    const P = this.getSettings();
    const per = this.getPeriode();
    const students = (this.state.Siswa || []).filter(s => s.kelas === kelas);
    const mapels = (this.state.Mapel || []).filter(m => !['Kegiatan Pondok'].includes(m.kelompok));

    const rekapMap: Record<string, Record<string, number | null>> = {};
    mapels.forEach(m => {
      rekapMap[m.nama] = {};
      const res = this.rekap({ kelas, mapel: m.nama });
      res.forEach(r => {
        const man = (this.state.RaporAkademikManual || []).find(x =>
          x.periode === per && x.kelas === kelas && x.siswa === r.siswa && x.mapel === m.nama
        );
        const score = man && man.nilai !== undefined && man.nilai !== '' ? parseFloat(man.nilai) : r.akhir;
        rekapMap[m.nama][r.siswa] = score;
      });
    });

    const presensi = (this.state.Presensi || []).filter(r =>
      r.kelas === kelas && (!P.mulai || r.tanggal >= P.mulai) && (!P.selesai || r.tanggal <= P.selesai)
    );
    const hadirStatus = (P.status_hadir || 'Hadir').split(',').map(s => s.trim()).filter(Boolean);
    const perilaku = (this.state.Perilaku || []).filter(r =>
      r.kelas === kelas && (!P.mulai || r.tanggal >= P.mulai) && (!P.selesai || r.tanggal <= P.selesai)
    );
    const setoran = (this.state.Setoran || []).filter(r =>
      r.kelas === kelas && (!P.mulai || r.tanggal >= P.mulai) && (!P.selesai || r.tanggal <= P.selesai)
    );

    const kls = (this.state.Kelas || []).find(k => k.nama === kelas) || {};
    const waliList = (this.state.Wali || []).filter(w =>
      w.kelas === kelas && w.periode === per
    );

    const rows = students.map(s => {
      const scores: Record<string, number | null> = {};
      let total = 0;
      let count = 0;

      mapels.forEach(m => {
        const sc = rekapMap[m.nama]?.[s.nama] ?? null;
        scores[m.nama] = sc;
        if (sc !== null && !isNaN(sc)) {
          total += sc;
          count++;
        }
      });

      const average = count > 0 ? Math.round((total / count) * 10) / 10 : null;

      const pMine = presensi.filter(r => r.siswa === s.nama);
      const byDate: Record<string, string[]> = {};
      pMine.forEach(r => {
        if (!byDate[r.tanggal]) byDate[r.tanggal] = [];
        byDate[r.tanggal].push(r.status);
      });

      let presensiH = 0;
      let presensiS = 0;
      let presensiI = 0;
      let presensiA = 0;

      Object.keys(byDate).forEach(d => {
        const statuses = byDate[d];
        if (statuses.some(st => st === 'Alfa' || st === 'Alpa')) {
          presensiA++;
        } else if (statuses.some(st => st === 'Sakit')) {
          presensiS++;
        } else if (statuses.some(st => st === 'Izin')) {
          presensiI++;
        } else if (statuses.some(st => hadirStatus.includes(st))) {
          presensiH++;
        }
      });

      const w = waliList.find(x => x.siswa === s.nama);
      const wS = w && w.sakit !== undefined && w.sakit !== '' ? parseInt(w.sakit) : null;
      const wI = w && w.izin !== undefined && w.izin !== '' ? parseInt(w.izin) : null;
      const wA = w && w.alfa !== undefined && w.alfa !== '' ? parseInt(w.alfa) : null;

      const sakit = wS !== null && !isNaN(wS) ? wS : presensiS;
      const izin = wI !== null && !isNaN(wI) ? wI : presensiI;
      const alfa = wA !== null && !isNaN(wA) ? wA : presensiA;

      let hadir = presensiH;
      if (hadir === 0 && pMine.length > 0) {
        hadir = pMine.filter(r => hadirStatus.includes(r.status)).length;
      }
      if (hadir === 0 && (sakit > 0 || izin > 0 || alfa > 0)) {
        hadir = Math.max(0, 95 - (sakit + izin + alfa));
      } else if (hadir === 0 && pMine.length === 0) {
        hadir = 90;
      }

      const totalDays = hadir + sakit + izin + alfa;
      const presensiPct = totalDays > 0 ? Math.round((hadir / totalDays) * 100) : 100;

      let netPoin = 0;
      perilaku.filter(r => r.siswa === s.nama).forEach(r => {
        const p = parseFloat(r.poin) || 0;
        netPoin += r.jenis === 'Negatif' ? -p : p;
      });

      const ziyadahAyat = setoran
        .filter(r => r.siswa === s.nama && r.jenis === 'Ziyadah')
        .reduce((t, r) => t + (r.surat && +r.dari && +r.sampai ? Math.max(0, +r.sampai - +r.dari + 1) : 0), 0);

      return {
        siswa: s.nama,
        nis: s.nis,
        kamar: s.kamar || '-',
        scores,
        total,
        count,
        average,
        hadir,
        sakit,
        izin,
        alfa,
        presensiPct,
        netPoin,
        ziyadahAyat
      };
    });

    const sorted = [...rows].sort((a, b) => a.siswa.localeCompare(b.siswa));

    const subjectStats: Record<string, { avg: number; min: number; max: number; passRate: number }> = {};
    const tuntasLimit = parseFloat(P.tuntas || '75') || 75;

    mapels.forEach(m => {
      const vals = rows.map(r => r.scores[m.nama]).filter((v): v is number => v !== null && !isNaN(v));
      if (vals.length > 0) {
        const avg = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
        const min = Math.min(...vals);
        const max = Math.max(...vals);
        const passed = vals.filter(v => v >= tuntasLimit).length;
        const passRate = Math.round((passed / vals.length) * 100);
        subjectStats[m.nama] = { avg, min, max, passRate };
      } else {
        subjectStats[m.nama] = { avg: 0, min: 0, max: 0, passRate: 0 };
      }
    });

    const allAverages = rows.map(r => r.average).filter((v): v is number => v !== null && !isNaN(v));
    const classAvg = allAverages.length
      ? Math.round((allAverages.reduce((a, b) => a + b, 0) / allAverages.length) * 10) / 10
      : 0;
    const classMin = allAverages.length ? Math.min(...allAverages) : 0;
    const classMax = allAverages.length ? Math.max(...allAverages) : 0;

    return {
      kelas,
      periode: per,
      wali: {
        nama: kls.wali || '',
        nipy: kls.nipy || ''
      },
      sekolah: {
        nama: P.nama_sekolah,
        alamat: P.alamat_sekolah,
        kota: P.kota,
        tanggal: P.tanggal_rapor,
        kepsek: P.kepala_sekolah,
        nipy: P.nipy_kepala_sekolah,
        tahun: P.tahun_ajaran,
        semester: P.semester
      },
      mapels,
      rows: sorted,
      subjectStats,
      classStats: {
        classAvg,
        classMin,
        classMax,
        studentCount: students.length,
        tuntasLimit
      }
    };
  }
}

export const db = new StorageEngine();
