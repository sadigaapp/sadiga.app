/**
 * SADIGA - Sistem Administrasi Digital Granada
 * Code.gs  (script terikat ke Google Spreadsheet: Extensions > Apps Script)
 * Langkah awal: jalankan fungsi setup() sekali, lalu Deploy > Web app.
 */
const SALT = 'SADIGA';
const SCHEMA = {
  Pengguna:  ['id','username','nama','role','hash','peran','siswa','wajib_ganti'],
  Siswa:     ['id','nis','nama','kelas','nisn','kamar'],
  Presensi:  ['id','tanggal','kelas','siswa','status','catatan','oleh','mapel'],
  Penilaian: ['id','tanggal','kelas','siswa','mapel','jenis','nilai','catatan','oleh','tp'],
  Perilaku:  ['id','tanggal','kelas','siswa','jenis','kejadian','poin','tindak_lanjut','oleh','aspek'],
  Ujian:     ['id','tanggal','kelas','mapel','jenis','ruang','pengawas','hadir','catatan','oleh','foto'],
  JenisNilai:['id','mapel','nama','kategori'],
  Mapel:     ['id','nama','kelompok'],
  TP:        ['id','mapel','tingkat','lingkup','deskripsi','oleh'],
  Pengaturan:['id','kunci','nilai'],
  Kelas:     ['id','nama','wali','nipy','target_ziyadah','wali_user','rapor_terbit'],
  Pengampu:  ['id','username','kelas','mapel'],
  Wali:      ['id','periode','kelas','siswa','sakit','izin','alfa','catatan','oleh'],
  Kegiatan:  ['id','periode','kelas','siswa','jenis','kegiatan','nilai','keterangan','oleh'],
  NilaiPondok:['id','periode','kelas','siswa','kategori','subjek','predikat','deskripsi','sumber','oleh'],
  ItemMutabaah:['id','nama','kelompok','urut'],
  Mutabaah:  ['id','tanggal','kelas','siswa','selesai','oleh'],
  MI:        ['id','periode','kelas','siswa','kecerdasan','sumber','skor','catatan','oleh'],
  PetaMI:    ['id','sumber','nama','kecerdasan'],
  Setoran:   ['id','tanggal','kelas','siswa','jenis','surat','dari','sampai','materi','kualitas','catatan','oleh'],
  Piket:     ['id','tanggal','kegiatan','kamar','musyrif','catatan','foto','rekap','oleh'],
  PiketAbsen:['id','piket','siswa','status','keterangan'],
  KegiatanPiket:['id','nama'],
  SoalMI:    ['id','kecerdasan','pernyataan'],
  KuesionerMI:['id','periode','kelas','siswa','tanggal','jawaban','oleh']
};
const OPEN = ['NilaiPondok', 'KuesionerMI']; // siapa pun yang login boleh mengubah (wali kelas / musyrif / admin)
const SHARED = ['TP']; // dibaca semua pengguna, ubah/hapus hanya milik sendiri (admin: semua)
const ADMIN_ONLY = ['Pengguna', 'Siswa', 'Mapel', 'JenisNilai', 'Pengaturan', 'Kelas', 'ItemMutabaah', 'PetaMI', 'KegiatanPiket', 'SoalMI', 'Pengampu']; // hanya admin yang boleh menulis

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('SADIGA')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }

function hash_(p) {
  return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, SALT + p));
}

/** Jalankan SEKALI: membuat sheet, header, dan akun admin awal (admin / admin123). */
function setup() {
  Object.keys(SCHEMA).forEach(function (n) {
    const s = ss_().getSheetByName(n) || ss_().insertSheet(n);
    const h = SCHEMA[n];
    s.getRange(1, 1, 1, h.length).setValues([h]).setFontWeight('bold')
      .setBackground('#1B5558').setFontColor('#ffffff');
    s.getRange(2, 1, s.getMaxRows() - 1, h.length).setNumberFormat('@'); // simpan sebagai teks
    s.setFrozenRows(1);
  });
  const u = ss_().getSheetByName('Pengguna');
  if (u.getLastRow() < 2) u.appendRow([Utilities.getUuid(), 'admin', 'Administrator', 'admin', hash_('admin123')]);
  const ps = ss_().getSheetByName('Pengaturan'), have = read_('Pengaturan').map(function (r) { return r.kunci; });
  Object.keys(DEF).forEach(function (k) {
    if (have.indexOf(k) < 0) ps.getRange(ps.getLastRow() + 1, 1, 1, 3).setNumberFormat('@').setValues([[Utilities.getUuid(), k, DEF[k]]]);
  });
  const im = ss_().getSheetByName('ItemMutabaah');
  if (im.getLastRow() < 2) ITEM_AWAL.forEach(function (x, i) { im.appendRow(['m' + (i < 9 ? '0' : '') + (i + 1), x[0], x[1], String(i + 1)]); });
  const sq = ss_().getSheetByName('SoalMI');
  if (sq.getLastRow() < 2) sq.getRange(2, 1, SOAL_AWAL.length, 3).setValues(SOAL_AWAL.map(function (x, i) { return ['q' + (i < 9 ? '0' : '') + (i + 1), x[0], x[1]]; }));
  const kp = ss_().getSheetByName('KegiatanPiket');
  if (kp.getLastRow() < 2) kp.getRange(2, 1, KEGIATAN_AWAL.length, 2).setValues(KEGIATAN_AWAL.map(function (x, i) { return ['k' + (i + 1), x]; }));
}

