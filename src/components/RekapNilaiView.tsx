import React, { useState, useEffect } from 'react';
import { db } from '../lib/storage';
import { exportTableF4Pdf } from '../lib/pdf';
import { Calculator, Download, CheckCircle2, AlertTriangle, BookOpen } from 'lucide-react';

export const RekapNilaiView: React.FC = () => {
  const [kelasList, setKelasList] = useState<string[]>([]);
  const [mapelList, setMapelList] = useState<any[]>([]);
  const [kelas, setKelas] = useState('');
  const [mapel, setMapel] = useState('');
  const [rekapRows, setRekapRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [calculated, setCalculated] = useState(false);

  useEffect(() => {
    const siswa = db.list('Siswa');
    const mp = db.list('Mapel');
    const kList = [...new Set(siswa.map(s => s.kelas).filter(Boolean))].sort();
    setKelasList(kList);
    setMapelList(mp);
    if (kList.length > 0) setKelas(kList[0]);
    if (mp.length > 0) setMapel(mp[0].nama);
  }, []);

  const handleHitung = () => {
    if (!kelas || !mapel) {
      alert('Pilih kelas dan mata pelajaran.');
      return;
    }
    setLoading(true);
    try {
      const res = db.rekap({ kelas, mapel });
      setRekapRows(res);
      setCalculated(true);
    } catch (err: any) {
      alert(err?.message || 'Gagal menghitung rekap nilai.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = () => {
    const headers = ['Nama Santri', 'Kehadiran (%)', 'Sumatif', 'Formatif', 'Nilai Akhir', 'Deskripsi Capaian TP'];
    const rows = rekapRows.map(r => [
      r.siswa,
      r.kehadiran !== null ? `${r.kehadiran}%` : '-',
      r.sumatif !== null ? r.sumatif : '-',
      r.formatif !== null ? r.formatif : '-',
      r.akhir !== null ? `${r.akhir}${r.lengkap ? '' : ' *'}` : '-',
      r.deskripsi || '-'
    ]);

    exportTableF4Pdf(`Rekap_Nilai_${mapel}_${kelas}`, headers, rows, {
      kelas,
      mapel,
      periode: db.getPeriode()
    });
  };

  const P = db.getSettings();

  return (
    <div className="space-y-4">
      {/* Top Filter and Actions */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Rekap Nilai Akhir &amp; TP</h2>
            <p className="text-xs text-slate-500">
              Perhitungan nilai akhir terbobot (Kehadiran: {P.bobot_kehadiran}%, Sumatif: {P.bobot_sumatif}%, Formatif: {P.bobot_formatif}%) serta pembentukan deskripsi capaian otomatis standar Rapkumer.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleHitung}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1B5558] hover:bg-[#143F41] text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>{loading ? 'Menghitung...' : 'Hitung Nilai Akhir'}</span>
            </button>

            {calculated && rekapRows.length > 0 && (
              <button
                type="button"
                onClick={handleExportPdf}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh PDF F4</span>
              </button>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Kelas</label>
            <select
              value={kelas}
              onChange={e => {
                setKelas(e.target.value);
                setCalculated(false);
              }}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5558]"
            >
              {kelasList.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Mata Pelajaran</label>
            <select
              value={mapel}
              onChange={e => {
                setMapel(e.target.value);
                setCalculated(false);
              }}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5558]"
            >
              {mapelList.map(m => (
                <option key={m.id} value={m.nama}>{m.nama}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {!calculated ? (
          <div className="py-16 px-4 text-center text-slate-400 text-xs">
            Pilih kelas dan mata pelajaran, kemudian klik <b>"Hitung Nilai Akhir"</b>.
          </div>
        ) : rekapRows.length === 0 ? (
          <div className="py-16 px-4 text-center text-slate-400 text-xs">
            Tidak ada siswa ditemukan di kelas {kelas}.
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#E9F2F2] text-[#1B5558] border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3 w-10 text-center">No</th>
                    <th className="py-2.5 px-3 w-48">Nama Santri</th>
                    <th className="py-2.5 px-3 text-center">Kehadiran</th>
                    <th className="py-2.5 px-3 text-center">Sumatif</th>
                    <th className="py-2.5 px-3 text-center">Formatif</th>
                    <th className="py-2.5 px-3 text-center w-24">Nilai Akhir</th>
                    <th className="py-2.5 px-3">Deskripsi Capaian Otomatis (Rapor)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {rekapRows.map((r, idx) => (
                    <tr key={r.siswa} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{r.siswa}</td>
                      <td className="py-3 px-3 text-center font-mono">{r.kehadiran !== null ? `${r.kehadiran}%` : '-'}</td>
                      <td className="py-3 px-3 text-center font-mono">{r.sumatif !== null ? r.sumatif : '-'}</td>
                      <td className="py-3 px-3 text-center font-mono">{r.formatif !== null ? r.formatif : '-'}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center justify-center font-bold text-sm px-2.5 py-0.5 rounded bg-emerald-50 text-[#1B5558] border border-emerald-200">
                          {r.akhir !== null ? r.akhir : '-'}
                        </span>
                        {!r.lengkap && (
                          <span title="Komponen belum lengkap" className="text-amber-500 font-bold ml-1">*</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-600 leading-relaxed whitespace-pre-line max-w-md">
                        {r.deskripsi}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Tanda bintang (*) menandakan salah satu komponen (kehadiran, sumatif, atau formatif) belum tercatat.
              </span>
              <span>Ambang Ketuntasan TP: {P.tuntas} (Cukup: &le;{P.batas_cukup}, Baik: &le;{P.batas_baik})</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
