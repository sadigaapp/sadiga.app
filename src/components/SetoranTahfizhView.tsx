import React, { useState, useEffect } from 'react';
import { db } from '../lib/storage';
import { UserSession, SURAH, SURAH_AYAT, KUAL } from '../types';
import { exportTableF4Pdf, formatDate } from '../lib/pdf';
import { BookOpen, Plus, Download, ArrowRight, X, Sparkles, CheckCircle2 } from 'lucide-react';

interface SetoranTahfizhViewProps {
  user: UserSession;
}

export const SetoranTahfizhView: React.FC<SetoranTahfizhViewProps> = ({ user }) => {
  const [rows, setRows] = useState<any[]>([]);
  const [allSiswa, setAllSiswa] = useState<any[]>([]);
  const [kelasList, setKelasList] = useState<string[]>([]);

  // Filters
  const [fKelas, setFKelas] = useState('');
  const [fSiswa, setFSiswa] = useState('');
  const [fJenis, setFJenis] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [kelas, setKelas] = useState('');
  const [siswa, setSiswa] = useState('');
  const [jenis, setJenis] = useState<'Ziyadah' | 'Murojaah' | 'Tahsin'>('Ziyadah');
  const [surat, setSurat] = useState('An-Naba');
  const [dari, setDari] = useState('1');
  const [sampai, setSampai] = useState('20');
  const [materi, setMateri] = useState('');
  const [kualitas, setKualitas] = useState<string>('Mutqin');
  const [catatan, setCatatan] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = () => {
    const sList = db.list('Siswa');
    setAllSiswa(sList);
    const kList = [...new Set(sList.map(s => s.kelas).filter(Boolean))].sort();
    setKelasList(kList);
    if (kList.length > 0 && !kelas) setKelas(kList[0]);

    const setoranData = db.list('Setoran');
    setRows(setoranData);
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

  const maxAyat = surat ? SURAH_AYAT[surat] || 286 : 286;

  const handleOpenAdd = () => {
    setEditingId(null);
    setTanggal(new Date().toISOString().slice(0, 10));
    setJenis('Ziyadah');
    setSurat('An-Naba');
    setDari('1');
    setSampai('20');
    setMateri('');
    setKualitas('Mutqin');
    setCatatan('');
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: any) => {
    setEditingId(rec.id);
    setTanggal(rec.tanggal);
    setKelas(rec.kelas);
    setSiswa(rec.siswa);
    setJenis(rec.jenis);
    setSurat(rec.surat || '');
    setDari(rec.dari || '');
    setSampai(rec.sampai || '');
    setMateri(rec.materi || '');
    setKualitas(rec.kualitas || 'Lancar');
    setCatatan(rec.catatan || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (nextStudent: boolean = false) => {
    if (!tanggal || !kelas || !siswa || !jenis) {
      setError('Lengkapi tanggal, kelas, santri, dan jenis setoran.');
      return;
    }

    if (jenis !== 'Tahsin' && surat) {
      const a = parseInt(dari, 10);
      const b = parseInt(sampai, 10);
      if (isNaN(a) || isNaN(b) || a < 1 || b < a || b > maxAyat) {
        setError(`Rentang ayat tidak valid untuk surat ${surat} (maksimal ${maxAyat} ayat).`);
        return;
      }
    }

    setSaving(true);
    setError('');

    try {
      await db.api('save', 'Setoran', {
        id: editingId || undefined,
        tanggal,
        kelas,
        siswa,
        jenis,
        surat: jenis === 'Tahsin' ? '' : surat,
        dari: jenis === 'Tahsin' ? '' : dari,
        sampai: jenis === 'Tahsin' ? '' : sampai,
        materi: jenis === 'Tahsin' ? materi : '',
        kualitas,
        catatan,
        oleh: user.username
      });

      if (nextStudent) {
        const studentIndex = currentClassStudents.findIndex(s => s.nama === siswa);
        if (studentIndex < currentClassStudents.length - 1) {
          setSiswa(currentClassStudents[studentIndex + 1].nama);
          setCatatan('');
          setEditingId(null);
          loadData();
        } else {
          setIsModalOpen(false);
          loadData();
          alert('Semua santri di kelas telah tercatat!');
        }
      } else {
        setIsModalOpen(false);
        loadData();
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan setoran.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus catatan setoran ini?')) return;
    try {
      await db.api('remove', 'Setoran', { id });
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Gagal menghapus.');
    }
  };

  const filteredRows = rows.filter(r => {
    if (fKelas && r.kelas !== fKelas) return false;
    if (fSiswa && r.siswa !== fSiswa) return false;
    if (fJenis && r.jenis !== fJenis) return false;
    return true;
  }).sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));

  const handleExportPdf = () => {
    const headers = ['Tanggal', 'Kelas', 'Santri', 'Jenis', 'Surat / Materi', 'Rentang Ayat', 'Kualitas', 'Catatan'];
    const pdfRows = filteredRows.map(r => [
      formatDate(r.tanggal),
      r.kelas,
      r.siswa,
      r.jenis,
      r.surat || r.materi || '-',
      r.dari && r.sampai ? `${r.dari} - ${r.sampai}` : '-',
      r.kualitas,
      r.catatan || '-'
    ]);

    exportTableF4Pdf('Laporan_Tahsin_Tahfizh', headers, pdfRows, {
      kelas: fKelas || undefined,
      creator: user.nama
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Tahsin &amp; Tahfizh Al-Qur'an</h2>
            <p className="text-xs text-slate-500">
              Pencatatan setoran hafalan baru (Ziyadah), pengulangan (Murojaah), dan bimbingan tajwid/makharij (Tahsin).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1B5558] hover:bg-[#143F41] text-white text-xs font-semibold transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Catat Setoran</span>
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
            onChange={e => {
              setFKelas(e.target.value);
              setFSiswa('');
            }}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
          >
            <option value="">Semua Kelas</option>
            {kelasList.map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>

          <select
            value={fSiswa}
            onChange={e => setFSiswa(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
          >
            <option value="">Semua Santri</option>
            {allSiswa.filter(s => !fKelas || s.kelas === fKelas).map(s => (
              <option key={s.id} value={s.nama}>{s.nama}</option>
            ))}
          </select>

          <select
            value={fJenis}
            onChange={e => setFJenis(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
          >
            <option value="">Semua Jenis Setoran</option>
            <option value="Ziyadah">Ziyadah (Hafalan Baru)</option>
            <option value="Murojaah">Murojaah (Mengulang)</option>
            <option value="Tahsin">Tahsin (Tajwid / Tilawah)</option>
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
                <th className="py-2.5 px-3 w-24">Tanggal</th>
                <th className="py-2.5 px-3">Santri</th>
                <th className="py-2.5 px-3">Jenis</th>
                <th className="py-2.5 px-3">Surat / Materi</th>
                <th className="py-2.5 px-3">Rentang Ayat</th>
                <th className="py-2.5 px-3">Kualitas</th>
                <th className="py-2.5 px-3">Catatan Pembina</th>
                <th className="py-2.5 px-3 w-20 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Belum ada catatan setoran Al-Qur'an.
                  </td>
                </tr>
              ) : (
                filteredRows.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono">{formatDate(r.tanggal)}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{r.siswa}</td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.jenis === 'Ziyadah' ? 'bg-emerald-100 text-emerald-800' :
                        r.jenis === 'Murojaah' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {r.jenis}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      {r.surat || r.materi || '-'}
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      {r.dari && r.sampai ? `Ayat ${r.dari} - ${r.sampai}` : '-'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.kualitas === 'Mutqin' ? 'bg-emerald-100 text-emerald-800' :
                        r.kualitas === 'Lancar' ? 'bg-teal-50 text-[#1B5558]' :
                        r.kualitas === 'Cukup' ? 'bg-amber-50 text-amber-800' :
                        'bg-rose-50 text-rose-800'
                      }`}>
                        {r.kualitas}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate">{r.catatan || '-'}</td>
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

      {/* Modal Catat Setoran */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-h-[94vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#1B5558]" />
                <h3 className="font-bold text-sm text-slate-900">
                  {editingId ? 'Ubah Catatan Setoran' : 'Catat Setoran Al-Qur\'an'}
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

            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={tanggal}
                    onChange={e => setTanggal(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Jenis Setoran</label>
                  <select
                    value={jenis}
                    onChange={e => setJenis(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-semibold"
                  >
                    <option value="Ziyadah">Ziyadah (Hafalan Baru)</option>
                    <option value="Murojaah">Murojaah (Mengulang)</option>
                    <option value="Tahsin">Tahsin (Tajwid / Tilawah)</option>
                  </select>
                </div>
              </div>

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

              {jenis === 'Tahsin' ? (
                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Materi Tahsin (Jilid / Hal)</label>
                  <input
                    type="text"
                    value={materi}
                    onChange={e => setMateri(e.target.value)}
                    placeholder="Contoh: Jilid 4 hal 15, Mad Thabi'i"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-600 uppercase mb-1">Surat Al-Qur'an (1-114)</label>
                    <select
                      value={surat}
                      onChange={e => {
                        setSurat(e.target.value);
                        setDari('1');
                        setSampai(String(Math.min(20, SURAH_AYAT[e.target.value] || 20)));
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
                    >
                      {SURAH.map(([sName, ayCount]) => (
                        <option key={sName} value={sName}>
                          {sName} ({ayCount} ayat)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-600 uppercase mb-1">Dari Ayat</label>
                      <input
                        type="number"
                        min="1"
                        max={maxAyat}
                        value={dari}
                        onChange={e => setDari(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 uppercase mb-1">Sampai Ayat (Maks: {maxAyat})</label>
                      <input
                        type="number"
                        min="1"
                        max={maxAyat}
                        value={sampai}
                        onChange={e => setSampai(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Kualitas Setoran */}
              <div>
                <label className="block font-bold text-slate-600 uppercase mb-1.5">Kualitas Bacaan / Setoran</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {KUAL.map((k: string) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setKualitas(k)}
                      className={`py-2 px-2.5 rounded-lg border text-center font-bold text-xs transition cursor-pointer ${
                        kualitas === k
                          ? 'border-[#1B5558] bg-[#1B5558] text-white shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>

              {/* Catatan Pembina */}
              <div>
                <label className="block font-bold text-slate-600 uppercase mb-1">Catatan Pembina / Tajwid</label>
                <textarea
                  rows={2}
                  value={catatan}
                  onChange={e => setCatatan(e.target.value)}
                  placeholder="Catatan makhraj, dengung, kelancaran..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Batal
                </button>

                <div className="flex items-center gap-2">
                  {!editingId && (
                    <button
                      type="button"
                      onClick={() => handleSave(true)}
                      disabled={saving}
                      className="px-4 py-2 rounded-lg border border-[#1B5558] text-[#1B5558] hover:bg-emerald-50 font-semibold cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Simpan &amp; Santri Berikutnya</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSave(false)}
                    disabled={saving}
                    className="px-5 py-2 rounded-lg bg-[#1B5558] hover:bg-[#143F41] text-white font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {saving ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