function read_(n) {
  const v = ss_().getSheetByName(n).getDataRange().getValues();
  const h = v.shift();
  return v.filter(function (r) { return r[0] !== ''; }).map(function (r, i) {
    const o = { _r: i + 2 };
    h.forEach(function (k, j) {
      const x = r[j];
      o[k] = x instanceof Date ? Utilities.formatDate(x, Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(x);
    });
    return o;
  });
}

function clean_(r) { const o = Object.assign({}, r); delete o._r; delete o.hash; return o; }

function login(u, p) {
  const un = String(u).trim(), cache = CacheService.getScriptCache(), key = 'gagal:' + un.toLowerCase();
  if (+(cache.get(key) || 0) >= 5) return { ok: false, msg: 'Terlalu banyak percobaan gagal. Coba lagi dalam 15 menit.' };
  const r = read_('Pengguna').find(function (x) { return x.username === un; });
  if (!r || r.hash !== hash_(p)) {
    cache.put(key, String(+(cache.get(key) || 0) + 1), 900);
    return { ok: false, msg: 'Username atau kata sandi salah.' };
  }
  cache.remove(key);
  const peran = list_(r.peran || r.role);
  const role = peran.indexOf('admin') > -1 ? 'admin' : (peran.length === 1 && peran[0] === 'santri') ? 'santri' : (peran.length === 1 && peran[0] === 'kepsek') ? 'kepsek' : 'guru';
  const user = { username: r.username, nama: r.nama, role: role, peran: peran, siswa: r.siswa || '', wajibGanti: r.wajib_ganti === '1', wali: waliKelas_(r.username) };
  const token = Utilities.getUuid();
  cache.put(token, JSON.stringify(user), 21600); // sesi 6 jam
  return { ok: true, token: token, user: user };
}

/** Satu pintu API: a = list | save | remove, n = nama sheet, d = data */
function api(token, a, n, d) {
  const raw = CacheService.getScriptCache().get(token);
  if (!raw) throw new Error('Sesi berakhir. Silakan masuk kembali.');
  const U = JSON.parse(raw), adm = U.role === 'admin';
  if (U.role === 'santri' && SANTRI_OK.indexOf(a) < 0) throw new Error('Akses ditolak.');
  if (TULIS.indexOf(a) > -1 && !izinTulis_(U)) throw new Error('Akun ini hanya dapat melihat data.');
  if (!SCHEMA[n]) throw new Error('Modul tidak dikenal.');
  if (n === 'Pengguna' && !adm) throw new Error('Akses ditolak.');
  if (a !== 'list' && ADMIN_ONLY.indexOf(n) > -1 && !adm) throw new Error('Akses ditolak.');

  if (a === 'list') {
    let rows = read_(n);
    if (!adm && ADMIN_ONLY.indexOf(n) < 0 && SHARED.indexOf(n) < 0 && OPEN.indexOf(n) < 0) {
      const mine = SHARE_PENGAMPU.indexOf(n) > -1 ? pengampu_(U.username) : []; // pengampu mapel yang sama saling melihat catatan
      rows = rows.filter(function (r) {
        return r.oleh === U.username || mine.some(function (p) { return p.kelas === r.kelas && p.mapel === r.mapel; });
      });
    }
    return rows.map(clean_);
  }
  if (a === 'rekap') { cekRekap_(U, d); return rekap_(d); }
  if (a === 'rapor') return rapor_(d, U);
  if (a === 'raporPondok') return raporPondok_(d, U);
  if (a === 'draftPondok') { if (!bisaKelolaKelas_(U, d && d.kelas)) throw new Error(MSG_KELAS); return draftPondok_(d, U); }
  if (a === 'gantiSandi') return gantiSandi_(d, U);
  if (a === 'buatAkun') return buatAkun_(d, U);
  if (a === 'mutabaahSaya') return mutabaahSaya_(U);
  if (a === 'raporSaya') return raporSaya_(d, U);
  if (a === 'terbitkanRapor') return terbitkanRapor_(d, U);
  if (a === 'saveMI') return saveMI_(d, U);
  if (a === 'saveKuesioner') return saveKuesioner_(d, U);
  if (a === 'listPiket') return listPiket_(d, U);
  if (a === 'getPiket') return getPiket_(d, U);
  if (a === 'savePiket') return savePiket_(d, U);
  if (a === 'setKamar') return setKamar_(d, U);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const s = ss_().getSheetByName(n), h = SCHEMA[n];

    if (a === 'saveMany') { // simpan banyak baris sekaligus (presensi / penilaian per kelas)
      if (ADMIN_ONLY.indexOf(n) > -1 || !Array.isArray(d) || !d.length) throw new Error('Tidak ada data untuk disimpan.');
      const rows = d.map(function (x) {
        x.id = Utilities.getUuid(); x.oleh = U.username;
        return h.map(function (k) { return x[k] === undefined ? '' : x[k]; });
      });
      const start = s.getLastRow() + 1;
      if (start + rows.length - 1 > s.getMaxRows()) s.insertRowsAfter(s.getMaxRows(), rows.length);
      s.getRange(start, 1, rows.length, h.length).setNumberFormat('@').setValues(rows);
      return rows.length;
    }
    const all = read_(n);
    let ex = d && d.id ? all.find(function (r) { return r.id === d.id; }) : null;
    if (a === 'save' && n === 'Mutabaah' && !ex) { // satu catatan per siswa per hari
      ex = all.find(function (r) { return r.siswa === d.siswa && r.tanggal === d.tanggal; }) || null;
      if (ex) d.id = ex.id;
    }
    if (ex && !adm && OPEN.indexOf(n) < 0 && ex.oleh !== U.username) throw new Error('Anda hanya dapat mengubah catatan sendiri.');

    if (a === 'remove') {
      if (!ex) throw new Error('Data tidak ditemukan.');
      if (n === 'Pengguna' && ex.username === U.username) throw new Error('Akun yang sedang dipakai tidak dapat dihapus.');
      if (n === 'Ujian') trash_(ids_(ex.foto));
      if (n === 'Piket') { trash_(ids_(ex.foto)); hapusAbsen_(ex.id); }
      s.deleteRow(ex._r);
      return true;
    }

    if (a === 'save') {
      if (n === 'Pengguna') {
        if (all.some(function (r) { return r.username === d.username && r.id !== d.id; })) throw new Error('Username sudah dipakai.');
        if (d.password) d.hash = hash_(d.password);
        else if (ex) d.hash = ex.hash;
        else throw new Error('Kata sandi wajib diisi.');
        const pr = list_(d.peran).filter(function (x) { return PERAN.indexOf(x) > -1; });
        if (!pr.length) throw new Error('Pilih minimal satu peran.');
        d.peran = pr.join(',');
        d.role = pr.indexOf('admin') > -1 ? 'admin' : (pr.length === 1 && pr[0] === 'kepsek') ? 'kepsek' : 'guru';
        if (ex) { if (d.siswa === undefined) d.siswa = ex.siswa; if (d.wajib_ganti === undefined) d.wajib_ganti = ex.wajib_ganti; }
      }
      if (!ex) d.id = Utilities.getUuid();
      if (n === 'ItemMutabaah' && !ex) d.id = 'm' + Date.now().toString(36); // id pendek agar sheet Mutabaah ringan
      if (n === 'Wali' || n === 'Kegiatan' || n === 'NilaiPondok' || n === 'MI') d.periode = ex ? ex.periode : periode_(); // data rapor dipisah per semester
      if (n === 'Kelas' && d.wali_user && !d.wali) {
        const w = read_('Pengguna').find(function (x) { return x.username === d.wali_user; });
        if (w) d.wali = w.nama;
      }
      if (n === 'Setoran') cekSetoran_(d);
      if (n === 'MI') cekMI_(d);
      if (n === 'NilaiPondok') d.sumber = 'manual'; // baris yang disimpan manual tidak ditimpa oleh draf otomatis
      if (n === 'Wali' && all.some(function (r) { return r.kelas === d.kelas && r.siswa === d.siswa && r.periode === d.periode && r.id !== d.id; }))
        throw new Error('Data wali kelas untuk siswa ini sudah ada. Gunakan Ubah.');
      if (ADMIN_ONLY.indexOf(n) < 0) d.oleh = ex ? ex.oleh : U.username;
      const row = h.map(function (k) { return d[k] === undefined ? '' : d[k]; });
      if (n === 'Ujian' && ex) { const keep = ids_(d.foto); trash_(ids_(ex.foto).filter(function (x) { return keep.indexOf(x) < 0; })); }
      if (!ex && s.getLastRow() >= s.getMaxRows()) s.insertRowAfter(s.getMaxRows());
      s.getRange(ex ? ex._r : s.getLastRow() + 1, 1, 1, h.length).setNumberFormat('@').setValues([row]);
      return true;
    }
    throw new Error('Aksi tidak dikenal.');
  } finally {
    lock.releaseLock();
  }
}

/* ---------- Foto Log Ujian (disimpan di Google Drive) ---------- */
function ids_(v) { return String(v || '').split(',').filter(Boolean); }
function trash_(ids) { ids.forEach(function (i) { try { DriveApp.getFileById(i).setTrashed(true); } catch (e) {} }); }

function folder_() {
  const P = PropertiesService.getScriptProperties(), id = P.getProperty('FOTO_FOLDER');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  const f = DriveApp.createFolder('SADIGA - Foto Ujian');
  P.setProperty('FOTO_FOLDER', f.getId());
  return f;
}

/** Dipanggil dari browser; gambar sudah dikecilkan (JPEG base64). Mengembalikan ID file. */
function uploadFoto(token, name, b64) {
  if (!CacheService.getScriptCache().get(token)) throw new Error('Sesi berakhir. Silakan masuk kembali.');
  const f = folder_().createFile(Utilities.newBlob(Utilities.base64Decode(b64), 'image/jpeg', name));
  try { f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); }
  catch (e) { try { f.setSharing(DriveApp.Access.DOMAIN_WITH_LINK, DriveApp.Permission.VIEW); } catch (e2) {} }
  return f.getId();
}

/* ---------- Pengaturan, nilai akhir, dan deskripsi dari TP ---------- */
const DEF = {
  tahun_ajaran: '', semester: '',
  mulai: '', selesai: '',            // rentang tanggal semester (yyyy-mm-dd); kosong = semua data
  bobot_kehadiran: '20', bobot_sumatif: '30', bobot_formatif: '50',
  jenis_sumatif: 'UTS,UAS',          // jenis bawaan yang dihitung sumatif (PTS/PSAS)
  status_hadir: 'Hadir',             // status presensi yang dihitung hadir (mis. Hadir,Izin,Sakit)
  tuntas: '75', batas_cukup: '85', batas_baik: '95', // ambang deskripsi TP (tidak dicetak di rapor)
  sebutan: 'Santri', alamat_aplikasi: '', // alamat_aplikasi dicetak pada kartu akun orang tua/santri
  nama_sekolah: '', alamat_sekolah: '', kota: '', tanggal_rapor: '', // tanggal_rapor: yyyy-mm-dd, kosong = hari ini
  kepala_sekolah: '', nipy_kepala_sekolah: '',
  ambang_bsb: '90', ambang_bsh: '80', ambang_mb: '70', // nilai akhir -> predikat Rapor Pondok (mapel Languages dan I'dadi)
  mut_bsb: '90', mut_bsh: '75', mut_mb: '50',            // % hari terlaksana (Mutaba'ah) -> predikat
  sikap_bsb: '20', sikap_bsh: '10', sikap_mb: '0',       // poin bersih Log Perilaku (Positif - Negatif) -> predikat
  tfz_bsb: '90', tfz_bsh: '75', tfz_mb: '50',            // skor Tahfizh/Tahsin (target dan kualitas) -> predikat
  mi_bsb: '3.5', mi_bsh: '2.75', mi_mb: '2',              // skor MI (skala 1-4) -> predikat
  mi_w_obs: '40', mi_w_kues: '30', mi_w_keg: '30'         // bobot sumber MI: observasi, kuesioner, kegiatan
};

const ITEM_AWAL = [ // item Mutaba'ah Yaumiyah awal; ubah lewat menu Item Mutaba'ah
  ['Tahajud', 'Ibadah Sunnah'], ['Sahur', 'Ibadah Sunnah'], ['Qobliyah Subuh', 'Ibadah Sunnah'], ['Subuh', 'Ibadah Wajib'],
  ['Halaqah Quran (Subuh)', 'Halaqah Quran'], ['Syuruk', 'Ibadah Sunnah'], ['Dhuha', 'Ibadah Sunnah'], ['Qobliyah Dzuhur', 'Ibadah Sunnah'],
  ['Dzuhur', 'Ibadah Wajib'], ["Ba'diyah Dzuhur", 'Ibadah Sunnah'], ['Ashar', 'Ibadah Wajib'], ['Halaqah Quran (Ashar)', 'Halaqah Quran'],
  ['Qobliyah Maghrib', 'Ibadah Sunnah'], ['Maghrib', 'Ibadah Wajib'], ['Isya', 'Ibadah Wajib'], ["Ba'diyah Isya", 'Ibadah Sunnah'],
  ['Halaqah Quran (Isya)', 'Halaqah Quran']
];

function settings_() {
  const o = Object.assign({}, DEF);
  read_('Pengaturan').forEach(function (r) { if (r.kunci in DEF && r.nilai !== '') o[r.kunci] = r.nilai; });
  return o;
}
function list_(v) { return String(v).split(',').map(function (x) { return x.trim(); }).filter(Boolean); }
function tingkatOf_(k) { return String(k || '').trim().split(/[\s\-_.]+/)[0]; }
function num_(v) { const x = parseFloat(String(v).replace(',', '.')); return isNaN(x) ? null : x; }
function avg_(a) { return a.length ? a.reduce(function (t, x) { return t + x; }, 0) / a.length : null; }
function rnd_(x) { return x === null ? null : Math.round(x); }

