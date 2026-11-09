import React, { useState, useEffect } from 'react';
import { db } from '../lib/storage';
import { BedDouble, Save, Check } from 'lucide-react';

export const AturKamarView: React.FC = () => {
  const [kelasList, setKelasList] = useState<string[]>([]);
  const [kelas, setKelas] = useState('');
  const [allSiswa, setAllSiswa] = useState<any[]>([]);
  const [kamarAssignments, setKamarAssignments] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const loadData = () => {
    const s = db.list('Siswa');
    setAllSiswa(s);
    const kList = [...new Set(s.map(x => x.kelas).filter(Boolean))].sort();
    setKelasList(kList);
    if (kList.length > 0 && !kelas) setKelas(kList[0]);

    const dict: Record<string, string> = {};
    s.forEach(item => {
      dict[item.id] = item.kamar || '';
    });
    setKamarAssignments(dict);
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentStudents = allSiswa.filter(s => s.kelas === kelas);
  const existingKamarNames = [...new Set(allSiswa.map(s => s.kamar).filter(Boolean))].sort();

  const handleKamarChange = (studentId: string, value: string) => {
    setKamarAssignments(prev => ({
      ...prev,
      [studentId]: value
    }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setMsg('');
    try {
      const payload = currentStudents.map(s => ({
        id: s.id,
        kamar: kamarAssignments[s.id] || ''
      }));

      const count = db.setKamar({ data: payload });
      loadData();
      setMsg(`Alhamdulillah, ${count} data kamar santri berhasil diperbarui.`);
      setTimeout(() => setMsg(''), 3000);
    } catch (err: any) {
      alert(err?.message || 'Gagal menyimpan kamar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header and Class Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Atur Kamar Asrama Santri</h2>
            <p className="text-xs text-slate-500">
              Pengelompokan kamar asrama untuk piket musyrif harian. Contoh format: "Abu Bakar - 01", "Umar - 02".
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={saving || currentStudents.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1B5558] hover:bg-[#143F41] text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Semua Kamar'}</span>
            </button>
          </div>
        </div>

        {msg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{msg}</span>
          </div>
        )}

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

      {/* Datalist for existing rooms autocomplete */}
      <datalist id="kamar-options">
        {existingKamarNames.map(km => (
          <option key={km} value={km} />
        ))}
      </datalist>

      {/* Student List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#E9F2F2] text-[#1B5558] border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3 w-10 text-center">No</th>
                <th className="py-2.5 px-3 w-56">Nama Santri</th>
                <th className="py-2.5 px-3 w-32 font-mono">NISG</th>
                <th className="py-2.5 px-3">Kamar Asrama</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {currentStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    Tidak ada santri di kelas ini.
                  </td>
                </tr>
              ) : (
                currentStudents.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{s.nama}</td>
                    <td className="py-2.5 px-3 font-mono">{s.nis}</td>
                    <td className="py-2 px-3">
                      <div className="relative max-w-sm">
                        <input
                          type="text"
                          list="kamar-options"
                          placeholder="Ketik atau pilih nama kamar..."
                          value={kamarAssignments[s.id] || ''}
                          onChange={e => handleKamarChange(s.id, e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#1B5558] bg-white font-medium"
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
