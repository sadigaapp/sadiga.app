import React, { useState, useEffect } from 'react';
import { db } from '../lib/storage';
import { UserSession, PIKET_STATUS, PSH } from '../types';
import { exportTableF4Pdf, formatDate } from '../lib/pdf';
import { BedDouble, Plus, Download, Camera, Check, ArrowRight, X, AlertCircle } from 'lucide-react';

interface PiketMusyrifViewProps {
  user: UserSession;
}

export const PiketMusyrifView: React.FC<PiketMusyrifViewProps> = ({ user }) => {
  const [rows, setRows] = useState<any[]>([]);
  const [kegiatanList, setKegiatanList] = useState<any[]>([]);
  const [allSiswa, setAllSiswa] = useState<any[]>([]);
  const [kamarList, setKamarList] = useState<string[]>([]);

  // Filters
  const [fDari, setFDari] = useState('');
  const [fSampai, setFSampai] = useState('');
  const [fKamar, setFKamar] = useState('');
  const [fKegiatan, setFKegiatan] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [kegiatan, setKegiatan] = useState('');
  const [kamar, setKamar] = useState('');
  const [catatan, setCatatan] = useState('');
  const [foto, setFoto] = useState('');
  const [absenEntries, setAbsenEntries] = useState<Record<string, { status: string; ket: string }>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = () => {
    const kList = db.list('KegiatanPiket');
    const sList = db.list('Siswa');
    const kmList = [...new Set(sList.map(s => s.kamar).filter(Boolean))].sort();

    setKegiatanList(kList);
    setAllSiswa(sList);
    setKamarList(kmList);

    const piketRows = db.listPiket({ dari: fDari || undefined, sampai: fSampai || undefined });
    setRows(piketRows);

    if (kList.length > 0 && !kegiatan) setKegiatan(kList[0].nama);
    if (kmList.length > 0 && !kamar) setKamar(kmList[0]);
  };

  useEffect(() => {
    loadData();
  }, [fDari, fSampai]);

  const studentsInKamar = allSiswa.filter(s => s.kamar === kamar);

  // Initialize absen when kamar changes in modal
  useEffect(() => {
    if (!isModalOpen) return;
    const initial: Record<string, { status: string; ket: string }> = {};
    studentsInKamar.forEach(s => {
      initial[s.nama] = {
        status: 'Hadir Tepat Waktu',
        ket: ''
      };
    });
    setAbsenEntries(initial);
  }, [kamar, isModalOpen]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setTanggal(new Date().toISOString().slice(0, 10));
    setCatatan('');
    setFoto('');
    if (kegiatanList.length > 0) setKegiatan(kegiatanList[0].nama);
    if (kamarList.length > 0) setKamar(kamarList[0]);
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: any) => {
    setEditingId(rec.id);
    setTanggal(rec.tanggal);
    setKegiatan(rec.kegiatan);
    setKamar(rec.kamar);
    setCatatan(rec.catatan || '');
    setFoto(rec.foto || '');

    const existingAbsen = db.getPiket({ id: rec.id });
    const dict: Record<string, { status: string; ket: string }> = {};
    existingAbsen.forEach(a => {
      dict[a.siswa] = { status: a.status, ket: a.keterangan || '' };
    });
    setAbsenEntries(dict);
    setError('');
    setIsModalOpen(true);
  };

  const handleSavePiket = async (nextKamar: boolean = false) => {
    if (!tanggal || !kegiatan || !kamar) {
      setError('Lengkapi tanggal, kegiatan, dan kamar.');
      return;
    }
    if (studentsInKamar.length === 0) {
      setError('Tidak ada santri di kamar ini. Atur kamar terlebih dahulu di Data Induk.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const absenPayload = studentsInKamar.map(s => ({
        siswa: s.nama,
        status: absenEntries[s.nama]?.status || 'Hadir Tepat Waktu',
        ket: absenEntries[s.nama]?.ket || ''
      }));

      await db.savePiket({
        id: editingId || undefined,
        tanggal,
        kegiatan,
        kamar,
        musyrif: user.nama,
        catatan,
        foto,
        absen: absenPayload
      });

      if (nextKamar) {
        // Advance to next room in kamarList
        const currentIndex = kamarList.indexOf(kamar);
        if (currentIndex < kamarList.length - 1) {
          setKamar(kamarList[currentIndex + 1]);
          setCatatan('');
          setFoto('');
          setEditingId(null);
          loadData();
        } else {
          setIsModalOpen(false);
          loadData();
          alert('Semua kamar telah dicatat!');
        }
      } else {
        setIsModalOpen(false);
        loadData();
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan catatan piket.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus catatan piket ini beserta kehadiran kamar?')) return;
    try {
      await db.api('remove', 'Piket', { id });
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Gagal menghapus piket.');
    }
  };

  const filteredRows = rows.filter(r => {
    if (fKamar && r.kamar !== fKamar) return false;
    if (fKegiatan && r.kegiatan !== fKegiatan) return false;
    return true;
  });

  const handleExportPdf = () => {
    const headers = ['Tanggal', 'Kegiatan Asrama', 'Kamar', 'Musyrif', ...PSH];
    const pdfRows = filteredRows.map(r => {
      const counts = (r.rekap || '').split(',');
      return [
        formatDate(r.tanggal),
        r.kegiatan,
        r.kamar,
        r.musyrif,
        ...PSH.map((_, idx) => counts[idx] || '0')
      ];
    });

    exportTableF4Pdf('Laporan_Piket_Musyrif', headers, pdfRows, {
      periode: `${fDari || 'Awal'} s.d. ${fSampai || 'Akhir'}`,
      creator: user.nama
    });
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'Hadir Awal Waktu': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Hadir Tepat Waktu': return 'bg-teal-50 text-[#1B5558] border-teal-200';
      case 'Hadir Terlambat': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Sakit': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Izin': return 'bg-purple-100 text-purple-800 border-purple-300';
      default: return 'bg-rose-100 text-rose-800 border-rose-300';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Piket Musyrif Asrama</h2>
            <p className="text-xs text-slate-500">
              Pencatatan kedisiplinan dan kehadiran santri per kamar saat shalat berjamaah, halaqah quran, dan belajar malam.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1B5558] hover:bg-[#143F41] text-white text-xs font-semibold transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Catat Piket Kamar</span>
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

          <select
            value={fKamar}
            onChange={e => setFKamar(e.target.value)}
            className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white"
          >
            <option value="">Semua Kamar</option>
            {kamarList.map(km => (
              <option key={km} value={km}>{km}</option>
            ))}
          </select>

          <select
            value={fKegiatan}
            onChange={e => setFKegiatan(e.target.value)}
            className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white"
          >
            <option value="">Semua Kegiatan</option>
            {kegiatanList.map(k => (
              <option key={k.id} value={k.nama}>{k.nama}</option>
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
                <th className="py-2.5 px-3 w-24">Tanggal</th>
                <th className="py-2.5 px-3">Kegiatan</th>
                <th className="py-2.5 px-3">Kamar</th>
                <th className="py-2.5 px-3">Musyrif</th>
                <th className="py-2.5 px-3">Rekap Kehadiran</th>
                <th className="py-2.5 px-3 w-24 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Belum ada catatan piket pada rentang filter ini.
                  </td>
                </tr>
              ) : (
                filteredRows.map((r, idx) => {
                  const counts = (r.rekap || '').split(',');
                  const summary = PSH.map((s, i) => +counts[i] ? `${s}: ${counts[i]}` : null).filter(Boolean).join(' • ') || '-';
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono">{formatDate(r.tanggal)}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{r.kegiatan}</td>
                      <td className="py-2.5 px-3 font-medium">{r.kamar}</td>
                      <td className="py-2.5 px-3 text-slate-600">{r.musyrif}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                          {summary}
                        </span>
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

      {/* Modal Input Piket */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-h-[94vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <BedDouble className="w-4 h-4 text-[#1B5558]" />
                <h3 className="font-bold text-sm text-slate-900">
                  {editingId ? 'Ubah Catatan Piket Musyrif' : 'Catat Piket Musyrif Kamar'}
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

              {/* Grid 3 inputs */}
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
                  <label className="block font-bold text-slate-600 uppercase mb-1">Kegiatan Asrama</label>
                  <select
                    required
                    value={kegiatan}
                    onChange={e => setKegiatan(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {kegiatanList.map(k => (
                      <option key={k.id} value={k.nama}>{k.nama}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Kamar Asrama</label>
                  <select
                    required
                    value={kamar}
                    onChange={e => setKamar(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {kamarList.map(km => (
                      <option key={km} value={km}>{km}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Student Presence List */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Kehadiran Santri ({studentsInKamar.length} Santri di {kamar})
                  </span>
                  <span className="text-[11px] text-slate-400">Default: Hadir Tepat Waktu</span>
                </div>

                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-64 overflow-y-auto bg-white">
                  {studentsInKamar.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      Tidak ada santri di kamar ini. Silakan atur kamar di menu "Atur Kamar Asrama".
                    </div>
                  ) : (
                    studentsInKamar.map(s => {
                      const cur = absenEntries[s.nama] || { status: 'Hadir Tepat Waktu', ket: '' };
                      return (
                        <div key={s.id} className="p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 hover:bg-slate-50/60">
                          <div>
                            <div className="font-bold text-slate-900">{s.nama}</div>
                            <div className="text-[11px] text-slate-400">Kelas: {s.kelas}</div>
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <select
                              value={cur.status}
                              onChange={e => setAbsenEntries({
                                ...absenEntries,
                                [s.nama]: { ...cur, status: e.target.value }
                              })}
                              className={`px-2.5 py-1.5 border rounded-lg text-xs font-semibold ${getStatusColor(cur.status)}`}
                            >
                              {PIKET_STATUS.map(status => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>

                            <input
                              type="text"
                              placeholder="Keterangan opsional..."
                              value={cur.ket}
                              onChange={e => setAbsenEntries({
                                ...absenEntries,
                                [s.nama]: { ...cur, ket: e.target.value }
                              })}
                              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs flex-1 sm:w-40"
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Catatan Musyrif */}
              <div>
                <label className="block font-bold text-slate-600 uppercase mb-1">Catatan Musyrif</label>
                <textarea
                  rows={2}
                  value={catatan}
                  onChange={e => setCatatan(e.target.value)}
                  placeholder="Catatan kebersihan kamar, santri sakit, atau catatan khusus..."
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
                      onClick={() => handleSavePiket(true)}
                      disabled={saving || studentsInKamar.length === 0}
                      className="px-4 py-2 rounded-lg border border-[#1B5558] text-[#1B5558] hover:bg-emerald-50 font-semibold cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Simpan &amp; Kamar Berikutnya</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSavePiket(false)}
                    disabled={saving || studentsInKamar.length === 0}
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