/** Nilai akhir = bobot kehadiran + sumatif + formatif; deskripsi disusun dari nilai per TP. */
function rekap_(d, C) {
  C = C || loadC_();
  if (!d || !d.kelas || !d.mapel) throw new Error('Pilih kelas dan mata pelajaran.');
  const P = C.P, hadir = list_(P.status_hadir), sumJ = list_(P.jenis_sumatif);
  const W = { h: +P.bobot_kehadiran, s: +P.bobot_sumatif, f: +P.bobot_formatif };
  // Kategori per jenis: jika mapel punya daftar Jenis Penilaian sendiri, kategorinya dipakai; jika tidak, daftar jenis_sumatif.
  const kat = {};
  C.jn.forEach(function (j) { if (j.mapel === d.mapel && j.kategori) kat[j.nama] = j.kategori; });
  const isSum = function (j) { return kat[j] ? kat[j] === 'Sumatif' : sumJ.indexOf(j) > -1; };
  const same = function (r) {
    return r.kelas === d.kelas && r.mapel === d.mapel && (!P.mulai || r.tanggal >= P.mulai) && (!P.selesai || r.tanggal <= P.selesai);
  };
  const pres = C.pres.filter(same), nil = C.nil.filter(same);
  const tps = C.tp.filter(function (t) { return t.mapel === d.mapel && t.tingkat === tingkatOf_(d.kelas); });
  return C.siswa.filter(function (x) { return x.kelas === d.kelas; }).map(function (s) {
    const p = pres.filter(function (r) { return r.siswa === s.nama; });
    const kh = p.length ? 100 * p.filter(function (r) { return hadir.indexOf(r.status) > -1; }).length / p.length : null;
    const n = nil.filter(function (r) { return r.siswa === s.nama && num_(r.nilai) !== null; });
    const val = function (r) { return num_(r.nilai); };
    const su = avg_(n.filter(function (r) { return isSum(r.jenis); }).map(val));
    const fo = avg_(n.filter(function (r) { return !isSum(r.jenis); }).map(val));
    const parts = [[kh, W.h], [su, W.s], [fo, W.f]].filter(function (x) { return x[0] !== null; });
    const ws = parts.reduce(function (t, x) { return t + x[1]; }, 0);
    const akhir = ws ? Math.round(parts.reduce(function (t, x) { return t + x[0] * x[1]; }, 0) / ws) : null;
    const ts = tps.map(function (t) {
      const v = avg_(n.filter(function (r) { return r.tp === t.id; }).map(val));
      return v === null ? null : { deskripsi: t.deskripsi, nilai: v };
    }).filter(Boolean);
    return { siswa: s.nama, kehadiran: rnd_(kh), sumatif: rnd_(su), formatif: rnd_(fo), akhir: akhir,
             lengkap: parts.length === 3, deskripsi: deskripsi_(ts, P) };
  });
}

/** Mengikuti pola Rapkumer (mode deskripsi penuh): TP dikelompokkan sangat baik / baik / cukup / perlu bimbingan. */
function deskripsi_(ts, P) {
  if (!ts.length) return 'Belum ada penilaian pada tujuan pembelajaran.';
  const T = +P.tuntas, C = +P.batas_cukup, B = +P.batas_baik, S = P.sebutan;
  const clean = function (x) { return String(x).replace(/[.!?]+$/, '').trim(); };
  const join = function (a) { return a.length < 2 ? (a[0] || '') : a.length === 2 ? a[0] + ' dan ' + a[1] : a.slice(0, -1).join(', ') + ', dan ' + a[a.length - 1]; };
  const g = { sb: [], b: [], c: [], p: [] };
  ts.slice().sort(function (x, y) { return y.nilai - x.nilai; }).forEach(function (t) {
    const k = t.nilai < T ? 'p' : t.nilai <= C ? 'c' : t.nilai <= B ? 'b' : 'sb';
    g[k].push(clean(t.deskripsi));
  });
  const seg = [];
  if (g.sb.length) seg.push('menunjukkan penguasaan yang sangat baik dalam ' + join(g.sb));
  if (g.b.length) seg.push('menunjukkan penguasaan yang baik dalam ' + join(g.b));
  if (g.c.length) seg.push('cukup mampu ' + join(g.c));
  let out = seg.length ? S + ' ' + seg.join('; ') + '.' : '';
  if (g.p.length) out += (out ? '\n' : '') + S + ' masih perlu bimbingan dalam ' + join(g.p) + '.';
  return out;
}

/** Darurat: jalankan manual di editor untuk mengembalikan akun admin ke admin / admin123. */
function resetAdmin() {
  const r = read_('Pengguna').find(function (x) { return x.username === 'admin'; });
  if (r) ss_().getSheetByName('Pengguna').getRange(r._r, 5).setValue(hash_('admin123'));
  else ss_().getSheetByName('Pengguna').appendRow([Utilities.getUuid(), 'admin', 'Administrator', 'admin', hash_('admin123')]);
}

/* ---------- Rapor (Akademik dan Pondok) ---------- */
const URUT_KEL = ['Kelompok A (Umum)', 'Kelompok B (Umum)', 'Kelompok C (Peminatan)', 'Mata Pelajaran Pondok', 'Kegiatan Pondok'];

function loadC_() {
  return { P: settings_(), jn: read_('JenisNilai'), pres: read_('Presensi'), nil: read_('Penilaian'), tp: read_('TP'), siswa: read_('Siswa') };
}
function periode_() { const P = settings_(); return (P.tahun_ajaran + ' ' + P.semester).trim(); }

/** Data rapor satu kelas (atau satu siswa). d = {kelas, tipe: 'akademik' | 'pondok', siswa?} */
function raporData_(d) {
  if (!d || !d.kelas) throw new Error('Pilih kelas.');
  const C = loadC_(), P = C.P, per = (P.tahun_ajaran + ' ' + P.semester).trim();
  const mp = read_('Mapel').filter(function (m) { return KEL_PONDOK.indexOf(m.kelompok) < 0 && m.kelompok !== 'Kegiatan Pondok'; });
  const R = {};
  mp.forEach(function (m) {
    R[m.nama] = {};
    rekap_({ kelas: d.kelas, mapel: m.nama }, C).forEach(function (r) { R[m.nama][r.siswa] = r; });
  });
  const kls = read_('Kelas').find(function (k) { return k.nama === d.kelas; }) || {};
  const wali = read_('Wali').filter(function (w) { return w.kelas === d.kelas && w.periode === per; });
  const keg = read_('Kegiatan').filter(function (k) { return k.kelas === d.kelas && k.periode === per; });
  const grp = function (m) { return m.kelompok || 'Mata Pelajaran'; };
  const names = [];
  mp.forEach(function (m) { if (names.indexOf(grp(m)) < 0) names.push(grp(m)); });
  names.sort(function (a, b) { const i = URUT_KEL.indexOf(a), j = URUT_KEL.indexOf(b); return (i < 0 ? 99 : i) - (j < 0 ? 99 : j); });
  const slim = function (k) { return { kegiatan: k.kegiatan, nilai: k.nilai, keterangan: k.keterangan }; };
  const santri = C.siswa.filter(function (s) { return s.kelas === d.kelas && (!d.siswa || s.nama === d.siswa); }).map(function (s) {
    const w = wali.find(function (x) { return x.siswa === s.nama; }) || {};
    const mine = keg.filter(function (k) { return k.siswa === s.nama; });
    return {
      nama: s.nama, nisg: s.nis, nisn: s.nisn || '',
      kelompok: names.map(function (g) {
        return { nama: g, rows: mp.filter(function (m) { return grp(m) === g && R[m.nama][s.nama] && R[m.nama][s.nama].akhir !== null; })
          .map(function (m) { const r = R[m.nama][s.nama]; return { mapel: m.nama, nilai: r.akhir, deskripsi: r.deskripsi }; }) };
      }).filter(function (g) { return g.rows.length; }),
      sakit: w.sakit || '0', izin: w.izin || '0', alfa: w.alfa || '0', catatan: w.catatan || '',
      ekskul: mine.filter(function (k) { return k.jenis === 'Ekstrakurikuler'; }).map(slim),
      prestasi: mine.filter(function (k) { return k.jenis === 'Prestasi'; }).map(slim)
    };
  });
  return { tipe: 'akademik', kelas: d.kelas, tahun: P.tahun_ajaran, semester: P.semester,
    sekolah: { nama: P.nama_sekolah, alamat: P.alamat_sekolah, kota: P.kota, tanggal: P.tanggal_rapor, kepsek: P.kepala_sekolah, nipy: P.nipy_kepala_sekolah },
    wali: { nama: kls.wali || '', nipy: kls.nipy || '' }, santri: santri };
}

/* ---------- Rapor Pondok (deskriptif: predikat + deskripsi) ---------- */
const PRD = ['Berkembang Sangat Baik', 'Berkembang Sesuai Harapan', 'Mulai Berkembang', 'Belum Berkembang'];
const KAT_PONDOK = ['Syakhsiyyah Islamiyyah', 'Languages', 'Tahsin dan Tahfizh', 'Multiple Intelligences', "I'dadi"];
const KEL_PONDOK = ['Languages', "I'dadi"]; // kelompok Mapel yang masuk Rapor Pondok (draf dari nilai)

