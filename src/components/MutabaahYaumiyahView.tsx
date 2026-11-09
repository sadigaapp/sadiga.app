import React, { useState, useEffect } from 'react';
import { db } from '../lib/storage';
import { UserSession, ItemMutabaah } from '../types';
import { exportTableF4Pdf, formatDate } from '../lib/pdf';
import { CheckSquare, Plus, Download, ArrowRight, X, Check, Calendar } from 'lucide-react';

interface MutabaahYaumiyahViewProps {
  user: UserSession;
}

export const MutabaahYaumiyahView: React.FC<MutabaahYaumiyahViewProps> = ({ user }) => {
  const [rows, setRows] = useState<any[]>([]);
  const [items, setItems] = useState<ItemMutabaah[]>([]);
  const [allSiswa, setAllSiswa] = useState<any[]>([]);
  const [kelasList, setKelasList] = useState<string[]>([]);

  // Filters
  const [fKelas, setFKelas] = useState('');
  const [fSiswa, setFSiswa] = useState('');
  const [fDari, setFDari] = useState('');
  const [fSampai, setFSampai] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [kelas, setKelas] = useState('');
  const [siswa, setSiswa] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = () => {
    const sList = db.list('Siswa');
    const itList = db.list('ItemMutabaah').sort((a: any, b: any) => (+a.urut || 0) - (+b.urut || 0));
    const kList = [...new Set(sList.map(s => s.kelas).filter(Boolean))].sort();

    setAllSiswa(sList);
    setItems(itList);
    setKelasList(kList);
    if (kList.length > 0 && !kelas) setKelas(kList[0]);

    setRows(db.list('Mutabaah'));
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

  // Group items by category
  const groups: Record<string, ItemMutabaah[]> = {};
  items.forEach(it => {
    if (!groups[it.kelompok]) groups[it.kelompok] = [];
    groups[it.kelompok].push(it);
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setTanggal(new Date().toISOString().slice(0, 10));
    // Default select wajib and subuh
    const defaults = items.filter(i => i.kelompok === 'Ibadah Wajib').map(i => i.id);
    setSelectedItems(defaults);
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: any) => {
    setEditingId(rec.id);
    setTanggal(rec.tanggal);
    setKelas(rec.kelas);
    setSiswa(rec.siswa);
    setSelectedItems((rec.selesai || '').split(',').filter(Boolean));
    setError('');
    setIsModalOpen(true);
  };

  const toggleItem = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedItems(items.map(i => i.id));
  };

  const handleClearAll = () => {
    setSelectedItems([]);
  };

  const handleSave = async (nextStudent: boolean = false) => {
    if (!tanggal || !kelas || !siswa) {
      setError('Lengkapi tanggal, kelas, dan santri.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await db.api('save', 'Mutabaah', {
        id: editingId || undefined,
        tanggal,
        kelas,
        siswa,
        selesai: selectedItems.join(','),
        oleh: user.username
      });

      if (nextStudent) {
        const studentIndex = currentClassStudents.findIndex(s => s.nama === siswa);
        if (studentIndex < currentClassStudents.length - 1) {
          setSiswa(currentClassStudents[studentIndex + 1].nama);
          setSelectedItems(items.filter(i => i.kelompok === 'Ibadah Wajib').map(i => i.id));
          setEditingId(null);
          loadData();
        } else {
          setIsModalOpen(false);
          loadData();
          alert('Semua santri di kelas telah dicatat mutabaahnya!');
        }
      } else {
        setIsModalOpen(false);
        loadData();
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan mutabaah.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus catatan mutabaah ini?')) return;
    try {
      await db.api('remove', 'Mutabaah', { id });
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Gagal menghapus.');
    }
  };

  const filteredRows = rows.filter(r => {
    if (fKelas && r.kelas !== fKelas) return false;
    if (fSiswa && r.siswa !== fSiswa) return false;
    if (fDari && r.tanggal < fDari) return false;
    if (fSampai && r.tanggal > fSampai) return false;
    return true;
  }).sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));

  const handleExportPdf = () => {
    const headers = ['Tanggal', 'Kelas', 'Santri', 'Terlaksana', 'Persentase'];
    const pdfRows = filteredRows.map(r => {
      const count = (r.selesai || '').split(',').filter(Boolean).length;
      const pct = items.length ? Math.round((count / items.length) * 100) : 0;
      return [
        formatDate(r.tanggal),
        r.kelas,
        r.siswa,
        `${count} dari ${items.length} ibadah`,
        `${pct}%`
      ];
    });

    exportTableF4Pdf('Laporan_Mutabaah_Yaumiyah', headers, pdfRows, {
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
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Mutaba'ah Yaumiyah</h2>
            <p className="text-xs text-slate-500">
              Evaluasi keterlaksanaan ibadah wajib, shalat sunnah, dan halaqah Quran santri sehari-hari.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1B5558] hover:bg-[#143F41] text-white text-xs font-semibold transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Catat Mutaba'ah</span>
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

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <input
              type="date"
              value={fDari}
              onChange={e => setFDari(e.target.value)}
              className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white"
            />
            <span>s/d</span>
            <input
              type="date"
              value={fSampai}
              onChange={e => setFSampai(e.target.value)}
              className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white"
            />
          </div>
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
                <th className="py-2.5 px-3">Kelas</th>
                <th className="py-2.5 px-3">Nama Santri</th>
                <th className="py-2.5 px-3">Keterlaksanaan Ibadah</th>
                <th className="py-2.5 px-3 w-40">Progres</th>
                <th className="py-2.5 px-3 w-20 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Belum ada catatan mutaba'ah yaumiyah.
                  </td>
                </tr>
              ) : (
                filteredRows.map((r, idx) => {
                  const count = (r.selesai || '').split(',').filter(Boolean).length;
                  const pct = items.length ? Math.round((count / items.length) * 100) : 0;
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono">{formatDate(r.tanggal)}</td>
                      <td className="py-2.5 px-3">{r.kelas}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{r.siswa}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-800">
                          {count} dari {items.length} ibadah
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#1B5558] rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-slate-700 w-8">{pct}%</span>
                        </div>
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Input Mutabaah */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-h-[94vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-[#1B5558]" />
                <h3 className="font-bold text-sm text-slate-900">
                  {editingId ? 'Ubah Catatan Mutaba\'ah' : 'Catat Mutaba\'ah Yaumiyah'}
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                  <label className="block font-bold text-slate-600 uppercase mb-1">Santri</label>
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

              {/* Checklist items by category */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Daftar Ibadah Terlaksana ({selectedItems.length} dari {items.length} terpilih)
                  </span>
                  <div className="space-x-2">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-[#1B5558] hover:underline font-semibold cursor-pointer"
                    >
                      Pilih Semua
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="text-slate-500 hover:underline font-semibold cursor-pointer"
                    >
                      Kosongkan
                    </button>
                  </div>
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                  {Object.entries(groups).map(([grpName, grpItems]) => (
                    <div key={grpName} className="space-y-1.5">
                      <div className="text-[11px] font-bold text-[#1B5558] uppercase tracking-wide border-b border-slate-200 pb-1">
                        {grpName}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {grpItems.map(it => {
                          const checked = selectedItems.includes(it.id);
                          return (
                            <label
                              key={it.id}
                              className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition select-none ${
                                checked
                                  ? 'bg-emerald-50 border-emerald-300 text-[#1B5558] font-bold'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleItem(it.id)}
                                className="w-4 h-4 text-[#1B5558] rounded border-slate-300 focus:ring-0"
                              />
                              <span>{it.nama}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
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
