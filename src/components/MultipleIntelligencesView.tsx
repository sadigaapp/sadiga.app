import React, { useState, useEffect } from 'react';
import { db } from '../lib/storage';
import { UserSession, MI_LIST, MI_NAMA, MI_SUMBER, PRD } from '../types';
import { Sparkles, HelpCircle, Check, Award, Eye, X } from 'lucide-react';

interface MultipleIntelligencesViewProps {
  user: UserSession;
  mode: 'penilaian' | 'kuesioner';
}

export const MultipleIntelligencesView: React.FC<MultipleIntelligencesViewProps> = ({ user, mode }) => {
  const isKuesioner = mode === 'kuesioner';
  const [kelasList, setKelasList] = useState<string[]>([]);
  const [kelas, setKelas] = useState('');
  const [allSiswa, setAllSiswa] = useState<any[]>([]);
  const [allSoal, setAllSoal] = useState<any[]>([]);
  const [allKuesioner, setAllKuesioner] = useState<any[]>([]);
  const [allMiRows, setAllMiRows] = useState<any[]>([]);

  // Teacher Scoring Modal
  const [isScoringModalOpen, setIsScoringModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [sumber, setSumber] = useState<'Observasi' | 'Kuesioner'>('Observasi');
  const [scores, setScores] = useState<Record<string, string>>({});
  const [catatan, setCatatan] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Questionnaire Modal (Santri test)
  const [isQuestionnaireModalOpen, setIsQuestionnaireModalOpen] = useState(false);
  const [kuesSiswa, setKuesSiswa] = useState<any | null>(null);
  const [jawaban, setJawaban] = useState<Record<string, string>>({});

  const loadData = () => {
    const sList = db.list('Siswa');
    const sqList = db.list('SoalMI');
    const ksList = db.list('KuesionerMI');
    const miList = db.list('MI');

    setAllSiswa(sList);
    setAllSoal(sqList);
    setAllKuesioner(ksList);
    setAllMiRows(miList);

    const kList = [...new Set(sList.map(s => s.kelas).filter(Boolean))].sort();
    setKelasList(kList);
    if (kList.length > 0 && !kelas) setKelas(kList[0]);
  };

  useEffect(() => {
    loadData();
  }, [mode]);

  const currentStudents = allSiswa.filter(s => s.kelas === kelas);

  // Questionnaire randomized/interleaved ordering
  const getInterleavedQuestions = () => {
    const byIntel: Record<string, any[]> = {};
    allSoal.forEach(q => {
      if (!byIntel[q.kecerdasan]) byIntel[q.kecerdasan] = [];
      byIntel[q.kecerdasan].push(q);
    });

    const maxPerIntel = Math.max(...Object.values(byIntel).map(a => a.length), 0);
    const ordered: any[] = [];
    for (let i = 0; i < maxPerIntel; i++) {
      MI_NAMA.forEach(mName => {
        if (byIntel[mName]?.[i]) {
          ordered.push(byIntel[mName][i]);
        }
      });
    }
    return ordered;
  };

  const handleOpenScoring = (studentName?: string) => {
    setSelectedStudent(studentName || (currentStudents[0]?.nama || ''));
    setSumber('Observasi');
    const initial: Record<string, string> = {};
    MI_NAMA.forEach(n => { initial[n] = ''; });
    setScores(initial);
    setCatatan('');
    setError('');
    setIsScoringModalOpen(true);
  };

  const handleSaveScores = async (nextStudent: boolean = false) => {
    if (!kelas || !selectedStudent) {
      setError('Pilih kelas dan santri.');
      return;
    }

    const hasAnyScore = Object.values(scores).some(v => v.trim() !== '');
    if (!hasAnyScore) {
      setError('Isi minimal satu skor kecerdasan (skala 1 - 4).');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await db.saveMI({
        kelas,
        siswa: selectedStudent,
        sumber,
        skor: scores,
        catatan
      });

      if (nextStudent) {
        const idx = currentStudents.findIndex(s => s.nama === selectedStudent);
        if (idx < currentStudents.length - 1) {
          setSelectedStudent(currentStudents[idx + 1].nama);
          const initial: Record<string, string> = {};
          MI_NAMA.forEach(n => { initial[n] = ''; });
          setScores(initial);
          setCatatan('');
          loadData();
        } else {
          setIsScoringModalOpen(false);
          loadData();
          alert('Semua santri di kelas telah dinilai!');
        }
      } else {
        setIsScoringModalOpen(false);
        loadData();
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan skor MI.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenQuestionnaire = (s: any) => {
    setKuesSiswa(s);
    setJawaban({});
    setError('');
    setIsQuestionnaireModalOpen(true);
  };

  const handleSaveQuestionnaire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kuesSiswa) return;

    const answeredCount = Object.keys(jawaban).length;
    if (answeredCount < allSoal.length) {
      setError(`Masih ada ${allSoal.length - answeredCount} butir pernyataan yang belum dijawab.`);
      return;
    }

    setSaving(true);
    setError('');
    try {
      await db.saveKuesioner({
        kelas: kuesSiswa.kelas,
        siswa: kuesSiswa.nama,
        jawaban
      });
      setIsQuestionnaireModalOpen(false);
      loadData();
      alert('Alhamdulillah, seluruh jawaban kuesioner berhasil disimpan dan dikalkulasi.');
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan kuesioner.');
    } finally {
      setSaving(false);
    }
  };

  const interleavedList = getInterleavedQuestions();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {isKuesioner ? 'Kuesioner Multiple Intelligences (Santri)' : 'Penilaian Multiple Intelligences (MI)'}
            </h2>
            <p className="text-xs text-slate-500">
              10 Spektrum Kecerdasan Majemuk Howard Gardner: Linguistik, Logis-Matematis, Visual, Musikal, Kinestetik, Interpersonal, Intrapersonal, Naturalis, Eksistensial, dan Spiritual.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isKuesioner && (
              <button
                type="button"
                onClick={() => handleOpenScoring()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1B5558] hover:bg-[#143F41] text-white text-xs font-semibold transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Input Skor Observasi</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter */}
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

      {/* Main Student List & Status */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#E9F2F2] text-[#1B5558] border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3 w-10 text-center">No</th>
                <th className="py-2.5 px-3 w-48">Nama Santri</th>
                <th className="py-2.5 px-3">Status Observasi Guru</th>
                <th className="py-2.5 px-3">Status Kuesioner Mandiri</th>
                <th className="py-2.5 px-3 w-48 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {currentStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Tidak ada santri di kelas ini.
                  </td>
                </tr>
              ) : (
                currentStudents.map((s, idx) => {
                  const hasObs = allMiRows.some(r => r.siswa === s.nama && r.sumber === 'Observasi');
                  const kuesRec = allKuesioner.find(k => k.siswa === s.nama && k.kelas === s.kelas);

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{s.nama}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          hasObs ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {hasObs ? 'Tercatat' : 'Belum Ada Observasi'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          kuesRec ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {kuesRec ? `Sudah Diisi (${kuesRec.tanggal})` : 'Belum Mengisi'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenScoring(s.nama)}
                          className="px-2.5 py-1 text-xs font-semibold text-[#1B5558] hover:bg-emerald-50 border border-emerald-300 rounded-lg transition cursor-pointer"
                        >
                          Skor Observasi
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenQuestionnaire(s)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-lg transition cursor-pointer"
                        >
                          {kuesRec ? 'Ubah Kuesioner' : 'Isi Kuesioner'}
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

      {/* Teacher Scoring Modal */}
      {isScoringModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-h-[94vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#1B5558]" />
                <h3 className="font-bold text-sm text-slate-900">Penilaian MI Santri: {selectedStudent}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsScoringModalOpen(false)}
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

              <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl text-slate-600 leading-relaxed text-[11px]">
                Beri skor <b>1 s.d. 4</b>:
                <div className="grid grid-cols-2 gap-1 mt-1 font-medium text-[#1B5558]">
                  <span>1 = Belum tampak</span>
                  <span>2 = Mulai berkembang</span>
                  <span>3 = Berkembang sesuai harapan</span>
                  <span>4 = Sangat menonjol</span>
                </div>
              </div>

              <div className="space-y-2.5">
                {MI_LIST.map(([mName, mDesc]) => (
                  <div key={mName} className="p-2.5 bg-slate-50/60 border border-slate-200 rounded-lg flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-bold text-slate-900">{mName}</div>
                      <div className="text-[10px] text-slate-500 line-clamp-1">{mDesc}</div>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="4"
                      placeholder="1 - 4"
                      value={scores[mName] || ''}
                      onChange={e => setScores({ ...scores, [mName]: e.target.value })}
                      className="w-20 px-2 py-1.5 border border-slate-300 rounded-lg text-center font-bold text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5558]"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-bold text-slate-600 uppercase mb-1">Catatan Observasi</label>
                <textarea
                  rows={2}
                  value={catatan}
                  onChange={e => setCatatan(e.target.value)}
                  placeholder="Catatan kelebihan dan bakat khusus ananda..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsScoringModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Batal
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveScores(true)}
                    disabled={saving}
                    className="px-4 py-2 rounded-lg border border-[#1B5558] text-[#1B5558] hover:bg-emerald-50 font-semibold cursor-pointer"
                  >
                    Simpan &amp; Santri Berikutnya
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveScores(false)}
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

      {/* Santri Questionnaire Modal */}
      {isQuestionnaireModalOpen && kuesSiswa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-h-[94vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Kuesioner Kemandirian: {kuesSiswa.nama}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  {interleavedList.length} Butir Pernyataan • Skala 1 (Tidak Sesuai) s/d 4 (Sangat Sesuai)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsQuestionnaireModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestionnaire} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-slate-600">
                <span className="font-bold text-[11px] uppercase tracking-wide">
                  Progres: {Object.keys(jawaban).length} dari {interleavedList.length} Terjawab
                </span>
                <span className="text-[11px] text-[#1B5558] font-semibold">
                  1 = Tidak Sesuai • 2 = Kurang Sesuai • 3 = Sesuai • 4 = Sangat Sesuai
                </span>
              </div>

              <div className="space-y-3">
                {interleavedList.map((q, idx) => {
                  const currentVal = jawaban[q.id];
                  return (
                    <div key={q.id} className="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition space-y-2">
                      <div className="text-slate-800 font-medium leading-relaxed">
                        <span className="font-bold text-[#1B5558] mr-1.5">{idx + 1}.</span>
                        {q.pernyataan}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        {[1, 2, 3, 4].map(v => {
                          const isSel = currentVal === String(v);
                          return (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setJawaban({ ...jawaban, [q.id]: String(v) })}
                              className={`flex-1 py-1.5 rounded-lg border font-bold text-xs transition cursor-pointer text-center ${
                                isSel
                                  ? 'bg-[#1B5558] border-[#1B5558] text-white shadow-xs'
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {v}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsQuestionnaireModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-[#1B5558] hover:bg-[#143F41] text-white font-semibold cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Kirim Seluruh Jawaban'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