function predikat_(x, P) {
  return x >= +P.ambang_bsb ? PRD[0] : x >= +P.ambang_bsh ? PRD[1] : x >= +P.ambang_mb ? PRD[2] : PRD[3];
}

/** Draf Rapor Pondok: Languages/I'dadi (dari nilai akhir), Sikap (Log Perilaku) dan Mutaba'ah Yaumiyah. Baris yang sudah diedit manual tidak ditimpa. */
function draftPondok_(d, U) {
  if (!d || !d.kelas) throw new Error('Pilih kelas.');
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const C = loadC_(), P = C.P, per = (P.tahun_ajaran + ' ' + P.semester).trim(), cand = [];
    read_('Mapel').filter(function (m) { return KEL_PONDOK.indexOf(m.kelompok) > -1; }).forEach(function (m) {
      rekap_({ kelas: d.kelas, mapel: m.nama }, C).forEach(function (r) {
        if (r.akhir !== null) cand.push({ siswa: r.siswa, kategori: m.kelompok, subjek: m.nama, predikat: predikat_(r.akhir, P), deskripsi: r.deskripsi });
      });
    });
    const sk = sikap_(d, C);
    Object.keys(sk).forEach(function (nm) {
      cand.push({ siswa: nm, kategori: KAT_PONDOK[0], subjek: 'Sikap dan Akhlak', predikat: sk[nm].predikat, deskripsi: sk[nm].deskripsi });
    });
    const mt = mutabaah_(d, C);
    Object.keys(mt).forEach(function (nm) {
      mt[nm].forEach(function (g) {
        cand.push({ siswa: nm, kategori: KAT_PONDOK[0], subjek: "Mutaba'ah Yaumiyah - " + g.kelompok, predikat: g.predikat, deskripsi: g.deskripsi });
      });
    });
    const tf = tahfizh_(d, C);
    Object.keys(tf).forEach(function (nm) {
      tf[nm].forEach(function (r) { cand.push({ siswa: nm, kategori: KAT_PONDOK[2], subjek: r.subjek, predikat: r.predikat, deskripsi: r.deskripsi }); });
    });
    const mi = mi_(d, C);
    Object.keys(mi).forEach(function (nm) {
      mi[nm].forEach(function (r) { cand.push({ siswa: nm, kategori: KAT_PONDOK[3], subjek: r.subjek, predikat: r.predikat, deskripsi: r.deskripsi }); });
    });
    if (!cand.length) throw new Error("Belum ada data untuk dibuat draf (nilai mapel Languages/I'dadi, Log Perilaku, Mutaba'ah, Tahsin & Tahfizh, atau MI).");
    const s = ss_().getSheetByName('NilaiPondok'), h = SCHEMA.NilaiPondok, ex = read_('NilaiPondok'), upd = [], add = [];
    cand.forEach(function (c) {
      const row = Object.assign({ periode: per, kelas: d.kelas, sumber: 'otomatis' }, c);
      const old = ex.find(function (x) {
        return x.periode === per && x.kelas === d.kelas && x.siswa === c.siswa && x.kategori === c.kategori && x.subjek === c.subjek;
      });
      if (old && old.sumber === 'manual') return;
      const arr = function (id, oleh) { return h.map(function (k) { return k === 'id' ? id : k === 'oleh' ? oleh : (row[k] === undefined ? '' : row[k]); }); };
      if (old) upd.push([old._r, arr(old.id, old.oleh)]); else add.push(arr(Utilities.getUuid(), U.username));
    });
    upd.forEach(function (u) { s.getRange(u[0], 1, 1, h.length).setNumberFormat('@').setValues([u[1]]); });
    if (add.length) {
      const start = s.getLastRow() + 1;
      if (start + add.length - 1 > s.getMaxRows()) s.insertRowsAfter(s.getMaxRows(), add.length);
      s.getRange(start, 1, add.length, h.length).setNumberFormat('@').setValues(add);
    }
    return upd.length + add.length;
  } finally {
    lock.releaseLock();
  }
}

/* ---------- Sikap (Log Perilaku) dan Mutaba'ah Yaumiyah ---------- */
function inRange_(P, t) { return (!P.mulai || t >= P.mulai) && (!P.selesai || t <= P.selesai); }
function pred_(x, a, b, c) { return x >= a ? PRD[0] : x >= b ? PRD[1] : x >= c ? PRD[2] : PRD[3]; }
function joinId_(a) { return a.length < 2 ? (a[0] || '') : a.length === 2 ? a[0] + ' dan ' + a[1] : a.slice(0, -1).join(', ') + ', dan ' + a[a.length - 1]; }

/** Sikap per siswa dari Log Perilaku: poin Positif dikurangi poin Negatif, dikelompokkan per aspek. Siswa tanpa catatan dilewati. */
function sikap_(d, C) {
  const P = C.P, rows = read_('Perilaku').filter(function (r) { return r.kelas === d.kelas && inRange_(P, r.tanggal); }), out = {};
  C.siswa.filter(function (s) { return s.kelas === d.kelas; }).forEach(function (s) {
    const mine = rows.filter(function (r) { return r.siswa === s.nama; });
    if (!mine.length) return;
    let net = 0; const by = {};
    mine.forEach(function (r) {
      const p = num_(r.poin) || 0, v = r.jenis === 'Negatif' ? -p : p, a = r.aspek || 'Umum';
      net += v; by[a] = (by[a] || 0) + v;
    });
    const pos = Object.keys(by).filter(function (a) { return by[a] > 0; }), neg = Object.keys(by).filter(function (a) { return by[a] < 0; });
    let t = pos.length ? P.sebutan + ' menunjukkan sikap yang baik dan terus berkembang dalam aspek ' + joinId_(pos) + '.' : '';
    if (neg.length) t += (t ? '\n' : '') + P.sebutan + ' masih perlu bimbingan dan pembiasaan dalam aspek ' + joinId_(neg) + '.';
    out[s.nama] = { predikat: pred_(net, +P.sikap_bsb, +P.sikap_bsh, +P.sikap_mb), deskripsi: t || P.sebutan + ' menunjukkan sikap yang cukup stabil.' };
  });
  return out;
}

/** Mutaba'ah per siswa: persentase hari terlaksana tiap item, diringkas per kelompok item. */
function mutabaah_(d, C) {
  const P = C.P, items = read_('ItemMutabaah').sort(function (x, y) { return (+x.urut || 0) - (+y.urut || 0); });
  const rows = read_('Mutabaah').filter(function (r) { return r.kelas === d.kelas && inRange_(P, r.tanggal); }), out = {};
  const A = +P.mut_bsb, B = +P.mut_bsh, M = +P.mut_mb;
  C.siswa.filter(function (s) { return s.kelas === d.kelas; }).forEach(function (s) {
    const mine = rows.filter(function (r) { return r.siswa === s.nama; });
    if (!mine.length || !items.length) return;
    const pct = {};
    items.forEach(function (i) {
      pct[i.id] = 100 * mine.filter(function (r) { return String(r.selesai).split(',').indexOf(i.id) > -1; }).length / mine.length;
    });
    const groups = [];
    items.forEach(function (i) { if (groups.indexOf(i.kelompok) < 0) groups.push(i.kelompok); });
    out[s.nama] = groups.map(function (g) {
      const its = items.filter(function (i) { return i.kelompok === g; });
      const avg = its.reduce(function (t, i) { return t + pct[i.id]; }, 0) / its.length;
      const bk = { a: [], b: [], c: [], p: [] };
      its.forEach(function (i) { bk[pct[i.id] >= A ? 'a' : pct[i.id] >= B ? 'b' : pct[i.id] >= M ? 'c' : 'p'].push(i.nama); });
      const seg = [];
      if (bk.a.length) seg.push('sangat konsisten dalam ' + joinId_(bk.a));
      if (bk.b.length) seg.push('konsisten dalam ' + joinId_(bk.b));
      if (bk.c.length) seg.push('mulai konsisten dalam ' + joinId_(bk.c));
      let t = seg.length ? P.sebutan + ' ' + seg.join('; ') + '.' : '';
      if (bk.p.length) t += (t ? '\n' : '') + P.sebutan + ' masih perlu pembiasaan dalam ' + joinId_(bk.p) + '.';
      return { kelompok: g, predikat: pred_(avg, A, B, M), deskripsi: t };
    });
  });
  return out;
}

/** Data cetak Rapor Pondok: hanya baris final dari sheet NilaiPondok pada semester aktif. */
function raporPondokData_(d) {
  if (!d || !d.kelas) throw new Error('Pilih kelas.');
  const P = settings_(), per = (P.tahun_ajaran + ' ' + P.semester).trim();
  const kls = read_('Kelas').find(function (k) { return k.nama === d.kelas; }) || {};
  const rows = read_('NilaiPondok').filter(function (r) { return r.kelas === d.kelas && r.periode === per; });
  const santri = read_('Siswa').filter(function (s) { return s.kelas === d.kelas && (!d.siswa || s.nama === d.siswa); }).map(function (s) {
    return {
      nama: s.nama, nisg: s.nis, nisn: s.nisn || '',
      kategori: KAT_PONDOK.map(function (k) {
        return { nama: k, rows: rows.filter(function (r) { return r.siswa === s.nama && r.kategori === k; })
          .map(function (r) { return { subjek: r.subjek, predikat: r.predikat, deskripsi: r.deskripsi }; }) };
      }).filter(function (g) { return g.rows.length; })
    };
  });
  return { tipe: 'pondok', kelas: d.kelas, tahun: P.tahun_ajaran, semester: P.semester,
    sekolah: { nama: P.nama_sekolah, alamat: P.alamat_sekolah, kota: P.kota, tanggal: P.tanggal_rapor, kepsek: P.kepala_sekolah, nipy: P.nipy_kepala_sekolah },
    wali: { nama: kls.wali || '', nipy: kls.nipy || '' }, santri: santri };
}

