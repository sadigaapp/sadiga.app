import React, { useState, useEffect } from 'react';
import { db } from '../lib/storage';
import { UserSession } from '../types';
import { openRaporPrintWindow, formatDate } from '../lib/pdf';
import { CheckSquare, Award, Calendar, AlertCircle, Printer, FileText } from 'lucide-react';

interface SantriPortalViewProps {
  user: UserSession;
  view: 'mutabaah' | 'rapor';
}

export const SantriPortalView: React.FC<SantriPortalViewProps> = ({ user, view }) => {
  const isRapor = view === 'rapor';
  const [mutabaahData, setMutabaahData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isRapor) {
      loadMutabaah();
    }
  }, [view]);

  const loadMutabaah = () => {
    setLoading(true);
    try {
      const res = db.mutabaahSaya();
      setMutabaahData(res);
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat data mutabaah.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintRapor = (tipe: 'akademik' | 'pondok') => {
    try {
      const data = db.raporSaya({ tipe });
      openRaporPrintWindow(data);
    } catch (err: any) {
      alert(err?.message || 'Rapor belum diterbitkan oleh wali kelas.');
    }
  };

  if (isRapor) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto py-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-[#1B5558] flex items-center justify-center mx-auto">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Rapor Pembelajaran &amp; Karakter</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Unduh dan cetak lembar Rapor Akademik dan Rapor Pondok ananda resmi format standar Folio F4 (215 &times; 330 mm).
            </p>
          </div>

          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 leading-relaxed text-left max-w-lg mx-auto">
            <b>Informasi Wali Kelas:</b> Rapor dapat dicetak setelah wali kelas menerbitkan rapor untuk semester aktif. Pastikan di dialog cetak Anda memilih opsi <i>"Simpan sebagai PDF"</i> atau printer kertas F4.
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => handlePrintRapor('akademik')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#1B5558] hover:bg-[#143F41] text-white text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Rapor Akademik (Kurikulum Merdeka)</span>
            </button>

            <button
              type="button"
              onClick={() => handlePrintRapor('pondok')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#1B5558] text-[#1B5558] hover:bg-emerald-50 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Rapor Pondok (Perkembangan)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mutaba'ah Saya
  const items = mutabaahData?.items || [];
  const rows = mutabaahData?.rows || [];
  const n = rows.length;

  const selIds = (r: any) => (r.selesai || '').split(',');
  const getPct = (it: any) =>
    n ? Math.round((100 * rows.filter((r: any) => selIds(r).includes(it.id)).length) / n) : 0;

  const groups = [...new Set(items.map((i: any) => i.kelompok))];
  const recentDays = rows.slice().sort((a: any, b: any) => b.tanggal.localeCompare(a.tanggal)).slice(0, 14);

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Title Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Mutaba'ah Yaumiyah Mandiri</h2>
          <p className="text-xs text-slate-500">
            {mutabaahData?.siswa?.nama} • Kelas {mutabaahData?.siswa?.kelas} ({n} hari tercatat di semester ini)
          </p>
        </div>
      </div>

      {error ? (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      ) : loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Memuat statistik mutaba'ah ananda...</div>
      ) : n === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
          Belum ada catatan mutaba'ah yang tercatat pada semester ini.
        </div>
      ) : (
        <div className="space-y-5">
          {/* Group Summaries */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
              Keterlaksanaan Ibadah per Kategori
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {groups.map((g: any) => {
                const its = items.filter((i: any) => i.kelompok === g);
                const avgPct = its.length ? Math.round(its.reduce((t: number, i: any) => t + getPct(i), 0) / its.length) : 0;
                return (
                  <div key={g} className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{g}</span>
                      <span className="font-extrabold text-[#1B5558]">{avgPct}%</span>
                    </div>
                    <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-[#1B5558] rounded-full transition-all duration-300" style={{ width: `${avgPct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Breakdown Per Devotion */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
              Konsistensi Masing-Masing Ibadah
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {items.map((i: any) => {
                const pct = getPct(i);
                return (
                  <div key={i.id} className="p-3 rounded-lg border border-slate-200 bg-white space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-800 font-medium">{i.nama}</span>
                      <span className="font-bold text-slate-700">{pct}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent 14 Days List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-bold text-xs uppercase tracking-wider text-slate-700">
              Riwayat 14 Hari Terakhir
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#E9F2F2] text-[#1B5558] border-b border-slate-200 font-bold uppercase text-[11px]">
                    <th className="py-2.5 px-4 w-28">Tanggal</th>
                    <th className="py-2.5 px-4 w-36">Terlaksana</th>
                    <th className="py-2.5 px-4">Ibadah Belum Terlaksana</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {recentDays.map((r: any) => {
                    const s = selIds(r);
                    const miss = items.filter((i: any) => !s.includes(i.id)).map((i: any) => i.nama);
                    return (
                      <tr key={r.tanggal} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-4 font-mono font-medium">{formatDate(r.tanggal)}</td>
                        <td className="py-2.5 px-4 font-bold text-[#1B5558]">
                          {items.length - miss.length} dari {items.length}
                        </td>
                        <td className="py-2.5 px-4 text-slate-500">
                          {miss.length ? miss.join(', ') : <span className="text-emerald-600 font-semibold">Lengkap Seluruhnya</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
