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
  const displayColumns = columns.filter(c => c.key !== 'password');

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
    delete copy.password;
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
              className="w-full px-2.5 py-1.5 pl-8 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5558]"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          </div>

          {hasKelas && (
            <select
              value={fKelas}
              onChange={e => {
                setFKelas(e.target.value);
                setFSiswa('');
              }}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5558]"
            >
              <option value="">Semua Kelas</option>
              {kelasList.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          )}

          {hasSiswa && (
            <select
              value={fSiswa}
              onChange={e => setFSiswa(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5558]"
            >
              <option value="">Semua Santri</option>
              {allSiswa.filter(s => !fKelas || s.kelas === fKelas).map(s => (
                <option key={s.id} value={s.nama}>{s.nama}</option>
              ))}
            </select>
          )}

          {hasMapel && (
            <select
              value={fMapel}
              onChange={e => setFMapel(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5558]"
            >
              <option value="">Semua Mapel</option>
              {allMapel.map(m => (
                <option key={m.id} value={m.nama}>{m.nama}</option>
              ))}
            </select>
          )}

          {hasTanggal && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <input
                type="date"
                value={fDari}
                onChange={e => setFDari(e.target.value)}
                className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white"
                title="Dari tanggal"
              />
              <span>s/d</span>
              <input
                type="date"
                value={fSampai}
                onChange={e => setFSampai(e.target.value)}
                className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white"
                title="Sampai tanggal"
              />
            </div>
          )}
        </div>
      </div>

      {/* Table Data */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#E9F2F2] text-[#1B5558] border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3 w-10 text-center">No</th>
                {displayColumns.map(col => (
                  <th key={col.key} className="py-2.5 px-3">{col.label}</th>
                ))}
                <th className="py-2.5 px-3 w-24 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={displayColumns.length + 2} className="py-12 text-center text-slate-400">
                    Belum ada data yang sesuai filter atau pencarian.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                    {displayColumns.map(col => {
                      const val = row[col.key];
                      return (
                        <td key={col.key} className="py-2.5 px-3 max-w-xs truncate">
                          {col.type === 'date' ? (
                            <span className="font-mono">{formatDate(val)}</span>
                          ) : col.key === 'status' ? (
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                              val === 'Hadir' ? 'bg-emerald-100 text-emerald-800' :
                              val === 'Izin' ? 'bg-blue-100 text-blue-800' :
                              val === 'Sakit' ? 'bg-amber-100 text-amber-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              {val}
                            </span>
                          ) : col.key === 'nilai' || col.key === 'poin' ? (
                            <span className="font-bold text-slate-900">{val || '-'}</span>
                          ) : (
                            val || '-'
                          )}
                        </td>
                      );
                    })}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(row)}
                        className="p-1 text-slate-500 hover:text-[#1B5558] hover:bg-emerald-50 rounded transition cursor-pointer mr-1"
                        title="Ubah"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(row.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 border-t border-slate-100 text-slate-400 text-[11px] flex items-center justify-between">
          <span>Menampilkan {filteredRows.length} catatan</span>
          <span>SADIGA • Folio F4 Print Engine</span>
        </div>
      </div>

      {/* Add / Edit Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900">
                {editingRecord ? `Ubah Catatan ${mod}` : `Tambah Catatan ${mod}`}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-3.5 flex-1 text-xs">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium">
                  {formError}
                </div>
              )}

              {columns.map(col => {
                const k = col.key;
                const val = formData[k] ?? '';

                if (k === 'password') {
                  return (
                    <div key={k}>
                      <label className="block font-bold text-slate-600 uppercase mb-1">
                        {col.label} {editingRecord && <span className="text-[10px] text-slate-400 font-normal">(Kosongkan jika tidak diubah)</span>}
                      </label>
                      <input
                        type="password"
                        required={!editingRecord}
                        value={val}
                        onChange={e => setFormData({ ...formData, [k]: e.target.value })}
                        placeholder={editingRecord ? 'Kata sandi baru...' : 'Masukkan kata sandi...'}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  );
                }

                if (k === 'kelas') {
                  return (
                    <div key={k}>
                      <label className="block font-bold text-slate-600 uppercase mb-1">{col.label}</label>
                      <select
                        required
                        value={val}
                        onChange={e => setFormData({ ...formData, [k]: e.target.value, siswa: '' })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="">Pilih Kelas</option>
                        {kelasList.map(kls => (
                          <option key={kls} value={kls}>{kls}</option>
                        ))}
                      </select>
                    </div>
                  );
                }

                if (k === 'siswa') {
                  const filteredSantri = allSiswa.filter(s => !formData.kelas || s.kelas === formData.kelas);
                  return (
                    <div key={k}>
                      <label className="block font-bold text-slate-600 uppercase mb-1">{col.label}</label>
                      <select
                        required
                        value={val}
                        onChange={e => setFormData({ ...formData, [k]: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="">Pilih Santri</option>
                        {filteredSantri.map(s => (
                          <option key={s.id} value={s.nama}>{s.nama} ({s.kelas})</option>
                        ))}
                      </select>
                    </div>
                  );
                }

                if (k === 'mapel') {
                  return (
                    <div key={k}>
                      <label className="block font-bold text-slate-600 uppercase mb-1">{col.label}</label>
                      <select
                        required
                        value={val}
                        onChange={e => setFormData({ ...formData, [k]: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="">Pilih Mapel</option>
                        {allMapel.map(m => (
                          <option key={m.id} value={m.nama}>{m.nama}</option>
                        ))}
                      </select>
                    </div>
                  );
                }

                if (k === 'status' && mod === 'Presensi') {
                  return (
                    <div key={k}>
                      <label className="block font-bold text-slate-600 uppercase mb-1">{col.label}</label>
                      <select
                        required
                        value={val}
                        onChange={e => setFormData({ ...formData, [k]: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                      >
                        {ST.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  );
                }

                if (k === 'predikat' && mod === 'NilaiPondok') {
                  return (
                    <div key={k}>
                      <label className="block font-bold text-slate-600 uppercase mb-1">{col.label}</label>
                      <select
                        required
                        value={val}
                        onChange={e => setFormData({ ...formData, [k]: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                      >
                        {PRD.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  );
                }

                if (k === 'kategori' && mod === 'NilaiPondok') {
                  return (
                    <div key={k}>
                      <label className="block font-bold text-slate-600 uppercase mb-1">{col.label}</label>
                      <select
                        required
                        value={val}
                        onChange={e => setFormData({ ...formData, [k]: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                      >
                        {KAT_PONDOK.map(kp => (
                          <option key={kp} value={kp}>{kp}</option>
                        ))}
                      </select>
                    </div>
                  );
                }

                if (k === 'kelompok' && mod === 'Mapel') {
                  return (
                    <div key={k}>
                      <label className="block font-bold text-slate-600 uppercase mb-1">{col.label}</label>
                      <select
                        required
                        value={val}
                        onChange={e => setFormData({ ...formData, [k]: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                      >
                        {KEL.map(klp => (
                          <option key={klp} value={klp}>{klp}</option>
                        ))}
                      </select>
                    </div>
                  );
                }

                if (k === 'kelompok' && mod === 'ItemMutabaah') {
                  return (
                    <div key={k}>
                      <label className="block font-bold text-slate-600 uppercase mb-1">{col.label}</label>
                      <select
                        required
                        value={val}
                        onChange={e => setFormData({ ...formData, [k]: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                      >
                        {MUTK.map(mk => (
                          <option key={mk} value={mk}>{mk}</option>
                        ))}
                      </select>
                    </div>
                  );
                }

                if (k === 'aspek' && mod === 'Perilaku') {
                  return (
                    <div key={k}>
                      <label className="block font-bold text-slate-600 uppercase mb-1">{col.label}</label>
                      <select
                        required
                        value={val}
                        onChange={e => setFormData({ ...formData, [k]: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                      >
                        {ASPEK.map(asp => (
                          <option key={asp} value={asp}>{asp}</option>
                        ))}
                      </select>
                    </div>
                  );
                }

                if (k === 'jenis' && mod === 'Perilaku') {
                  return (
                    <div key={k}>
                      <label className="block font-bold text-slate-600 uppercase mb-1">{col.label}</label>
                      <select
                        required
                        value={val}
                        onChange={e => setFormData({ ...formData, [k]: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="Positif">Positif (+)</option>
                        <option value="Negatif">Negatif (-)</option>
                      </select>
                    </div>
                  );
                }

                if (col.type === 'date') {
                  return (
                    <div key={k}>
                      <label className="block font-bold text-slate-600 uppercase mb-1">{col.label}</label>
                      <input
                        type="date"
                        required
                        value={val}
                        onChange={e => setFormData({ ...formData, [k]: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  );
                }

                if (k === 'catatan' || k === 'deskripsi' || k === 'kejadian' || k === 'tindak_lanjut' || k === 'keterangan') {
                  return (
                    <div key={k}>
                      <label className="block font-bold text-slate-600 uppercase mb-1">{col.label}</label>
                      <textarea
                        rows={3}
                        value={val}
                        onChange={e => setFormData({ ...formData, [k]: e.target.value })}
                        placeholder={`Isi ${col.label.toLowerCase()}...`}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  );
                }

                return (
                  <div key={k}>
                    <label className="block font-bold text-slate-600 uppercase mb-1">{col.label}</label>
                    <input
                      type="text"
                      value={val}
                      onChange={e => setFormData({ ...formData, [k]: e.target.value })}
                      placeholder={`Masukkan ${col.label.toLowerCase()}...`}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                );
              })}

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-[#1B5558] hover:bg-[#143F41] text-white font-semibold cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