/* ---------- Tahsin dan Tahfizh (log setoran per siswa) ---------- */
const SURAH = [["Al-Fatihah", 7], ["Al-Baqarah", 286], ["Ali Imran", 200], ["An-Nisa", 176], ["Al-Ma'idah", 120], ["Al-An'am", 165], ["Al-A'raf", 206], ["Al-Anfal", 75], ["At-Taubah", 129], ["Yunus", 109], ["Hud", 123], ["Yusuf", 111], ["Ar-Ra'd", 43], ["Ibrahim", 52], ["Al-Hijr", 99], ["An-Nahl", 128], ["Al-Isra", 111], ["Al-Kahf", 110], ["Maryam", 98], ["Taha", 135], ["Al-Anbiya", 112], ["Al-Hajj", 78], ["Al-Mu'minun", 118], ["An-Nur", 64], ["Al-Furqan", 77], ["Asy-Syu'ara", 227], ["An-Naml", 93], ["Al-Qasas", 88], ["Al-Ankabut", 69], ["Ar-Rum", 60], ["Luqman", 34], ["As-Sajdah", 30], ["Al-Ahzab", 73], ["Saba", 54], ["Fatir", 45], ["Yasin", 83], ["As-Saffat", 182], ["Sad", 88], ["Az-Zumar", 75], ["Gafir", 85], ["Fussilat", 54], ["Asy-Syura", 53], ["Az-Zukhruf", 89], ["Ad-Dukhan", 59], ["Al-Jasiyah", 37], ["Al-Ahqaf", 35], ["Muhammad", 38], ["Al-Fath", 29], ["Al-Hujurat", 18], ["Qaf", 45], ["Az-Zariyat", 60], ["At-Tur", 49], ["An-Najm", 62], ["Al-Qamar", 55], ["Ar-Rahman", 78], ["Al-Waqi'ah", 96], ["Al-Hadid", 29], ["Al-Mujadalah", 22], ["Al-Hasyr", 24], ["Al-Mumtahanah", 13], ["As-Saff", 14], ["Al-Jumu'ah", 11], ["Al-Munafiqun", 11], ["At-Tagabun", 18], ["At-Talaq", 12], ["At-Tahrim", 12], ["Al-Mulk", 30], ["Al-Qalam", 52], ["Al-Haqqah", 52], ["Al-Ma'arij", 44], ["Nuh", 28], ["Al-Jinn", 28], ["Al-Muzzammil", 20], ["Al-Muddassir", 56], ["Al-Qiyamah", 40], ["Al-Insan", 31], ["Al-Mursalat", 50], ["An-Naba", 40], ["An-Nazi'at", 46], ["Abasa", 42], ["At-Takwir", 29], ["Al-Infitar", 19], ["Al-Mutaffifin", 36], ["Al-Insyiqaq", 25], ["Al-Buruj", 22], ["At-Tariq", 17], ["Al-A'la", 19], ["Al-Gasyiyah", 26], ["Al-Fajr", 30], ["Al-Balad", 20], ["Asy-Syams", 15], ["Al-Lail", 21], ["Ad-Duha", 11], ["Asy-Syarh", 8], ["At-Tin", 8], ["Al-Alaq", 19], ["Al-Qadr", 5], ["Al-Bayyinah", 8], ["Az-Zalzalah", 8], ["Al-Adiyat", 11], ["Al-Qari'ah", 11], ["At-Takasur", 8], ["Al-Asr", 3], ["Al-Humazah", 9], ["Al-Fil", 5], ["Quraisy", 4], ["Al-Ma'un", 7], ["Al-Kausar", 3], ["Al-Kafirun", 6], ["An-Nasr", 3], ["Al-Masad", 5], ["Al-Ikhlas", 4], ["Al-Falaq", 5], ["An-Nas", 6]];
const SURAH_AYAT = {};
SURAH.forEach(function (x) { SURAH_AYAT[x[0]] = x[1]; });
const KUAL_SKOR = { 'Mutqin': 4, 'Lancar': 3, 'Cukup': 2, 'Perlu Mengulang': 1 };

function cekSetoran_(d) {
  if (!d.surat && !d.dari && !d.sampai) return;
  const max = SURAH_AYAT[d.surat], a = +d.dari, b = +d.sampai;
  if (!max) throw new Error('Pilih surat yang valid.');
  if (!a || !b || a > b || b > max) throw new Error('Rentang ayat tidak valid (' + d.surat + ' memiliki ' + max + ' ayat).');
}

function kualitasKata_(avg) {
  return avg >= 3.5 ? 'sangat lancar dan mutqin' : avg >= 2.5 ? 'lancar' : avg >= 1.5 ? 'cukup lancar tetapi masih memerlukan banyak koreksi' : 'belum lancar dan perlu banyak mengulang';
}

/** Ringkasan Tahfizh (ziyadah, murojaah) dan Tahsin per siswa dari log Setoran. Siswa tanpa setoran dilewati. */
function tahfizh_(d, C) {
  const P = C.P, S = P.sebutan, out = {};
  const kls = read_('Kelas').find(function (k) { return k.nama === d.kelas; }) || {}, target = +kls.target_ziyadah || 0;
  const rows = read_('Setoran').filter(function (r) { return r.kelas === d.kelas && inRange_(P, r.tanggal); });
  const A = +P.tfz_bsb, B = +P.tfz_bsh, M = +P.tfz_mb;
  const skor = function (l) { // rata-rata skor kualitas 1-4 (null bila tidak ada)
    const v = l.map(function (r) { return KUAL_SKOR[r.kualitas]; }).filter(function (x) { return x; });
    return v.length ? v.reduce(function (t, x) { return t + x; }, 0) / v.length : null;
  };
  C.siswa.filter(function (s) { return s.kelas === d.kelas; }).forEach(function (s) {
    const mine = rows.filter(function (r) { return r.siswa === s.nama; }), res = [];
    if (!mine.length) return;
    const z = mine.filter(function (r) { return r.jenis === 'Ziyadah'; });
    if (z.length) {
      const total = z.reduce(function (t, r) { return t + (r.surat && +r.dari && +r.sampai ? Math.max(0, +r.sampai - +r.dari + 1) : 0); }, 0);
      const last = z.slice().sort(function (x, y) { return y.tanggal < x.tanggal ? -1 : 1; })[0];
      const q = skor(z), qp = q === null ? 0 : q / 4 * 100, ratio = target ? Math.min(100, total / target * 100) : null;
      const sc = ratio === null ? qp : 0.6 * ratio + 0.4 * qp;
      let t = S + ' menambah hafalan baru sebanyak ' + total + ' ayat pada semester ini' + (ratio === null ? '' : ' (' + Math.round(total / target * 100) + '% dari target ' + target + ' ayat)');
      if (last.surat) t += ', hingga ' + last.surat + ' ayat ' + last.sampai;
      t += '.' + (q === null ? '' : ' Setoran ziyadah ' + kualitasKata_(q) + '.');
      res.push({ subjek: 'Tahfizh - Ziyadah', predikat: pred_(sc, A, B, M), deskripsi: t });
    }
    const m = mine.filter(function (r) { return r.jenis === 'Murojaah'; });
    if (m.length) {
      const q = skor(m);
      res.push({ subjek: 'Tahfizh - Murojaah', predikat: pred_(q === null ? 0 : q / 4 * 100, A, B, M),
        deskripsi: S + ' melaksanakan murojaah sebanyak ' + m.length + ' kali' + (q === null ? '.' : '; hafalan lama ' + kualitasKata_(q) + '.') });
    }
    const h = mine.filter(function (r) { return r.jenis === 'Tahsin'; });
    if (h.length) {
      const q = skor(h), lastH = h.slice().sort(function (x, y) { return y.tanggal < x.tanggal ? -1 : 1; })[0];
      res.push({ subjek: 'Tahsin', predikat: pred_(q === null ? 0 : q / 4 * 100, A, B, M),
        deskripsi: S + ' mengikuti tahsin sebanyak ' + h.length + ' kali' + (lastH.materi ? ' (materi terakhir: ' + lastH.materi + ')' : '') + (q === null ? '.' : '; bacaan ' + kualitasKata_(q) + '.') });
    }
    out[s.nama] = res;
  });
  return out;
}

