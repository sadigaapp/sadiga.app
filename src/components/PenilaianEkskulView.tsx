import React, { useState, useEffect } from 'react';
import { db } from '../lib/storage';
import { UserSession } from '../types';
import { exportTableF4Pdf } from '../lib/pdf';
import {
  Award,
  Plus,
  HelpCircle,
  Download,
  CheckCircle2,
  Sparkles,
  Info,
  Edit2,
  Trash2,
  X
} from 'lucide-react';

interface PenilaianEkskulViewProps {
  user: UserSession;
}

const DEFAULT_EKSKUL = [
  'Panahan & Futsal',
  'Pramuka Penggalang',
  'Khitobah & Muhadharah (Pidato)',
  'Kaligrafi & Seni Rupa',
  'Robotik & Coding',
  'Tilawatil Qur\'an & Seni Suara',
  'Silat Tapak Suci',
  'Jurnalistik & Majalah Dinding'
];

export const PenilaianEkskulView: React.FC<PenilaianEkskulViewProps> = ({ user }) => {
  const [rows, setRows] = useState<any[]>([]);
  const [allSiswa, setAllSiswa] = useState<any[]>([]);
  const [kelasList, setKelasList] = useState<string[]>([]);
  const [petaMiList, setPetaMiList] = useState<any[]>([]);

  // Filters
  const [fKelas, setFKelas] = useState('');
  const [fEkskul, setFEkskul] = useState('');

  // Modal Input
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [kelas, setKelas] = useState('');
  const [siswa, setSiswa] = useState('');
  const [namaEkskul, setNamaEkskul] = useState(DEFAULT_EKSKUL[0]);
  const [predikat, setPredikat] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [keterangan, setKeterangan] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = () => {
    const sList = db.list('Siswa');
    const kegList = db.list('Kegiatan').filter((k: any) => k.jenis === 'Ekstrakurikuler');
    const pMi = db.list('PetaMI');
    const kList = [...new Set(sList.map(s => s.kelas).filter(Boolean))].sort();

    setAllSiswa(sList);
    setRows(kegList);
    setPetaMiList(pMi);
    setKelasList(kList);
    if (kList.length > 0 && !kelas) setKelas(kList[0]);
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentClassStudents = allSiswa.filter(s => s.kelas === kelas);

  useEffect(() => {
    if (currentClassStudents.length > 0 && !siswa) {
      setSiswa(currentClassStudents[0].nama);
    }
  }, [kelas, currentClassStudents]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setPredikat('A');
    setKeterangan('Aktif dan sangat disiplin dalam mengikuti latihan, menunjukkan penguasaan teknik yang sangat baik.');
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: any) => {
    setEditingId(rec.id);
    setKelas(rec.kelas);
    setSiswa(rec.siswa);
    setNamaEkskul(rec.kegiatan);
    setPredikat(rec.nilai || 'A');
    setKeterangan(rec.keterangan || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kelas || !siswa || !namaEkskul || !predikat) {
      setError('Lengkapi kelas, santri, ekskul, dan predikat.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await db.api('save', 'Kegiatan', {
        id: editingId || undefined,
        kelas,
        siswa,
        jenis: 'Ekstrakurikuler',
        kegiatan: namaEkskul,
        nilai: predikat,
        keterangan,
        oleh: user.username
      });
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan penilaian ekskul.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus penilaian ekstrakurikuler ini?')) return;
    try {
      await db.api('remove', 'Kegiatan', { id });
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Gagal menghapus.');
    }
  };

  const filteredRows = rows.filter(r => {
    if (fKelas && r.kelas !== fKelas) return false;
    if (fEkskul && r.kegiatan !== fEkskul) return false;
    return true;
  });

  const handleExportPdf = () => {
    const headers = ['Kelas', 'Nama Santri', 'Kegiatan Ekstrakurikuler', 'Predikat', 'Deskripsi Perkembangan'];
    const pdfRows = filteredRows.map(r => [
      r.kelas,
      r.siswa,
      r.kegiatan,
      r.nilai || '-',
      r.keterangan || '-'
    ]);

    exportTableF4Pdf('Laporan_Penilaian_Ekstrakurikuler', headers, pdfRows, {
      kelas: fKelas || undefined,
      creator: user.nama
    });
  };

  const getPredikatText = (p: string) => {
    switch (p) {
      case 'A': return 'Sangat Baik (A)';
      case 'B': return 'Baik (B)';
      case 'C': return 'Cukup (C)';
      default: return 'Kurang (D)';
    }
  };

  return (
    <div className="space-y-4">
      {/* Educational Explanation Box */}
      <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs text-slate-700 leading-relaxed space-y-2">
        <div className="flex items-center gap-2 font-bold text-[#1B5558] text-sm">
          <Info className="w-4 h-4" />
          <span>Bagaimana Nilai Ekstrakurikuler Dihitung &amp; Dimasukkan ke Rapor?</span>
        </div>
        <p>
          1. <b>Sistem Predikat Standar:</b> Kegiatan ekstrakurikuler dinilai berdasarkan keaktifan, kedisiplinan, dan keterampilan dengan predikat <b>A (Sangat Baik / 4.0)</b>, <b>B (Baik / 3.0)</b>, <b>C (Cukup / 2.0)</b>, dan <b>D (Kurang / 1.0)</b> disertai narasi capaian.
        </p>
        <p>
          2. <b>Otomatis Masuk ke Rapor Akademik:</b> Nilai dan deskripsi ini otomatis tampil pada tabel resmi <b>"D. Ekstrakurikuler"</b> pada Rapor Akademik F4 siswa.
        </p>
        <p>
          3. <b>Kontribusi ke Multiple Intelligences (Rapor Pondok):</b> Melalui modul <i>Peta Kecerdasan (PetaMI)</i>, nilai predikat ekskul dikonversikan menjadi bobot 30% ke dalam kecerdasan terkait (misal: <i>Panahan &amp; Futsal &rarr; Kinestetik</i>, <i>Khitobah &rarr; Linguistik</i>, <i>Pramuka &rarr; Interpersonal</i>).
        </p>
      </div>

      {/* Top Header & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Penilaian Ekstrakurikuler</h2>
            <p className="text-xs text-slate-500">
              Evaluasi minat, bakat, keaktifan, dan predikat perkembangan ekstrakurikuler santri semester ini.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1B5558] hover:bg-[#143F41] text-white text-xs font-semibold transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Input Nilai Ekskul</span>
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

        {/* Filter controls */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2.5">
          <select
            value={fKelas}
            onChange={e => setFKelas(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
          >
            <option value="">Semua Kelas</option>
            {kelasList.map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>

          <select
            value={fEkskul}
            onChange={e => setFEkskul(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
          >
            <option value="">Semua Ekstrakurikuler</option>
            {DEFAULT_EKSKUL.map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Data */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#E9F2F2] text-[#1B5558] border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3 w-10 text-center">No</th>
                <th className="py-2.5 px-3 w-28">Kelas</th>
                <th className="py-2.5 px-3 w-48">Nama Santri</th>
                <th className="py-2.5 px-3">Kegiatan Ekstrakurikuler</th>
                <th className="py-2.5 px-3 w-28 text-center">Predikat</th>
                <th className="py-2.5 px-3">Deskripsi Capaian</th>
                <th className="py-2.5 px-3 w-24 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Belum ada catatan penilaian ekstrakurikuler.
                  </td>
                </tr>
              ) : (
                filteredRows.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-2.5 px-3">{r.kelas}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{r.siswa}</td>
                    <td className="py-2.5 px-3 font-medium">{r.kegiatan}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-xs ${
                        r.nilai === 'A' ? 'bg-emerald-100 text-emerald-800' :
                        r.nilai === 'B' ? 'bg-teal-100 text-[#1B5558]' :
                        r.nilai === 'C' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {r.nilai || '-'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 leading-relaxed max-w-md">
                      {r.keterangan || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(r)}
                        className="px-2 py-1 text-xs font-semibold text-[#1B5558] hover:bg-emerald-50 rounded transition cursor-pointer mr-1"
                      >
                        Ubah
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(r.id)}
                        className="px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Input Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#1B5558]" />
                <h3 className="font-bold text-sm text-slate-900">
                  {editingId ? 'Ubah Penilaian Ekstrakurikuler' : 'Input Penilaian Ekstrakurikuler'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Kelas</label>
                  <select
                    value={kelas}
                    onChange={e => {
                      setKelas(e.target.value);
                      setSiswa('');
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {kelasList.map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Nama Santri</label>
                  <select
                    value={siswa}
                    onChange={e => setSiswa(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {currentClassStudents.map(s => (
                      <option key={s.id} value={s.nama}>{s.nama}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 uppercase mb-1">Kegiatan Ekstrakurikuler</label>
                <select
                  value={namaEkskul}
                  onChange={e => setNamaEkskul(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
                >
                  {DEFAULT_EKSKUL.map(e => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 uppercase mb-1.5">Predikat Penilaian</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['A', 'B', 'C', 'D'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPredikat(p)}
                      className={`py-2 px-2 rounded-lg border font-bold text-xs text-center transition cursor-pointer ${
                        predikat === p
                          ? 'bg-[#1B5558] border-[#1B5558] text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {getPredikatText(p)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-600 uppercase">
                    Keterangan &amp; Deskripsi Capaian
                  </label>
                  <span className="text-[10px] text-slate-400">Tercetak di Rapor Akademik</span>
                </div>
                <textarea
                  rows={3}
                  required
                  value={keterangan}
                  onChange={e => setKeterangan(e.target.value)}
                  placeholder="Deskripsi keaktifan, kemajuan teknik, kepemimpinan..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>

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
                  {saving ? 'Menyimpan...' : 'Simpan Penilaian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
