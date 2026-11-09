import React, { useState, useEffect } from 'react';
import { db } from '../lib/storage';
import { UserSession } from '../types';
import { openRaporPrintWindow } from '../lib/pdf';
import {
  Printer,
  Eye,
  Globe,
  Edit3,
  RotateCcw,
  Check,
  X,
  AlertCircle,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

interface RaporViewProps {
  tipe: 'akademik' | 'pondok';
  user: UserSession;
}

export const RaporView: React.FC<RaporViewProps> = ({ tipe, user }) => {
  const isPondok = tipe === 'pondok';
  const [kelasList, setKelasList] = useState<string[]>([]);
  const [kelas, setKelas] = useState('');
  const [allSiswa, setAllSiswa] = useState<any[]>([]);
  const [siswaNama, setSiswaNama] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any | null>(null);

  // Edit Mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSubject, setEditingSubject] = useState<{
    siswa: string;
    mapel: string;
    nilai: string;
    deskripsi: string;
    autoDeskripsi?: string;
  } | null>(null);

  const isAdmin = user.peran.includes('admin');
  const isKepsek = user.peran.includes('kepsek');
  const userWaliClasses = user.wali || [];
  const isWaliOfCurrentClass = userWaliClasses.includes(kelas);
  const canManageCurrentReport = isAdmin || isKepsek || isWaliOfCurrentClass;

  useEffect(() => {
    const s = db.list('Siswa');
    setAllSiswa(s);

    let kList = [...new Set(s.map(x => x.kelas).filter(Boolean))].sort();
    if (!isAdmin && !isKepsek) {
      // Homeroom teachers can only choose classes they are homeroom teacher for
      kList = kList.filter(k => userWaliClasses.includes(k));
    }

    setKelasList(kList);
    if (kList.length > 0) {
      setKelas(kList[0]);
    }
  }, [isAdmin, isKepsek, user]);

  useEffect(() => {
    if (!kelas) return;
    const kls = db.list('Kelas').find((k: any) => k.nama === kelas);
    setIsPublished(kls?.rapor_terbit === 'ya');
    loadPreview();
  }, [kelas, siswaNama, tipe]);

  const loadPreview = () => {
    if (!kelas) return;
    setLoading(true);
    try {
      const data = isPondok
        ? db.raporPondokData({ kelas, siswa: siswaNama || undefined })
        : db.raporData({ kelas, siswa: siswaNama || undefined });
      setPreviewData(data);
    } catch {
      setPreviewData(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!previewData || !previewData.santri || previewData.santri.length === 0) {
      alert('Tidak ada data rapor untuk dicetak.');
      return;
    }
    openRaporPrintWindow(previewData);
  };

  const handleTogglePublish = async () => {
    if (!kelas || !canManageCurrentReport) return;
    const nextState = !isPublished;
    const actionLabel = nextState ? 'menerbitkan' : 'menarik';
    if (!confirm(`Apakah Anda yakin ingin ${actionLabel} rapor kelas ${kelas} untuk akun orang tua/santri?`)) {
      return;
    }

    try {
      db.terbitkanRapor({ kelas, terbit: nextState });
      setIsPublished(nextState);
      alert(nextState ? `Rapor kelas ${kelas} berhasil diterbitkan.` : `Rapor kelas ${kelas} ditarik.`);
    } catch (err: any) {
      alert(err?.message || 'Gagal mengubah status publikasi rapor.');
    }
  };

  const handleSaveManualEdit = () => {
    if (!editingSubject) return;
    try {
      db.saveRaporManual({
        kelas,
        siswa: editingSubject.siswa,
        mapel: editingSubject.mapel,
        nilai: editingSubject.nilai,
        deskripsi: editingSubject.deskripsi
      });
      setEditingSubject(null);
      loadPreview();
    } catch (err: any) {
      alert(err?.message || 'Gagal menyimpan editan.');
    }
  };

  const handleResetManualEdit = () => {
    if (!editingSubject) return;
    if (confirm('Kembalikan deskripsi capaian ke rumusan otomatis hasil perhitungan TP?')) {
      db.resetRaporManual({
        kelas,
        siswa: editingSubject.siswa,
        mapel: editingSubject.mapel
      });
      setEditingSubject(null);
      loadPreview();
    }
  };

  const santriList = allSiswa.filter(s => s.kelas === kelas);

  if (!canManageCurrentReport && !isAdmin && !isKepsek) {
    return (
      <div className="p-8 max-w-lg mx-auto bg-white rounded-2xl border border-slate-200 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900">Akses Terbatas: Wali Kelas &amp; Pimpinan</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Pencetakan dan penerbitan rapor hanya dapat diakses oleh Wali Kelas yang ditugaskan, Administrator, atau Kepala Sekolah.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls Card */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {isPondok ? 'Rapor Pondok (Laporan Perkembangan)' : 'Rapor Akademik (Kurikulum Merdeka)'}
            </h2>
            <p className="text-xs text-slate-500">
              Format cetak resmi standar F4 Folio (215 &times; 330 mm). Narasi capaian dapat disesuaikan manual oleh wali kelas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isPondok && (
              <button
                type="button"
                onClick={() => setIsEditMode(!isEditMode)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                  isEditMode
                    ? 'border-[#1B5558] bg-emerald-50 text-[#1B5558]'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditMode ? 'Tutup Mode Edit' : 'Edit Narasi &amp; Nilai Rapor'}</span>
              </button>
            )}

            {canManageCurrentReport && (
              <button
                type="button"
                onClick={handleTogglePublish}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                  isPublished
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{isPublished ? 'Rapor Diterbitkan (Aktif)' : 'Terbitkan Rapor ke Santri'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              disabled={loading || !previewData}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1B5558] hover:bg-[#143F41] text-white text-xs font-semibold transition cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Rapor F4</span>
            </button>
          </div>
        </div>

        {/* Filter Selection */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Kelas</label>
            <select
              value={kelas}
              onChange={e => {
                setKelas(e.target.value);
                setSiswaNama('');
              }}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5558]"
            >
              {kelasList.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Santri</label>
            <select
              value={siswaNama}
              onChange={e => setSiswaNama(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5558]"
            >
              <option value="">Semua Santri di Kelas ({santriList.length})</option>
              {santriList.map(s => (
                <option key={s.id} value={s.nama}>{s.nama}</option>
              ))}
            </select>
          </div>

          {isEditMode && (
            <div className="ml-auto text-xs text-[#1B5558] bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Mode Edit Aktif: Klik tombol <b>"Ubah"</b> pada baris mata pelajaran santri.</span>
            </div>
          )}
        </div>
      </div>

      {/* Live On-Screen Preview */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 text-xs">
          <span className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-[#1B5558]" />
            Pratinjau Lembar Rapor F4 ({previewData?.santri?.length || 0} Santri)
          </span>
          <span className="text-slate-400">Ukuran Kertas: Folio/F4 (215 &times; 330 mm)</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Menyusun pratinjau rapor...</div>
        ) : !previewData || !previewData.santri || previewData.santri.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            Belum ada santri atau data nilai yang tercatat di kelas ini.
          </div>
        ) : (
          <div className="space-y-8 max-w-4xl mx-auto">
            {previewData.santri.map((s: any, sIdx: number) => (
              <div key={s.nama || sIdx} className="p-6 md:p-8 bg-slate-50/60 rounded-xl border border-slate-200 space-y-5 text-xs text-slate-800">
                {/* School Header */}
                <div className="text-center pb-3 border-b border-slate-200">
                  <h3 className="font-extrabold text-sm md:text-base text-slate-900 tracking-wide uppercase">
                    {isPondok ? 'Laporan Perkembangan Kegiatan Pondok' : 'Pencapaian Kompetensi Peserta Didik'}
                  </h3>
                  <p className="text-[11px] text-slate-600 font-semibold">{previewData.sekolah?.nama}</p>
                </div>

                {/* Student Info Grid */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[11px] bg-white p-3.5 rounded-lg border border-slate-200">
                  <div><span className="text-slate-400 inline-block w-24">Nama Santri</span>: <b className="text-slate-900">{s.nama}</b></div>
                  <div><span className="text-slate-400 inline-block w-20">NISG / NISN</span>: <span className="font-mono">{s.nisg} {s.nisn ? `(${s.nisn})` : ''}</span></div>
                  <div><span className="text-slate-400 inline-block w-24">Kelas</span>: {previewData.kelas}</div>
                  <div><span className="text-slate-400 inline-block w-20">Semester</span>: {previewData.semester} / {previewData.tahun}</div>
                </div>

                {/* Content: Groups */}
                {isPondok ? (
                  <div className="space-y-4">
                    {s.kategori?.map((kat: any) => (
                      <div key={kat.nama} className="space-y-2">
                        <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wide bg-emerald-50 px-2.5 py-1 rounded text-[#1B5558]">
                          {kat.nama}
                        </div>
                        <div className="overflow-x-auto border border-slate-200 rounded-lg">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100/70 border-b border-slate-200 font-semibold text-slate-700">
                              <tr>
                                <th className="py-2 px-3 w-8 text-center">No</th>
                                <th className="py-2 px-3 w-44">Mata Pelajaran / Aspek</th>
                                <th className="py-2 px-3 w-40 text-center">Predikat</th>
                                <th className="py-2 px-3">Deskripsi Capaian</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {kat.rows.map((r: any, rIdx: number) => (
                                <tr key={rIdx}>
                                  <td className="py-2 px-3 text-center text-slate-400 font-mono">{rIdx + 1}</td>
                                  <td className="py-2 px-3 font-medium text-slate-900">{r.subjek}</td>
                                  <td className="py-2 px-3 text-center">
                                    <span className="inline-block px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-800">
                                      {r.predikat}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-slate-600 leading-relaxed whitespace-pre-line">{r.deskripsi}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {s.kelompok?.map((grp: any) => (
                      <div key={grp.nama} className="space-y-2">
                        <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wide bg-emerald-50 px-2.5 py-1 rounded text-[#1B5558]">
                          {grp.nama}
                        </div>
                        <div className="overflow-x-auto border border-slate-200 rounded-lg">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100/70 border-b border-slate-200 font-semibold text-slate-700">
                              <tr>
                                <th className="py-2 px-3 w-8 text-center">No</th>
                                <th className="py-2 px-3 w-48">Mata Pelajaran</th>
                                <th className="py-2 px-3 w-16 text-center">Nilai</th>
                                <th className="py-2 px-3">Capaian Kompetensi</th>
                                {isEditMode && <th className="py-2 px-3 w-20 text-right">Edit</th>}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {grp.rows.map((r: any, rIdx: number) => (
                                <tr key={rIdx} className={r.isManual ? 'bg-amber-50/20' : ''}>
                                  <td className="py-2 px-3 text-center text-slate-400 font-mono">{rIdx + 1}</td>
                                  <td className="py-2 px-3 font-medium text-slate-900">
                                    {r.mapel}
                                    {r.isManual && (
                                      <span className="ml-1.5 text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold uppercase">
                                        Manual
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2 px-3 text-center font-bold text-slate-900">{r.nilai}</td>
                                  <td className="py-2 px-3 text-slate-600 leading-relaxed whitespace-pre-line">
                                    {r.deskripsi}
                                  </td>
                                  {isEditMode && (
                                    <td className="py-2 px-3 text-right">
                                      <button
                                        type="button"
                                        onClick={() => setEditingSubject({
                                          siswa: s.nama,
                                          mapel: r.mapel,
                                          nilai: String(r.nilai),
                                          deskripsi: r.deskripsi,
                                          autoDeskripsi: r.autoDeskripsi
                                        })}
                                        className="px-2 py-1 text-xs font-semibold text-[#1B5558] hover:bg-emerald-50 rounded border border-emerald-300 transition cursor-pointer"
                                      >
                                        Ubah
                                      </button>
                                    </td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}

                    {/* Extracurriculars & Absences */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                        <span className="font-bold text-[11px] text-slate-700 uppercase">Ketidakhadiran</span>
                        <div className="text-xs text-slate-600 space-y-0.5">
                          <div>Sakit: <b>{s.sakit || 0} hari</b></div>
                          <div>Izin: <b>{s.izin || 0} hari</b></div>
                          <div>Alfa: <b>{s.alfa || 0} hari</b></div>
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                        <span className="font-bold text-[11px] text-slate-700 uppercase">Catatan Wali Kelas</span>
                        <p className="text-xs text-slate-600 italic">
                          "{s.catatan || 'Tingkatkan terus prestasi dan akhlak mulia dalam setiap langkah.'}"
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Subject Edit Modal */}
      {editingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Edit Narasi Capaian &amp; Nilai Rapor
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  {editingSubject.siswa} • {editingSubject.mapel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingSubject(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div>
                <label className="block font-bold text-slate-600 uppercase mb-1">Nilai Akhir Rapor</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editingSubject.nilai}
                  onChange={e => setEditingSubject({ ...editingSubject, nilai: e.target.value })}
                  className="w-24 px-3 py-1.5 border border-slate-300 rounded-lg text-center font-bold text-sm bg-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-600 uppercase">
                    Deskripsi Capaian Kompetensi (Tercetak di Rapor)
                  </label>
                  {editingSubject.autoDeskripsi && (
                    <button
                      type="button"
                      onClick={() => setEditingSubject({ ...editingSubject, deskripsi: editingSubject.autoDeskripsi || '' })}
                      className="text-[#1B5558] hover:underline font-semibold cursor-pointer text-[10px]"
                    >
                      Salin Teks Otomatis
                    </button>
                  )}
                </div>
                <textarea
                  rows={6}
                  value={editingSubject.deskripsi}
                  onChange={e => setEditingSubject({ ...editingSubject, deskripsi: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white leading-relaxed text-slate-800"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleResetManualEdit}
                  className="px-3 py-2 rounded-lg text-rose-700 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset ke Otomatis</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingSubject(null)}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveManualEdit}
                    className="px-5 py-2 rounded-lg bg-[#1B5558] hover:bg-[#143F41] text-white font-semibold cursor-pointer shadow-xs"
                  >
                    Simpan Perubahan
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