/* ---------- Multiple Intelligences (10 kecerdasan) ---------- */
const MI_LIST = [
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
const MI_NAMA = MI_LIST.map(function (x) { return x[0]; });
const MI_SUMBER = ['Observasi', 'Kuesioner'];

function cekMI_(d) {
  const v = num_(d.skor);
  if (MI_NAMA.indexOf(d.kecerdasan) < 0) throw new Error('Pilih kecerdasan yang valid.');
  if (MI_SUMBER.indexOf(d.sumber) < 0) throw new Error('Sumber harus Observasi atau Kuesioner.');
  if (v === null || v < 1 || v > 4) throw new Error('Skor harus antara 1 dan 4.');
}

/** Simpan skor MI satu siswa (hingga 10 kecerdasan) dari satu sumber; menimpa skor milik pengguna yang sama pada semester ini. */
function saveMI_(d, U) {
  if (!d || !d.kelas || !d.siswa || MI_SUMBER.indexOf(d.sumber) < 0) throw new Error('Lengkapi kelas, siswa, dan sumber.');
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const per = periode_(), s = ss_().getSheetByName('MI'), h = SCHEMA.MI, ex = read_('MI'), upd = [], add = [];
    MI_NAMA.forEach(function (nm) {
      const v = d.skor ? num_(d.skor[nm]) : null;
      if (v === null) return;
      if (v < 1 || v > 4) throw new Error('Skor ' + nm + ' harus antara 1 dan 4.');
      const row = { periode: per, kelas: d.kelas, siswa: d.siswa, kecerdasan: nm, sumber: d.sumber, skor: String(v), catatan: d.catatan || '' };
      const old = ex.find(function (x) {
        return x.periode === per && x.siswa === d.siswa && x.sumber === d.sumber && x.kecerdasan === nm && x.oleh === U.username;
      });
      const arr = function (id) { return h.map(function (k) { return k === 'id' ? id : k === 'oleh' ? U.username : (row[k] === undefined ? '' : row[k]); }); };
      if (old) upd.push([old._r, arr(old.id)]); else add.push(arr(Utilities.getUuid()));
    });
    if (!upd.length && !add.length) throw new Error('Isi minimal satu skor.');
    upd.forEach(function (u) { s.getRange(u[0], 1, 1, h.length).setNumberFormat('@').setValues([u[1]]); });
    if (add.length) {
      const start = s.getLastRow() + 1;
      if (start + add.length - 1 > s.getMaxRows()) s.insertRowsAfter(s.getMaxRows(), add.length);
      s.getRange(start, 1, add.length, h.length).setNumberFormat('@').setValues(add);
    }
    return upd.length + add.length;
  } finally {
    lock.releaseLock();
  }
}

function deskMI_(r, P) {
  const S = P.sebutan, nama = r.mi[0], frase = r.mi[1], parts = [];
  const lv = PRD.indexOf(pred_(r.skor, +P.mi_bsb, +P.mi_bsh, +P.mi_mb));
  if (r.src.indexOf('Observasi') > -1) parts.push('pengamatan guru');
  if (r.src.indexOf('Kuesioner') > -1) parts.push('hasil kuesioner');
  if (r.ev.length) parts.push('keterlibatan dalam ' + joinId_(r.ev));
  const dasar = parts.length ? ' Hal ini terlihat dari ' + joinId_(parts) + '.' : '';
  if (lv === 0) return S + ' sangat menonjol dalam kecerdasan ' + nama + ', yaitu ' + frase + '.' + dasar;
  if (lv === 1) return S + ' menunjukkan kecerdasan ' + nama + ' yang berkembang sesuai harapan, yaitu ' + frase + '.' + dasar;
  if (lv === 2) return 'Kecerdasan ' + nama + ' (' + frase + ') mulai berkembang pada ' + S + ' dan perlu terus distimulasi melalui kegiatan yang sesuai.' + dasar;
  return 'Kecerdasan ' + nama + ' (' + frase + ') belum tampak menonjol pada ' + S + ' dan perlu lebih banyak kesempatan untuk berkembang.' + dasar;
}

/** MI per siswa: gabungan berbobot dari Observasi, Kuesioner (log MI) dan Kegiatan (turunan dari PetaMI: ekskul dan nilai mapel). Urut dari yang paling menonjol. */
function mi_(d, C) {
  const P = C.P, per = (P.tahun_ajaran + ' ' + P.semester).trim(), out = {};
  const W = { Observasi: +P.mi_w_obs, Kuesioner: +P.mi_w_kues, Kegiatan: +P.mi_w_keg };
  const rows = read_('MI').filter(function (r) { return r.kelas === d.kelas && r.periode === per; });
  const peta = read_('PetaMI');
  const keg = read_('Kegiatan').filter(function (r) { return r.kelas === d.kelas && r.periode === per && r.jenis === 'Ekstrakurikuler'; });
  const nm = {};
  peta.filter(function (p) { return p.sumber === 'Mapel'; }).forEach(function (p) {
    if (nm[p.nama]) return;
    nm[p.nama] = {};
    rekap_({ kelas: d.kelas, mapel: p.nama }, C).forEach(function (r) { if (r.akhir !== null) nm[p.nama][r.siswa] = r.akhir; });
  });
  const s4 = function (x) { return x >= +P.ambang_bsb ? 4 : x >= +P.ambang_bsh ? 3 : x >= +P.ambang_mb ? 2 : 1; };
  const HURUF = { A: 4, B: 3, C: 2, D: 1 };
  C.siswa.filter(function (s) { return s.kelas === d.kelas; }).forEach(function (s) {
    const res = [];
    MI_LIST.forEach(function (mi) {
      const src = {}, ev = [], sc = [];
      MI_SUMBER.forEach(function (sm) {
        const v = rows.filter(function (r) { return r.siswa === s.nama && r.kecerdasan === mi[0] && r.sumber === sm; })
          .map(function (r) { return num_(r.skor); }).filter(function (x) { return x !== null; });
        if (v.length) src[sm] = avg_(v);
      });
      peta.filter(function (p) { return p.kecerdasan === mi[0]; }).forEach(function (p) {
        if (p.sumber === 'Mapel' && nm[p.nama] && nm[p.nama][s.nama] !== undefined) { sc.push(s4(nm[p.nama][s.nama])); ev.push(p.nama); }
        if (p.sumber === 'Kegiatan') {
          keg.filter(function (k) { return k.siswa === s.nama && k.kegiatan === p.nama; }).forEach(function (k) {
            sc.push(HURUF[String(k.nilai).trim().toUpperCase()] || 3); ev.push(p.nama);
          });
        }
      });
      if (sc.length) src.Kegiatan = avg_(sc);
      const ks = Object.keys(src);
      if (!ks.length) return;
      const ws = ks.reduce(function (t, k) { return t + W[k]; }, 0);
      const skor = ws ? ks.reduce(function (t, k) { return t + src[k] * W[k]; }, 0) / ws : avg_(ks.map(function (k) { return src[k]; }));
      res.push({ mi: mi, skor: skor, src: ks, ev: ev.filter(function (x, i) { return ev.indexOf(x) === i; }) });
    });
    if (!res.length) return;
    res.sort(function (a, b) { return b.skor - a.skor; });
    out[s.nama] = res.map(function (r) {
      return { subjek: 'Kecerdasan ' + r.mi[0], predikat: pred_(r.skor, +P.mi_bsb, +P.mi_bsh, +P.mi_mb), deskripsi: deskMI_(r, P) };
    });
  });
  return out;
}

/* ---------- Kuesioner MI (diisi santri, skala 1-4) ---------- */
const SOAL_AWAL = [["Linguistik", "Saya senang membaca buku, artikel, atau kitab di waktu luang."], ["Linguistik", "Saya mudah menyampaikan pendapat dengan kata-kata, baik lisan maupun tulisan."], ["Linguistik", "Saya suka menulis cerita, puisi, atau catatan harian."], ["Linguistik", "Saya mudah mengingat kosakata baru, termasuk kosakata bahasa Arab atau Inggris."], ["Linguistik", "Saya suka berpidato, berdiskusi, atau bercerita di depan teman."], ["Logis-Matematis", "Saya senang berhitung dan mengerjakan soal-soal yang berhubungan dengan angka."], ["Logis-Matematis", "Saya suka mencari tahu sebab dan alasan dari suatu kejadian."], ["Logis-Matematis", "Saya senang memecahkan teka-teki, sudoku, atau soal logika."], ["Logis-Matematis", "Saya suka mengelompokkan dan mengurutkan sesuatu secara teratur."], ["Logis-Matematis", "Saya mudah menemukan pola atau aturan dalam suatu masalah."], ["Visual-Spasial", "Saya senang menggambar, mewarnai, atau mendesain sesuatu."], ["Visual-Spasial", "Saya mudah membayangkan bentuk dan letak benda dalam pikiran."], ["Visual-Spasial", "Saya mudah memahami peta, diagram, dan gambar."], ["Visual-Spasial", "Saya peka terhadap warna dan tata letak yang indah."], ["Visual-Spasial", "Saya lebih mudah mengingat sesuatu jika melihat gambarnya."], ["Musikal", "Saya mudah mengenali nada atau irama dari lagu, nasyid, atau lantunan yang saya dengar."], ["Musikal", "Saya senang bersenandung, bernyanyi, atau melantunkan bacaan dengan irama."], ["Musikal", "Saya suka memainkan alat musik, rebana, atau mengetukkan irama."], ["Musikal", "Saya mudah menghafal jika dibantu irama atau lagu."], ["Musikal", "Saya terganggu jika mendengar nada yang tidak tepat."], ["Kinestetik", "Saya senang kegiatan yang banyak bergerak seperti olahraga, pramuka, atau senam."], ["Kinestetik", "Saya sulit duduk diam dalam waktu lama."], ["Kinestetik", "Saya mudah belajar sesuatu dengan langsung mempraktikkannya."], ["Kinestetik", "Saya terampil memakai tangan, misalnya membuat kerajinan atau memperbaiki barang."], ["Kinestetik", "Gerakan badan saya luwes dan terkoordinasi."], ["Interpersonal", "Saya mudah berteman dan bergaul dengan siapa saja."], ["Interpersonal", "Saya senang belajar atau bekerja dalam kelompok."], ["Interpersonal", "Saya peka terhadap perasaan teman dan senang menolong."], ["Interpersonal", "Teman-teman sering meminta pendapat atau bantuan saya."], ["Interpersonal", "Saya mudah menjadi penengah ketika teman berselisih."], ["Intrapersonal", "Saya tahu dengan baik kelebihan dan kekurangan saya."], ["Intrapersonal", "Saya senang menyendiri untuk berpikir dan merenung."], ["Intrapersonal", "Saya punya target pribadi dan berusaha mencapainya."], ["Intrapersonal", "Saya mampu mengendalikan emosi dengan baik."], ["Intrapersonal", "Saya senang mengevaluasi apa yang sudah saya lakukan."], ["Naturalis", "Saya senang berada di alam terbuka seperti kebun, sawah, atau gunung."], ["Naturalis", "Saya suka merawat tanaman atau hewan."], ["Naturalis", "Saya mudah mengenali jenis tumbuhan dan hewan."], ["Naturalis", "Saya peduli terhadap kebersihan dan kelestarian lingkungan."], ["Naturalis", "Saya tertarik mengamati cuaca, bintang, dan gejala alam."], ["Eksistensial", "Saya sering bertanya tentang tujuan hidup dan makna keberadaan manusia."], ["Eksistensial", "Saya suka memikirkan hal-hal besar seperti alam semesta, kematian, dan akhirat."], ["Eksistensial", "Saya senang berdiskusi tentang pertanyaan mendasar tentang kehidupan."], ["Eksistensial", "Saya sering merenungkan apa yang ingin saya capai dalam hidup."], ["Eksistensial", "Saya tertarik memahami hikmah di balik suatu peristiwa."], ["Spiritual", "Saya merasa tenang dan dekat dengan Allah ketika beribadah."], ["Spiritual", "Saya berusaha menjaga shalat dan ibadah sunnah dengan penuh kesadaran."], ["Spiritual", "Saya senang membaca dan mempelajari Al-Qur'an dan hadits."], ["Spiritual", "Saya berusaha jujur dan berakhlak baik dalam setiap keadaan."], ["Spiritual", "Saya mudah bersyukur dan bersabar saat menghadapi masalah."]]; // draf 5 pernyataan per kecerdasan; ubah lewat menu Butir Kuesioner MI

