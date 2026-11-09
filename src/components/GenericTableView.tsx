import React, { useState, useEffect } from 'react';
import { db } from '../lib/storage';
import { UserSession, SURAH, KUAL, ASPEK, ST, PRD, KAT_PONDOK, KEL, MUTK } from '../types';
import { exportTableF4Pdf, formatDate } from '../lib/pdf';
import {
  Plus,
  Download,
  Filter,
  Search,
  Edit2,
  Trash2,
  FileSpreadsheet,
  X,
  AlertCircle
} from 'lucide-react';

interface GenericTableViewProps {
  mod: string;
  user: UserSession;
  onOpenBulkModal?: () => void;
  onOpenDraftPondok?: () => void;
}

export const GenericTableView: React.FC<GenericTableViewProps> = ({
  mod,
  user,
  onOpenBulkModal
}) => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Filters
  const [fKelas, setFKelas] = useState('');
  const [fSiswa, setFSiswa] = useState('');
  const [fMapel, setFMapel] = useState('');
  const [fDari, setFDari] = useState('');
  const [fSampai, setFSampai] = useState('');

  // Form modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Reference lists
  const [allSiswa, setAllSiswa] = useState<any[]>([]);
  const [allMapel, setAllMapel] = useState<any[]>([]);
  const [allTp, setAllTp] = useState<any[]>([]);
  const [allKelas, setAllKelas] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allItemsMutabaah, setAllItemsMutabaah] = useState<any[]>([]);

  const loadData = () => {
    setLoading(true);
    try {
      const data = db.list(mod);
      setRows(data);
      setAllSiswa(db.list('Siswa'));
      setAllMapel(db.list('Mapel'));
      setAllTp(db.list('TP'));
      setAllKelas(db.list('Kelas'));
      setAllUsers(db.list('Pengguna'));
      setAllItemsMutabaah(db.list('ItemMutabaah'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    setSearch('');
    setFKelas('');
    setFSiswa('');
    setFMapel('');
    setFDari('');
    setFSampai('');
  }, [mod]);

  const kelasList = [...new Set(allSiswa.map(s => s.kelas).filter(Boolean))].sort();

  // Column definitions per module
  const getColumns = (): { key: string; label: string; type?: string }[] => {
    switch (mod) {
      case 'Presensi':
        return [
          { key: 'tanggal', label: 'Tanggal', type: 'date' },
          { key: 'kelas', label: 'Kelas' },
          { key: 'mapel', label: 'Mata Pelajaran' },
          { key: 'siswa', label: 'Nama Santri' },
          { key: 'status', label: 'Status Kehadiran' },
          { key: 'catatan', label: 'Catatan' }
        ];
      case 'Penilaian':
        return [
          { key: 'tanggal', label: 'Tanggal', type: 'date' },
          { key: 'kelas', label: 'Kelas' },
          { key: 'mapel', label: 'Mata Pelajaran' },
          { key: 'siswa', label: 'Nama Santri' },
          { key: 'jenis', label: 'Jenis' },
          { key: 'nilai', label: 'Nilai' },
          { key: 'catatan', label: 'Catatan' }
        ];
      case 'Ujian':
        return [
          { key: 'tanggal', label: 'Tanggal', type: 'date' },
          { key: 'kelas', label: 'Kelas' },
          { key: 'mapel', label: 'Mata Pelajaran' },
          { key: 'jenis', label: 'Jenis Ujian' },
          { key: 'ruang', label: 'Ruang' },
          { key: 'pengawas', label: 'Pengawas' },
          { key: 'hadir', label: 'Jumlah Hadir' },
          { key: 'catatan', label: 'Catatan' }
        ];
      case 'Perilaku':
        return [
          { key: 'tanggal', label: 'Tanggal', type: 'date' },
          { key: 'kelas', label: 'Kelas' },
          { key: 'siswa', label: 'Nama Santri' },
          { key: 'jenis', label: 'Sifat (Pos/Neg)' },
          { key: 'aspek', label: 'Aspek Sikap' },
          { key: 'kejadian', label: 'Kejadian' },
          { key: 'poin', label: 'Poin' },
          { key: 'tindak_lanjut', label: 'Tindak Lanjut' }
        ];
      case 'NilaiPondok':
        return [
          { key: 'kelas', label: 'Kelas' },
          { key: 'siswa', label: 'Nama Santri' },
          { key: 'kategori', label: 'Kategori Pondok' },
          { key: 'subjek', label: 'Mata Pelajaran / Aspek' },
          { key: 'predikat', label: 'Predikat' },
          { key: 'deskripsi', label: 'Deskripsi Capaian' }
        ];
      case 'Wali':
        return [
          { key: 'kelas', label: 'Kelas' },
          { key: 'siswa', label: 'Nama Santri' },
          { key: 'sakit', label: 'Sakit (hr)' },
          { key: 'izin', label: 'Izin (hr)' },
          { key: 'alfa', label: 'Alfa (hr)' },
          { key: 'catatan', label: 'Catatan Wali Kelas' }
        ];
      case 'Kegiatan':
        return [
          { key: 'kelas', label: 'Kelas' },
          { key: 'siswa', label: 'Nama Santri' },
          { key: 'jenis', label: 'Jenis' },
          { key: 'kegiatan', label: 'Nama Kegiatan / Prestasi' },
          { key: 'nilai', label: 'Nilai' },
          { key: 'keterangan', label: 'Keterangan' }
        ];
      case 'TP':
        return [
          { key: 'mapel', label: 'Mata Pelajaran' },
          { key: 'tingkat', label: 'Tingkat Kelas' },
          { key: 'lingkup', label: 'Lingkup Materi' },
          { key: 'deskripsi', label: 'Deskripsi Tujuan Pembelajaran' }
        ];
      case 'Siswa':
        return [
          { key: 'nis', label: 'NISG' },
          { key: 'nisn', label: 'NISN' },
          { key: 'nama', label: 'Nama Lengkap' },
          { key: 'kelas', label: 'Kelas' },
          { key: 'kamar', label: 'Kamar Asrama' }
        ];
      case 'Kelas':
        return [
          { key: 'nama', label: 'Nama Kelas' },
          { key: 'wali', label: 'Nama Wali Kelas' },
          { key: 'nipy', label: 'NIPY Wali' },
          { key: 'target_ziyadah', label: 'Target Ziyadah (Ayat)' },
          { key: 'wali_user', label: 'Akun Login Wali' },
          { key: 'rapor_terbit', label: 'Status Rapor' }
        ];
      case 'Mapel':
        return [
          { key: 'nama', label: 'Nama Mata Pelajaran' },
          { key: 'kelompok', label: 'Kelompok' }
        ];
      case 'JenisNilai':
        return [
          { key: 'mapel', label: 'Mata Pelajaran' },
          { key: 'nama', label: 'Nama Jenis Penilaian' },
          { key: 'kategori', label: 'Kategori (Formatif/Sumatif)' }
        ];
      case 'ItemMutabaah':
        return [
          { key: 'nama', label: 'Nama Ibadah' },
          { key: 'kelompok', label: 'Kelompok' },
          { key: 'urut', label: 'Nomor Urutan' }
        ];
      case 'PetaMI':
        return [
          { key: 'sumber', label: 'Sumber Data' },
          { key: 'nama', label: 'Nama Ekskul / Mapel' },
          { key: 'kecerdasan', label: 'Kecerdasan Terkait' }
        ];
      case 'KegiatanPiket':
        return [
          { key: 'nama', label: 'Nama Kegiatan Asrama' }
        ];
      case 'Pengampu':
        return [
          { key: 'username', label: 'Akun Guru' },
          { key: 'kelas', label: 'Kelas' },
          { key: 'mapel', label: 'Mata Pelajaran' }
        ];
      case 'Pengguna':
        return [
          { key: 'username', label: 'Username' },
          { key: 'nama', label: 'Nama Lengkap' },
          { key: 'peran', label: 'Peran Hak Akses' },
          { key: 'password', label: 'Kata Sandi', type: 'password' }
        ];
      case 'Pengaturan':
        return [
          { key: 'kunci', label: 'Kunci Pengaturan' },
          { key: 'nilai', label: 'Nilai Konfigurasi' }
        ];
      default:
        return Object.keys(rows[0] || {}).filter(k => !k.startsWith('_') && k !== 'hash').map(k => ({ key: k, label: k }));
    }
  };

  const columns = getColumns();
  const displayColumns = columns.filter(c => c.key !== 'password'); // Jangan tampilkan kolom password di tabel utama

  const hasKelas = displayColumns.some(c => c.key === 'kelas');
  const hasSiswa = displayColumns.some(c => c.key === 'siswa');
  const hasMapel = displayColumns.some(c => c.key === 'mapel') && mod !== 'TP';
  const hasTanggal = displayColumns.some(c => c.key === 'tanggal');

  // Filtered rows
  const filteredRows = rows.filter(r => {
    if (mod === 'Pengguna' && r.peran === 'santri') return false;
    if (fKelas && r.kelas !== fKelas) return false;
    if (fSiswa && r.siswa !== fSiswa) return false;
    if (fMapel && r.mapel !== fMapel) return false;
    if (fDari && r.tanggal && r.tanggal < fDari) return false;
    if (fSampai && r.tanggal && r.tanggal > fSampai) return false;

    if (search) {
      const q = search.toLowerCase();
      return Object.values(r).some(v => String(v || '').toLowerCase().includes(q));
    }
    return true;
  }).sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));

  const handleOpenAdd = () => {
    setEditingRecord(null);
    const initial: Record<string, any> = {};
    if (hasTanggal) initial.tanggal = new Date().toISOString().slice(0, 10);
    if (hasKelas && fKelas) initial.kelas = fKelas;
    if (hasMapel && fMapel) initial.mapel = fMapel;
    if (hasSiswa && fSiswa) initial.siswa = fSiswa;
    setFormData(initial);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: any) => {
    setEditingRecord(rec);
    const copy = { ...rec };
    delete copy.password; // Kosongkan field password saat edit agar tidak sengaja tertimpa
    setFormData(copy);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus catatan ini?')) return;
    try {
      await db.api('remove', mod, { id });
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Gagal menghapus data.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (mod === 'Pengguna' && !editingRecord && !formData.password) {
      setFormError('Kata sandi wajib diisi untuk pengguna baru.');
      return;
    }

    setSaving(true);

    try {
      await db.api('save', mod, formData);
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err?.message || 'Gagal menyimpan data.');
    } finally {
      setSaving(false);
    }
  };

  const handleDraftPondok = async () => {
    if (!fKelas) {
      alert('Pilih kelas terlebih dahulu pada filter kelas.');
      return;
    }
    try {
      const count = db.draftPondok({ kelas: fKelas });
      alert(`Berhasil membuat/memperbarui ${count} catatan draf Rapor Pondok.`);
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Gagal membuat draf.');
    }
  };

  const handleExportPdf = () => {
    const headers = displayColumns.map(c => c.label);
    const pdfRows = filteredRows.map(r =>
      displayColumns.map(c => (c.type === 'date' ? formatDate(r[c.key]) : r[c.key] || '-'))
    );
    exportTableF4Pdf(mod, headers, pdfRows, {
      kelas: fKelas || undefined,
      mapel: fMapel || undefined,
      creator: user.nama
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">{mod}</h2>
            <p className="text-xs text-slate-500">Kelola dan lihat catatan administrasi modul {mod}.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {mod === 'NilaiPondok' && (
              <button
                type="button"
                onClick={handleDraftPondok}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1B5558] text-[#1B5558] hover:bg-emerald-50 text-xs font-semibold transition cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Buat Draf Dari Nilai</span>
              </button>
            )}

            {(mod === 'Presensi' || mod === 'Penilaian') && onOpenBulkModal && (
              <button
                type="button"
                onClick={onOpenBulkModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1B5558] text-[#1B5558] hover:bg-emerald-50 text-xs font-semibold transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Input Massal Kelas</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1B5558] hover:bg-[#143F41] text-white text-xs font-semibold transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Data</span>
            </button>

            <button
              type="button"
              onClick={handleExportPdf}
              disabled={filteredRows.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh PDF F4</span>
            </button>
          </div>
        </div>

        {/* Filter controls row */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-44">
            <input
              type="text"
              placeholder="Cari data..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-2.5 py-1.5 pl-8 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus
