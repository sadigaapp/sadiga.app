import React, { useState, useEffect } from 'react';
import { db } from '../lib/storage';
import { exportLegerF4LandscapePdf, printLegerF4LandscapeWindow } from '../lib/pdf';
import {
  FileSpreadsheet,
  Download,
  Printer,
  TrendingUp,
  BarChart3,
  Award,
  CheckCircle2,
  CalendarCheck,
  BookOpen
} from 'lucide-react';

export const LegerStatistikView: React.FC = () => {
  const [kelasList, setKelasList] = useState<string[]>([]);
  const [kelas, setKelas] = useState('');
  const [legerData, setLegerData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const s = db.list('Siswa');
    const kList = [...new Set(s.map(x => x.kelas).filter(Boolean))].sort();
    setKelasList(kList);
    if (kList.length > 0) setKelas(kList[0]);
  }, []);

  useEffect(() => {
    if (!kelas) return;
    loadLeger();
  }, [kelas]);

  const loadLeger = () => {
    setLoading(true);
    try {
      const res = db.getLeger(kelas);
      setLegerData(res);
    } catch (err: any) {
      alert(err?.message || 'Gagal menghitung leger kelas.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintLandscape = () => {
    if (!legerData) return;
    printLegerF4LandscapeWindow(legerData);
  };

  const handleExportPdf = () => {
    if (!legerData) return;
    exportLegerF4LandscapePdf(legerData);
  };

  const mapels = legerData?.mapels || [];
  const rows = legerData?.rows || [];
  const stats = legerData?.classStats;
  const subStats = legerData?.subjectStats || {};

  // Calculate class attendance aggregate averages
  const totalHadirDays = rows.reduce((t: number, r: any) => t + (r.hadir || 0), 0);
  const totalSakitDays = rows.reduce((t: number, r: any) => t + (r.sakit || 0), 0);
  const totalIzinDays = rows.reduce((t: number, r: any) => t + (r.izin || 0), 0);
  const totalAlfaDays = rows.reduce((t: number, r: any) => t + (r.alfa || 0), 0);
  const avgAttendancePct = rows.length > 0
    ? Math.round(rows.reduce((t: number, r: any) => t + (r.presensiPct || 0), 0) / rows.length)
    : 0;

  // Calculate curriculum pass rate across class
  const passingStudents = rows.filter((r: any) => r.average !== null && r.average >= (stats?.tuntasLimit || 75)).length;
  const passPercentage = rows.length > 0 ? Math.round((passingStudents / rows.length) * 100) : 0;

  // Total Ziyadah Ayat in class
  const totalClassZiyadah = rows.reduce((t: number, r: any) => t + (r.ziyadahAyat || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header & Filter Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#1B5558] flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Leger Nilai &amp; Rekapitulasi Kelas
              </h2>
              <p className="text-xs text-slate-500">
                Tabel rekapitulasi nilai seluruh mata pelajaran, rincian hari kehadiran (H/S/I/A), dan cetak format Folio / F4 Landscape (330 &times; 215 mm).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrintLandscape}
              disabled={loading || rows.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer shadow-2xs disabled:opacity-50"
              title="Cetak langsung menggunakan kertas F4 landscape (330 x 215 mm)"
            >
              <Printer className="w-3.5 h-3.5 text-[#1B5558]" />
              <span>Cetak Leger (F4 Landscape)</span>
            </button>

            <button
              type="button"
              onClick={handleExportPdf}
              disabled={loading || rows.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1B5558] hover:bg-[#143F41] text-white text-xs font-semibold transition cursor-pointer shadow-xs disabled:opacity-50"
              title="Unduh berkas PDF resmi ukuran F4 landscape"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh PDF (F4 Landscape)</span>
            </button>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Pilih Kelas</label>
              <select
                value={kelas}
                onChange={e => setKelas(e.target.value)}
                className="px-3.5 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5558]"
              >
                {kelasList.map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>

            {legerData?.wali?.nama && (
              <div className="pt-4 text-xs text-slate-600">
                <span className="text-slate-400">Wali Kelas: </span>
                <span className="font-semibold text-slate-800">{legerData.wali.nama}</span>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-400">
            Standar Cetak: <span className="font-semibold text-slate-600 font-mono">F4 Landscape (330 &times; 215 mm)</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
          Menghitung leger dan rekapitulasi kelas {kelas}...
        </div>
      ) : rows.length === 0 ? (
        <div className="py-20 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
          Belum ada siswa atau data nilai di kelas ini.
        </div>
      ) : (
        <>
          {/* Class Summary Analytics Cards (Non-Competitive, Focused on Class Health) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Rata-Rata Kelas</span>
                <TrendingUp className="w-4 h-4 text-[#1B5558]" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 font-mono">{stats?.classAvg || 0}</div>
              <span className="text-[10px] text-slate-400">Dari {stats?.studentCount} santri aktif</span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Tingkat Ketuntasan</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-700 font-mono">{passPercentage}%</div>
              <span className="text-[10px] text-slate-400">{passingStudents} dari {rows.length} santri tuntas (&ge; {stats?.tuntasLimit})</span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Kehadiran Rata-Rata</span>
                <CalendarCheck className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-2xl font-extrabold text-[#1B5558] font-mono">{avgAttendancePct}%</div>
              <span className="text-[10px] text-slate-400">Total {totalHadirDays} hadir • {totalSakitDays}S • {totalIzinDays}I • {totalAlfaDays}A</span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Capaian Ziyadah</span>
                <BookOpen className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 font-mono">{totalClassZiyadah} <span className="text-xs font-normal text-slate-500">ayat</span></div>
              <span className="text-[10px] text-slate-400">Akumulasi hafalan baru semester ini</span>
            </div>
          </div>

          {/* Visual Graphic: Subject Comparison Bar Chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#1B5558]" />
                Grafik Komparasi Capaian Rata-Rata Per Mata Pelajaran
              </h3>
              <span className="text-[11px] text-slate-400">Batas Ketuntasan: &ge; {stats?.tuntasLimit}</span>
            </div>

            <div className="space-y-3 pt-1">
              {mapels.map((m: any) => {
                const subStat = subStats[m.nama] || { avg: 0, passRate: 0 };
                const isPassed = subStat.avg >= (stats?.tuntasLimit || 75);
                return (
                  <div key={m.nama} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 truncate max-w-md">{m.nama}</span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className={`font-bold ${isPassed ? 'text-[#1B5558]' : 'text-amber-700'}`}>
                          {subStat.avg}
                        </span>
                        <span className="text-[10px] text-slate-400">({subStat.passRate}% tuntas)</span>
                      </div>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isPassed ? 'bg-[#1B5558]' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, (subStat.avg / 100) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* The Complete Leger Matrix Table with Attendance in Days (H, S, I, A) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                  Tabel Leger Nilai &amp; Rekapitulasi Presensi Kelas {kelas}
                </h3>
                <span className="text-[11px] text-slate-400">
                  Total {rows.length} santri • {mapels.length} mata pelajaran • Diurutkan alfabetis (tanpa pemeringkatan)
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                  H: Hadir
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                  S: Sakit
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                  I: Izin
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                  A: Alfa
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  {/* Top Level Group Headers */}
                  <tr className="bg-[#E9F2F2] text-[#1B5558] border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                    <th rowSpan={2} className="py-2.5 px-3 w-10 text-center border-r border-slate-200">No</th>
                    <th rowSpan={2} className="py-2.5 px-3 w-20 font-mono text-center border-r border-slate-200">NISG</th>
                    <th rowSpan={2} className="py-2.5 px-3 min-w-44 sticky left-0 bg-[#E9F2F2] z-10 border-r border-slate-200">Nama Santri</th>
                    <th colSpan={mapels.length} className="py-2 px-2 text-center border-r border-slate-200 bg-[#DEECEC]">
                      Mata Pelajaran (Nilai Akhir)
                    </th>
                    <th colSpan={2} className="py-2 px-2 text-center border-r border-slate-200 bg-slate-100">
                      Rekap Nilai
                    </th>
                    <th colSpan={5} className="py-2 px-2 text-center border-r border-slate-200 bg-emerald-100/70">
                      Kehadiran / Presensi (Hari &amp; %)
                    </th>
                    <th colSpan={2} className="py-2 px-2 text-center bg-slate-100">
                      Catatan Pembiasaan
                    </th>
                  </tr>

                  {/* Sub-Headers */}
                  <tr className="bg-[#F0F6F6] text-[#1B5558] border-b border-slate-200 font-bold text-[10.5px]">
                    {mapels.map((m: any) => (
                      <th
                        key={m.nama}
                        className="py-2 px-2 text-center min-w-18 border-r border-slate-200/60"
                        title={m.nama}
                      >
                        {m.nama.length > 13 ? m.nama.slice(0, 11) + '..' : m.nama}
                      </th>
                    ))}
                    <th className="py-2 px-2.5 text-center bg-slate-100 font-extrabold border-r border-slate-200">Total</th>
                    <th className="py-2 px-2.5 text-center bg-emerald-50 font-black text-[#1B5558] border-r border-slate-200">Rata</th>

                    {/* Presensi columns: Hadir, Sakit, Izin, Alfa, % */}
                    <th className="py-2 px-2 text-center bg-emerald-100/40 text-emerald-800" title="Jumlah Hari Hadir">H</th>
                    <th className="py-2 px-2 text-center bg-emerald-100/40 text-amber-800" title="Jumlah Hari Sakit">S</th>
                    <th className="py-2 px-2 text-center bg-emerald-100/40 text-blue-800" title="Jumlah Hari Izin">I</th>
                    <th className="py-2 px-2 text-center bg-emerald-100/40 text-rose-800" title="Jumlah Hari Alfa">A</th>
                    <th className="py-2 px-2 text-center bg-emerald-100/60 font-bold border-r border-slate-200" title="Persentase Kehadiran">% Hdr</th>

                    <th className="py-2 px-2.5 text-center border-r border-slate-200">Poin</th>
                    <th className="py-2 px-2.5 text-center">Ziyadah</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {rows.map((r: any, idx: number) => {
                    return (
                      <tr
                        key={r.siswa}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-2 px-3 text-center font-mono text-slate-400 border-r border-slate-100">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-500 text-center border-r border-slate-100">
                          {r.nis}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-900 sticky left-0 bg-white hover:bg-slate-50 border-r border-slate-100">
                          {r.siswa}
                        </td>

                        {mapels.map((m: any) => {
                          const sc = r.scores[m.nama];
                          const belowKkm = sc !== null && sc < (stats?.tuntasLimit || 75);
                          return (
                            <td
                              key={m.nama}
                              className={`py-2 px-2 text-center font-mono font-medium border-r border-slate-100 ${
                                belowKkm ? 'text-amber-700 bg-amber-50/50 font-bold' : ''
                              }`}
                            >
                              {sc !== null && sc !== undefined ? sc : '-'}
                            </td>
                          );
                        })}

                        <td className="py-2 px-2.5 text-center font-bold bg-slate-50/70 font-mono border-r border-slate-100">
                          {r.total}
                        </td>
                        <td className="py-2 px-2.5 text-center font-black bg-emerald-50/70 text-[#1B5558] font-mono border-r border-slate-100">
                          {r.average !== null ? r.average : '-'}
                        </td>

                        {/* Attendance Days Columns */}
                        <td className="py-2 px-2 text-center font-mono font-semibold text-emerald-700 bg-emerald-50/20">
                          {r.hadir ?? 0}
                        </td>
                        <td className="py-2 px-2 text-center font-mono text-amber-700">
                          {r.sakit ?? 0}
                        </td>
                        <td className="py-2 px-2 text-center font-mono text-blue-700">
                          {r.izin ?? 0}
                        </td>
                        <td className="py-2 px-2 text-center font-mono">
                          <span className={r.alfa > 0 ? 'text-rose-700 font-bold' : 'text-slate-400'}>
                            {r.alfa ?? 0}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center font-mono font-semibold text-[#1B5558] bg-emerald-50/30 border-r border-slate-100">
                          {r.presensiPct !== null ? `${r.presensiPct}%` : '-'}
                        </td>

                        {/* Character points and tahfizh */}
                        <td className="py-2 px-2.5 text-center font-mono font-semibold border-r border-slate-100">
                          <span className={r.netPoin >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                            {r.netPoin > 0 ? `+${r.netPoin}` : r.netPoin}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 text-center font-mono text-slate-600">
                          {r.ziyadahAyat > 0 ? `${r.ziyadahAyat} ay` : '-'}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Summary Row at the Bottom: Rata-Rata Kelas */}
                  <tr className="bg-[#E9F2F2] font-bold text-slate-800 border-t-2 border-slate-300">
                    <td colSpan={3} className="py-2.5 px-3 text-right pr-4 uppercase tracking-wider text-[11px] text-[#1B5558] border-r border-slate-300">
                      Rata-Rata Kelas
                    </td>
                    {mapels.map((m: any) => (
                      <td key={m.nama} className="py-2.5 px-2 text-center font-mono text-[#1B5558] border-r border-slate-200">
                        {subStats[m.nama]?.avg ?? '-'}
                      </td>
                    ))}
                    <td className="py-2.5 px-2.5 text-center font-mono text-slate-500 border-r border-slate-200">-</td>
                    <td className="py-2.5 px-2.5 text-center font-mono font-black text-sm text-[#1B5558] bg-emerald-100/60 border-r border-slate-300">
                      {stats?.classAvg ?? '-'}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-emerald-800">
                      {Math.round(totalHadirDays / (rows.length || 1))}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-amber-800">
                      {Math.round((totalSakitDays / (rows.length || 1)) * 10) / 10}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-blue-800">
                      {Math.round((totalIzinDays / (rows.length || 1)) * 10) / 10}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-rose-800">
                      {Math.round((totalAlfaDays / (rows.length || 1)) * 10) / 10}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-[#1B5558] font-bold border-r border-slate-300">
                      {avgAttendancePct}%
                    </td>
                    <td colSpan={2} className="py-2.5 px-3 text-center font-mono text-slate-400">
                      -
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
              <span>Rekapitulasi resmi presensi dan penilaian semester aktif disusun berdasarkan urutan alfabetis tanpa sistem peringkat.</span>
              <span>Dokumen Akademik Resmi (Format Folio / F4 Landscape 330 &times; 215 mm) • SADIGA</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
