import React, { useState, useEffect } from 'react';
import { db } from '../lib/storage';
import { openAccountCardsPrintWindow } from '../lib/pdf';
import { Key, Plus, RefreshCw, Printer, X, CheckCircle2, AlertCircle } from 'lucide-react';

export const AkunSantriView: React.FC = () => {
  const [kelasList, setKelasList] = useState<string[]>([]);
  const [kelas, setKelas] = useState('');
  const [allSiswa, setAllSiswa] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [generatedAccounts, setGeneratedAccounts] = useState<any[] | null>(null);

  const loadData = () => {
    const s = db.list('Siswa');
    const u = db.list('Pengguna');
    const kList = [...new Set(s.map(x => x.kelas).filter(Boolean))].sort();

    setAllSiswa(s);
    setAllUsers(u);
    setKelasList(kList);
    if (kList.length > 0 && !kelas) setKelas(kList[0]);
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentStudents = allSiswa.filter(s => s.kelas === kelas);

  const handleBuatAkun = async (targetId?: string) => {
    if (!kelas) {
      alert('Pilih kelas terlebih dahulu.');
      return;
    }
    if (targetId && !confirm('Buat kata sandi baru untuk akun ini? Kata sandi lama tidak berlaku lagi.')) {
      return;
    }

    try {
      const res = db.buatAkun({
        kelas,
        ulang: targetId ? [targetId] : undefined
      });

      loadData();
      if (res.length === 0) {
        alert('Semua santri di kelas ini sudah memiliki akun.');
        return;
      }
      setGeneratedAccounts(res);
    } catch (err: any) {
      alert(err?.message || 'Gagal membuat akun.');
    }
  };

  const handlePrintCards = () => {
    if (!generatedAccounts || generatedAccounts.length === 0) {
      alert('Tidak ada kartu akun yang baru dibuat untuk dicetak.');
      return;
    }
    const P = db.getSettings();
    openAccountCardsPrintWindow(generatedAccounts, P.alamat_aplikasi);
  };

  return (
    <div className="space-y-4">
      {/* Header and Class Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Akun Santri &amp; Orang Tua</h2>
            <p className="text-xs text-slate-500">
              Satu akun per santri untuk login orang tua dan santri. Username = NISG, kata sandi acak hanya tampil sekali saat dibuat.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleBuatAkun()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1B5558] hover:bg-[#143F41] text-white text-xs font-semibold transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Akun yang Belum Ada</span>
            </button>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Kelas</label>
            <select
              value={kelas}
              onChange={e => setKelas(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
            >
              {kelasList.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Student Accounts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#E9F2F2] text-[#1B5558] border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3 w-10 text-center">No</th>
                <th className="py-2.5 px-3 w-48">Nama Santri</th>
                <th className="py-2.5 px-3 w-32 font-mono">NISG</th>
                <th className="py-2.5 px-3">Status Akun Login</th>
                <th className="py-2.5 px-3 w-32 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {currentStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Tidak ada data santri pada kelas ini.
                  </td>
                </tr>
              ) : (
                currentStudents.map((s, idx) => {
                  const userAccount = allUsers.find(u => u.siswa === s.id);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{s.nama}</td>
                      <td className="py-2.5 px-3 font-mono">{s.nis || '-'}</td>
                      <td className="py-2.5 px-3">
                        {userAccount ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Tersedia ({userAccount.username})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500">
                            Belum Ada Akun
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {userAccount ? (
                          <button
                            type="button"
                            onClick={() => handleBuatAkun(s.id)}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-[#1B5558] hover:bg-emerald-50 border border-slate-200 rounded-lg transition cursor-pointer"
                          >
                            Reset Sandi
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleBuatAkun(s.id)}
                            className="px-2.5 py-1 text-xs font-semibold text-[#1B5558] hover:bg-emerald-50 border border-emerald-300 rounded-lg transition cursor-pointer"
                          >
                            Buat Akun
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Result Slip Modal */}
      {generatedAccounts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-[#1B5558]" />
                <h3 className="font-bold text-sm text-slate-900">Hasil Pembuatan / Reset Akun</h3>
              </div>
              <button
                type="button"
                onClick={() => setGeneratedAccounts(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  Kata sandi acak hanya tampil pada jendela ini. Cetak kartu akun sekarang sebelum menutup pop-up.
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/70 border-b border-slate-200 font-bold text-slate-700">
                    <tr>
                      <th className="py-2 px-3">Nama Santri</th>
                      <th className="py-2 px-3">Username</th>
                      <th className="py-2 px-3 font-mono">Kata Sandi Baru</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {generatedAccounts.map((a, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-semibold text-slate-900">{a.nama}</td>
                        <td className="py-2 px-3 font-mono">{a.username || '-'}</td>
                        <td className="py-2 px-3 font-mono font-bold text-[#1B5558]">{a.password || '-'}</td>
                        <td className="py-2 px-3 capitalize text-slate-500">{a.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setGeneratedAccounts(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handlePrintCards}
                  className="px-5 py-2 rounded-lg bg-[#1B5558] hover:bg-[#143F41] text-white font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Lembar Kartu Akun</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