/** Simpan jawaban kuesioner satu santri: rata-rata per kecerdasan masuk ke MI (sumber Kuesioner), jawaban mentah disimpan di KuesionerMI. */
function saveKuesioner_(d, U) {
  if (!d || !d.kelas || !d.siswa || !d.jawaban) throw new Error('Data kuesioner tidak lengkap.');
  const by = {}, ids = [];
  read_('SoalMI').forEach(function (q) {
    const v = num_(d.jawaban[q.id]);
    if (v === null) return;
    if (v < 1 || v > 4) throw new Error('Jawaban harus 1 sampai 4.');
    (by[q.kecerdasan] = by[q.kecerdasan] || []).push(v);
    ids.push(q.id + ':' + v);
  });
  if (!ids.length) throw new Error('Belum ada jawaban.');
  const skor = {};
  Object.keys(by).forEach(function (k) { skor[k] = Math.round(avg_(by[k]) * 100) / 100; });
  saveMI_({ kelas: d.kelas, siswa: d.siswa, sumber: 'Kuesioner', skor: skor, catatan: 'Kuesioner mandiri' }, { username: 'kuesioner' });
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const s = ss_().getSheetByName('KuesionerMI'), h = SCHEMA.KuesionerMI, per = periode_();
    const old = read_('KuesionerMI').find(function (r) { return r.periode === per && r.siswa === d.siswa && r.kelas === d.kelas; });
    const row = { periode: per, kelas: d.kelas, siswa: d.siswa, tanggal: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'), jawaban: ids.join(',') };
    const arr = h.map(function (k) { return k === 'id' ? (old ? old.id : Utilities.getUuid()) : k === 'oleh' ? U.username : (row[k] === undefined ? '' : row[k]); });
    if (old) s.getRange(old._r, 1, 1, h.length).setNumberFormat('@').setValues([arr]);
    else {
      if (s.getLastRow() >= s.getMaxRows()) s.insertRowAfter(s.getMaxRows());
      s.getRange(s.getLastRow() + 1, 1, 1, h.length).setNumberFormat('@').setValues([arr]);
    }
  } finally {
    lock.releaseLock();
  }
  return Object.keys(skor).length;
}

/* ---------- Piket Musyrif (kehadiran santri per kamar saat kegiatan) ---------- */
const PIKET_STATUS = ['Hadir Awal Waktu', 'Hadir Tepat Waktu', 'Hadir Terlambat', 'Sakit', 'Izin', 'Tanpa Keterangan'];
const KEGIATAN_AWAL = ["Shalat Subuh Berjamaah", "Halaqah Quran", "Shalat Dzuhur Berjamaah", "Shalat Ashar Berjamaah", "Shalat Maghrib Berjamaah", "Shalat Isya Berjamaah", "Belajar Malam", "Apel Pagi"]; // contoh awal; ubah lewat menu Kegiatan Piket

/** Baris kehadiran milik satu piket (dicari lewat TextFinder agar tidak membaca seluruh sheet). */
function absenRows_(id) {
  const sh = ss_().getSheetByName('PiketAbsen'), n = sh.getLastRow() - 1;
  if (n < 1) return [];
  const f = sh.getRange(2, 2, n, 1).createTextFinder(id).matchEntireCell(true).findAll();
  if (!f.length) return [];
  const rs = f.map(function (c) { return c.getRow(); }), a = Math.min.apply(null, rs), b = Math.max.apply(null, rs), h = SCHEMA.PiketAbsen;
  return sh.getRange(a, 1, b - a + 1, h.length).getValues().map(function (v, i) {
    const o = { _r: a + i };
    h.forEach(function (k, j) { o[k] = String(v[j]); });
    return o;
  }).filter(function (o) { return o.piket === id; });
}

function hapusAbsen_(id) {
  const rows = absenRows_(id).map(function (o) { return o._r; }).sort(function (x, y) { return y - x; });
  const sh = ss_().getSheetByName('PiketAbsen');
  let i = 0;
  while (i < rows.length) { // hapus per blok berurutan, dari bawah ke atas
    let j = i;
    while (j + 1 < rows.length && rows[j + 1] === rows[j] - 1) j++;
    sh.deleteRows(rows[j], j - i + 1);
    i = j + 1;
  }
}

function listPiket_(d, U) {
  const adm = U.role === 'admin';
  return read_('Piket').filter(function (r) {
    return (adm || r.oleh === U.username) && (!d || !d.dari || r.tanggal >= d.dari) && (!d || !d.sampai || r.tanggal <= d.sampai);
  }).map(clean_);
}

function getPiket_(d, U) {
  const p = read_('Piket').find(function (r) { return r.id === (d && d.id); });
  if (!p) throw new Error('Piket tidak ditemukan.');
  if (U.role !== 'admin' && p.oleh !== U.username) throw new Error('Piket ini dicatat oleh musyrif lain.');
  return absenRows_(p.id).map(clean_);
}

/** Simpan satu piket: header (tanggal, kegiatan, kamar) dan daftar kehadiran. Satu catatan per tanggal + kegiatan + kamar; menyimpan ulang menggantikan yang lama. */
function savePiket_(d, U) {
  if (!d || !d.tanggal || !d.kegiatan || !d.kamar || !Array.isArray(d.absen) || !d.absen.length) throw new Error('Lengkapi tanggal, kegiatan, kamar, dan daftar kehadiran.');
  d.absen.forEach(function (a) { if (PIKET_STATUS.indexOf(a.status) < 0) throw new Error('Status kehadiran tidak valid.'); });
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const hs = ss_().getSheetByName('Piket'), hh = SCHEMA.Piket, all = read_('Piket');
    let ex = d.id ? all.find(function (r) { return r.id === d.id; }) : null;
    if (!ex) ex = all.find(function (r) { return r.tanggal === d.tanggal && r.kegiatan === d.kegiatan && r.kamar === d.kamar; }) || null;
    if (ex && U.role !== 'admin' && ex.oleh !== U.username) throw new Error('Piket ini dicatat oleh musyrif lain.');
    const id = ex ? ex.id : Utilities.getUuid();
    if (ex) { const keep = ids_(d.foto); trash_(ids_(ex.foto).filter(function (x) { return keep.indexOf(x) < 0; })); hapusAbsen_(id); }
    const cnt = PIKET_STATUS.map(function (s) { return d.absen.filter(function (a) { return a.status === s; }).length; });
    const row = { id: id, tanggal: d.tanggal, kegiatan: d.kegiatan, kamar: d.kamar, musyrif: d.musyrif || U.nama || U.username,
                  catatan: d.catatan || '', foto: d.foto || '', rekap: cnt.join(','), oleh: ex ? ex.oleh : U.username };
    const arr = hh.map(function (k) { return row[k] === undefined ? '' : row[k]; });
    if (ex) hs.getRange(ex._r, 1, 1, hh.length).setNumberFormat('@').setValues([arr]);
    else {
      if (hs.getLastRow() >= hs.getMaxRows()) hs.insertRowAfter(hs.getMaxRows());
      hs.getRange(hs.getLastRow() + 1, 1, 1, hh.length).setNumberFormat('@').setValues([arr]);
    }
    const ab = ss_().getSheetByName('PiketAbsen'), ha = SCHEMA.PiketAbsen;
    const rows = d.absen.map(function (a) {
      return ha.map(function (k) { return k === 'id' ? Utilities.getUuid() : k === 'piket' ? id : k === 'siswa' ? a.siswa : k === 'status' ? a.status : k === 'keterangan' ? (a.ket || '') : ''; });
    });
    const start = ab.getLastRow() + 1;
    if (start + rows.length - 1 > ab.getMaxRows()) ab.insertRowsAfter(ab.getMaxRows(), rows.length);
    ab.getRange(start, 1, rows.length, ha.length).setNumberFormat('@').setValues(rows);
    return rows.length;
  } finally {
    lock.releaseLock();
  }
}

