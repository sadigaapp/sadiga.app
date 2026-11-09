import React, { useState, useEffect } from 'react';
import { db } from '../lib/storage';
import { Siswa, Mapel, TP, ST } from '../types';
import { X, Check, Calendar, BookOpen, GraduationCap, CheckCircle2 } from 'lucide-react';

interface BulkPresensiPenilaianModalProps {
  mod: 'Presensi' | 'Penilaian';
  onClose: () => void;
  onSuccess: (count: number) => void;
}

export const BulkPresensiPenilaianModal: React.FC<BulkPresensiPenilaianModalProps> = ({
  mod,
  onClose,
  onSuccess
}) => {
  const isPenilaian = mod === 'Penilaian';
  const today = new Date().toISOString().slice(0, 10);

  const [tanggal, setTanggal] = useState(today);
  const [kelas, setKelas] = useState('');
  const [mapel, setMapel] = useState('');
  const [tpId, setTpId] = useState('');
  const [jenis, setJenis] = useState(isPenilaian ? 'Tugas Harian' : '');

  const [allSiswa, setAllSiswa] = useState<Siswa[]>([]);
  const [allMapel, setAllMapel] = useState<Mapel[]>([]);
  const [allTp, setAllTp] = useState<TP[]>([]);
  const [kelasList, setKelasList] = useState<string[]>([]);
  const [jenisList, setJenisList] = useState<string[]>(['Tugas Harian', 'Ulangan Harian', 'UTS', 'UAS', 'Praktik']);

  // Rows state: studentName -> { val, catatan }
  const [entries, setEntries] = useState<Record<string, { val: string; catatan: string }>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const s = db.list('Siswa');
    const m = db.list('Mapel');
    const t = db.list('TP');
    setAllSiswa(s);
    setAllMapel(m);
    setAllTp(t);

    const kList = [...new Set(s.map(x => x.kelas).filter(Boolean))].sort();
    setKelasList(kList);
    if (kList.length > 0) setKelas(kList[0]);
    if (m.length > 0) setMapel(m[0].nama);
  }, []);

  // Update filtered students and reset entries
  const currentStudents = allSiswa.filter(s => s.kelas === kelas);

  useEffect(() => {
    const initial: Record<string, { val: string; catatan: string }> = {};
    currentStudents.forEach(s => {
      initial[s.nama] = {
        val: isPenilaian ? '' : 'Hadir',
        catatan: ''
      };
    });
    setEntries(initial);
  }, [kelas, mod]);

  // Filter TPs based on selected mapel and class level
  const tingkatKelas = String(kelas || '').trim().split(/[\s\-_.]+/)[0];
  const filteredTps = allTp.filter(t => t.mapel === mapel && t.tingkat === tingkatKelas);

  // Update Jenis based on selected mapel
  useEffect(() => {
    const jn = db.list('JenisNilai').filter((j: any) => j.mapel === mapel).map((j: any) => j.nama);
    if (jn.length > 0) {
      setJenisList(jn);
      setJenis(jn[0]);
    } else {
      setJenisList(['Tugas Harian', 'Ulangan Harian', 'UTS', 'UAS', 'Praktik']);
      setJenis('Tugas Harian');
    }
  }, [mapel]);

  const handleUpdateEntry = (nama: string, field: 'val' | 'catatan', value: string) => {
    setEntries(prev => ({
      ...prev,
      [nama]: {
        ...prev[nama],
        [field]: value
      }
    }));
  };

  const handleSetAllHadir = () => {
    setEntries(prev => {
      const next = { ...prev };
      currentStudents.forEach(s => {
        next[s.nama] = { ...next[s.nama], val: 'Hadir' };
      });
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!kelas || !mapel) {
      setError('Pilih kelas dan mata pelajaran.');
      return;
    }

    const items: any[] = [];
    currentStudents.forEach(s => {
      const entry = entries[s.nama];
      if (!entry) return;

      if (isPenilaian) {
        if (entry.val.trim() !== '') {
          items.push({
            tanggal,
            kelas,
            mapel,
            siswa: s.nama,
            jenis,
            tp: tpId || '',
            nilai: entry.val.trim(),
            catatan: entry.catatan || ''
          });
        }
      } else {
        items.push({
          tanggal,
          kelas,
          mapel,
          siswa: s.nama,
          status: entry.val || 'Hadir',
          catatan: entry.catatan || ''
        });
      }
    });

    if (items.length === 0) {
      setError(isPenilaian ? 'Isi nilai minimal untuk satu santri.' : 'Daftar santri kosong.');
      return;
    }

    setLoading(true);
    try {
      const count = await db.api('saveMany', mod, items);
      onSuccess(count);
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-h-[94vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              {isPenilaian ? 'Input Cepat Penilaian Per Kelas' : 'Input Presensi Massal Per Kelas'}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              {isPenilaian ? 'Catat nilai harian, ulangan, atau ujian seluruh siswa sekaligus' : 'Catat kehadiran seluruh santri dalam satu pertemuan'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Form Controls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Tanggal</label>
              <input
                type="date"
                required
                value={tanggal}
                onChange={e => setTanggal(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5558]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Kelas</label>
              <select
                required
                value={kelas}
                onChange={e => setKelas(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5558]"
              >
                {kelasList.map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Mata Pelajaran</label>
              <select
                required
                value={mapel}
                onChange={e => setMapel(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5558]"
              >
                {allMapel.map(m => (
                  <option key={m.nama} value={m.nama}>{m.nama}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Additional fields for Penilaian */}
          {isPenilaian && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Jenis Penilaian</label>
                <select
                  value={jenis}
                  onChange={e => setJenis(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5558]"
                >
                  {jenisList.map(j => (
                    <option key={j} value={j}>{j}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Tujuan Pembelajaran (TP)</label>
                <select
                  value={tpId}
                  onChange={e => setTpId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5558]"
                >
                  <option value="">- Tanpa TP (Umum) -</option>
                  {filteredTps.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.lingkup}: {t.deskripsi.slice(0, 50)}...
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Table of Students */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Daftar Santri Kelas {kelas} ({currentStudents.length} santri)
              </span>
              {!isPenilaian && currentStudents.length > 0 && (
                <button
                  type="button"
                  onClick={handleSetAllHadir}
                  className="text-xs text-[#1B5558] hover:underline font-semibold cursor-pointer"
                >
                  Tandai Semua Hadir
                </button>
              )}
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {currentStudents.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Tidak ada data santri pada kelas ini.
                </div>
              ) : (
                currentStudents.map(s => {
                  const entry = entries[s.nama] || { val: isPenilaian ? '' : 'Hadir', catatan: '' };
                  return (
                    <div key={s.id} className="p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white hover:bg-slate-50/60">
                      <div className="min-w-44">
                        <div className="text-xs font-bold text-slate-900">{s.nama}</div>
                        <div className="text-[11px] text-slate-400 font-mono">NISG: {s.nis}</div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto flex-1 sm:justify-end">
                        {isPenilaian ? (
                          <input
                            type="number"
                            step="any"
                            min="0"
                            max="100"
                            placeholder="Nilai (0-100)"
                            value={entry.val}
                            onChange={e => handleUpdateEntry(s.nama, 'val', e.target.value)}
                            className="w-28 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-center focus:outline-none focus:ring-2 focus:ring-[#1B5558]"
                          />
                        ) : (
                          <select
                            value={entry.val}
                            onChange={e => handleUpdateEntry(s.nama, 'val', e.target.value)}
                            className="w-28 px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1B5558]"
                          >
                            {ST.map(status => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        )}

                        <input
                          type="text"
                          placeholder="Catatan opsional..."
                          value={entry.catatan}
                          onChange={e => handleUpdateEntry(s.nama, 'catatan', e.target.value)}
                          className="flex-1 sm:w-48 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#1B5558]"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || currentStudents.length === 0}
              className="px-5 py-2 rounded-lg bg-[#1B5558] hover:bg-[#143F41] text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan Semua Data'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