/** Atur kamar banyak santri sekaligus (admin). d.data = [{id, kamar}] */
function setKamar_(d, U) {
  if (U.role !== 'admin') throw new Error('Akses ditolak.');
  if (!d || !Array.isArray(d.data)) throw new Error('Tidak ada data.');
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = ss_().getSheetByName('Siswa'), col = SCHEMA.Siswa.indexOf('kamar') + 1, by = {};
    read_('Siswa').forEach(function (r) { by[r.id] = r._r; });
    let n = 0;
    d.data.forEach(function (x) {
      if (by[x.id]) { sh.getRange(by[x.id], col).setNumberFormat('@').setValue(String(x.kamar || '').trim()); n++; }
    });
    return n;
  } finally {
    lock.releaseLock();
  }
}

/* ---------- Peran, wali kelas, pengampu, dan akun santri/orang tua ---------- */
const PERAN = ['admin', 'kepsek', 'guru', 'musyrif', 'santri'];
const SANTRI_OK = ['mutabaahSaya', 'raporSaya', 'gantiSandi']; // satu-satunya aksi untuk akun santri/orang tua
const TULIS = ['save', 'saveMany', 'remove', 'saveMI', 'saveKuesioner', 'savePiket', 'setKamar', 'draftPondok', 'buatAkun', 'terbitkanRapor'];
const SHARE_PENGAMPU = ['Presensi', 'Penilaian', 'Ujian'];
const MSG_KELAS = 'Anda bukan wali kelas dari kelas ini.';

function peran_(U) { return U.peran && U.peran.length ? U.peran : [U.role]; }
function punya_(U, p) { return peran_(U).indexOf(p) > -1; }
function waliKelas_(un) { return read_('Kelas').filter(function (k) { return k.wali_user === un; }).map(function (k) { return k.nama; }); }
function pengampu_(un) { return read_('Pengampu').filter(function (x) { return x.username === un; }); }
function bisaLihatKelas_(U, kelas) { return punya_(U, 'admin') || punya_(U, 'kepsek') || waliKelas_(U.username).indexOf(kelas) > -1; }
function bisaKelolaKelas_(U, kelas) { return punya_(U, 'admin') || waliKelas_(U.username).indexOf(kelas) > -1; }
function izinTulis_(U) { return punya_(U, 'admin') || punya_(U, 'guru') || punya_(U, 'musyrif') || waliKelas_(U.username).length > 0; }

/** Rekap nilai: admin, kepala sekolah, wali kelas, atau pengampu mapel itu. Selama guru belum punya penugasan sama sekali, tetap diizinkan (masa transisi). */
function cekRekap_(U, d) {
  if (!d) throw new Error('Pilih kelas dan mata pelajaran.');
  if (punya_(U, 'admin') || punya_(U, 'kepsek') || waliKelas_(U.username).indexOf(d.kelas) > -1) return;
  const mine = pengampu_(U.username);
  if (!mine.length || mine.some(function (p) { return p.kelas === d.kelas && p.mapel === d.mapel; })) return;
  throw new Error('Anda bukan pengampu mapel ini pada kelas tersebut.');
}

function rapor_(d, U) {
  if (!d || !bisaLihatKelas_(U, d.kelas)) throw new Error(MSG_KELAS);
  return raporData_(d);
}
function raporPondok_(d, U) {
  if (!d || !bisaLihatKelas_(U, d.kelas)) throw new Error(MSG_KELAS);
  return raporPondokData_(d);
}

/** Wali kelas atau admin menerbitkan/menarik rapor agar bisa dilihat akun orang tua/santri. */
function terbitkanRapor_(d, U) {
  if (!d || !bisaKelolaKelas_(U, d.kelas)) throw new Error(MSG_KELAS);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const k = read_('Kelas').find(function (x) { return x.nama === d.kelas; });
    if (!k) throw new Error('Kelas belum ada di menu Data Kelas.');
    ss_().getSheetByName('Kelas').getRange(k._r, SCHEMA.Kelas.indexOf('rapor_terbit') + 1).setNumberFormat('@').setValue(d.terbit ? 'ya' : '');
    return true;
  } finally {
    lock.releaseLock();
  }
}

function gantiSandi_(d, U) {
  if (!d || !d.lama || !d.baru) throw new Error('Isi kata sandi lama dan baru.');
  if (String(d.baru).length < 6) throw new Error('Kata sandi baru minimal 6 karakter.');
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const r = read_('Pengguna').find(function (x) { return x.username === U.username; });
    if (!r || r.hash !== hash_(d.lama)) throw new Error('Kata sandi lama salah.');
    const sh = ss_().getSheetByName('Pengguna'), h = SCHEMA.Pengguna;
    sh.getRange(r._r, h.indexOf('hash') + 1).setNumberFormat('@').setValue(hash_(d.baru));
    sh.getRange(r._r, h.indexOf('wajib_ganti') + 1).setNumberFormat('@').setValue('');
    return true;
  } finally {
    lock.releaseLock();
  }
}

const SANDI_ABJAD = 'abcdefghjkmnpqrstuvwxyz23456789'; // tanpa huruf/angka yang mudah tertukar
function sandiAcak_() {
  const u = Utilities.getUuid().replace(/-/g, '');
  let s = '';
  for (let i = 0; i < 7; i++) s += SANDI_ABJAD.charAt(parseInt(u.substr(i * 2, 2), 16) % SANDI_ABJAD.length);
  return s;
}

/** Admin: buat akun bersama santri + orang tua untuk satu kelas (username = NISG, sandi acak sekali tampil). d.ulang = id santri yang sandinya direset. */
function buatAkun_(d, U) {
  if (!punya_(U, 'admin')) throw new Error('Akses ditolak.');
  if (!d || !d.kelas) throw new Error('Pilih kelas.');
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = ss_().getSheetByName('Pengguna'), h = SCHEMA.Pengguna, users = read_('Pengguna'), by = {}, taken = {}, add = [], out = [];
    users.forEach(function (x) { taken[x.username] = 1; if (x.siswa) by[x.siswa] = x; });
    const only = d.ulang && d.ulang.length ? d.ulang : null;
    read_('Siswa').filter(function (s) { return s.kelas === d.kelas && (!only || only.indexOf(s.id) > -1); }).forEach(function (s) {
      const ada = by[s.id], pw = sandiAcak_();
      if (ada && !only) return;
      if (ada) {
        sh.getRange(ada._r, h.indexOf('hash') + 1).setNumberFormat('@').setValue(hash_(pw));
        sh.getRange(ada._r, h.indexOf('wajib_ganti') + 1).setNumberFormat('@').setValue('1');
        out.push({ nama: s.nama, kelas: s.kelas, username: ada.username, password: pw, status: 'reset' });
        return;
      }
      const un = String(s.nis || '').trim();
      if (!un) { out.push({ nama: s.nama, kelas: s.kelas, username: '', password: '', status: 'NISG kosong' }); return; }
      if (taken[un]) { out.push({ nama: s.nama, kelas: s.kelas, username: un, password: '', status: 'username sudah dipakai' }); return; }
      taken[un] = 1;
      const row = { id: Utilities.getUuid(), username: un, nama: s.nama, role: 'santri', hash: hash_(pw), peran: 'santri', siswa: s.id, wajib_ganti: '1' };
      add.push(h.map(function (k) { return row[k] === undefined ? '' : row[k]; }));
      out.push({ nama: s.nama, kelas: s.kelas, username: un, password: pw, status: 'baru' });
    });
    if (add.length) {
      const start = sh.getLastRow() + 1;
      if (start + add.length - 1 > sh.getMaxRows()) sh.insertRowsAfter(sh.getMaxRows(), add.length);
      sh.getRange(start, 1, add.length, h.length).setNumberFormat('@').setValues(add);
    }
    return out;
  } finally {
    lock.releaseLock();
  }
}

/** Data mutaba'ah milik santri yang sedang masuk (akun santri/orang tua), semester aktif. */
function mutabaahSaya_(U) {
  const s = U.role === 'santri' ? read_('Siswa').find(function (x) { return x.id === U.siswa; }) : null;
  if (!s) throw new Error('Akses ditolak.');
  const P = settings_();
  return {
    siswa: { nama: s.nama, kelas: s.kelas },
    items: read_('ItemMutabaah').sort(function (x, y) { return (+x.urut || 0) - (+y.urut || 0); }).map(clean_),
    rows: read_('Mutabaah').filter(function (r) { return r.siswa === s.nama && r.kelas === s.kelas && inRange_(P, r.tanggal); })
      .map(function (r) { return { tanggal: r.tanggal, selesai: r.selesai }; })
  };
}

/** Rapor milik santri yang sedang masuk; hanya jika wali kelas sudah menerbitkannya. d.tipe = 'akademik' | 'pondok' */
function raporSaya_(d, U) {
  const s = U.role === 'santri' ? read_('Siswa').find(function (x) { return x.id === U.siswa; }) : null;
  if (!s) throw new Error('Akses ditolak.');
  const k = read_('Kelas').find(function (x) { return x.nama === s.kelas; }) || {};
  if (k.rapor_terbit !== 'ya') throw new Error('Rapor belum diterbitkan oleh wali kelas.');
  const q = { kelas: s.kelas, siswa: s.nama };
  return d && d.tipe === 'pondok' ? raporPondokData_(q) : raporData_(q);
}
