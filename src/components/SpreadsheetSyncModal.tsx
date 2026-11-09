import React, { useState } from 'react';
import { db } from '../lib/storage';
import { Database, Copy, Check, Download, Upload, ExternalLink, HelpCircle, X, RefreshCw } from 'lucide-react';

interface SpreadsheetSyncModalProps {
  onClose: () => void;
  onRefreshData: () => void;
}

export const SpreadsheetSyncModal: React.FC<SpreadsheetSyncModalProps> = ({ onClose, onRefreshData }) => {
  const [url, setUrl] = useState(db.getAppsScriptUrl());
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [showCode, setShowCode] = useState(false);

  const handleSaveUrl = () => {
    db.setAppsScriptUrl(url);
    setStatusMsg('Pengaturan URL Google Apps Script tersimpan.');
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const handleExport = () => {
    const json = db.exportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const u = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = u;
    a.download = `SADIGA_Database_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(u);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content && db.importBackup(content)) {
        setStatusMsg('Database berhasil dipulihkan dari file JSON!');
        onRefreshData();
      } else {
        setStatusMsg('Gagal memulihkan: Format file backup tidak valid.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = () => {
    if (confirm('Kembalikan database ke data bawaan awal Granada? Data baru akan direset.')) {
      db.resetDatabase();
      setStatusMsg('Database direset ke bawaan demo.');
      onRefreshData();
    }
  };

  const sampleAppsScriptCode = `/**
 * SADIGA - Sistem Administrasi Digital Granada
 * Code.gs (script terikat ke Google Spreadsheet: Extensions > Apps Script)
 * Jalankan fungsi setup() sekali, lalu Deploy > New deployment > Web app.
 */
const SALT = 'SADIGA';
const SCHEMA = {
  Pengguna:  ['id','username','nama','role','hash','peran','siswa','wajib_ganti'],
  Siswa:     ['id','nis','nama','kelas','nisn','kamar'],
  Presensi:  ['id','tanggal','kelas','siswa','status','catatan','oleh','mapel'],
  Penilaian: ['id','tanggal','kelas','siswa','mapel','jenis','nilai','catatan','oleh','tp'],
  Perilaku:  ['id','tanggal','kelas','siswa','jenis','kejadian','poin','tindak_lanjut','oleh','aspek'],
  Ujian:     ['id','tanggal','kelas','mapel','jenis','ruang','pengawas','hadir','catatan','oleh','foto'],
  JenisNilai:['id','mapel','nama','kategori'],
  Mapel:     ['id','nama','kelompok'],
  TP:        ['id','mapel','tingkat','lingkup','deskripsi','oleh'],
  Pengaturan:['id','kunci','nilai'],
  Kelas:     ['id','nama','wali','nipy','target_ziyadah','wali_user','rapor_terbit'],
  Pengampu:  ['id','username','kelas','mapel'],
  Wali:      ['id','periode','kelas','siswa','sakit','izin','alfa','catatan','oleh'],
  Kegiatan:  ['id','periode','kelas','siswa','jenis','kegiatan','nilai','keterangan','oleh'],
  NilaiPondok:['id','periode','kelas','siswa','kategori','subjek','predikat','deskripsi','sumber','oleh'],
  ItemMutabaah:['id','nama','kelompok','urut'],
  Mutabaah:  ['id','tanggal','kelas','siswa','selesai','oleh'],
  MI:        ['id','periode','kelas','siswa','kecerdasan','sumber','skor','catatan','oleh'],
  PetaMI:    ['id','sumber','nama','kecerdasan'],
  Setoran:   ['id','tanggal','kelas','siswa','jenis','surat','dari','sampai','materi','kualitas','catatan','oleh'],
  Piket:     ['id','tanggal','kegiatan','kamar','musyrif','catatan','foto','rekap','oleh'],
  PiketAbsen:['id','piket','siswa','status','keterangan'],
  KegiatanPiket:['id','nama'],
  SoalMI:    ['id','kecerdasan','pernyataan'],
  KuesionerMI:['id','periode','kelas','siswa','tanggal','jawaban','oleh']
};
// ... fungsi setup(), read_(), api(), rekap_(), draftPondok_() dll.`;

  const copyScriptCode = () => {
    navigator.clipboard.writeText(sampleAppsScriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#1B5558] flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Integrasi Google Spreadsheet &amp; Database</h3>
              <p className="text-[11px] text-slate-500 font-medium">Hubungkan ke Google Apps Script Web App atau gunakan penyimpanan lokal</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700">
          {statusMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{statusMsg}</span>
            </div>
          )}

          {/* Section 1: Connect to Deployed Apps Script */}
          <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/70">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-[#1B5558]" />
                URL Web App Google Apps Script
              </label>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${url ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                {url ? 'Terkoneksi ke Cloud' : 'Mode Mandiri (Lokal)'}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Bila Anda sudah mendeploy script <code className="bg-slate-200 px-1 py-0.5 rounded text-[#1B5558] font-mono">Code.gs</code> di Google Spreadsheet sebagai Web App, masukkan URL deployment Anda di bawah ini:
            </p>

            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5558]"
              />
              <button
                type="button"
                onClick={handleSaveUrl}
                className="px-4 py-2 rounded-lg bg-[#1B5558] hover:bg-[#143F41] text-white text-xs font-semibold cursor-pointer transition"
              >
                Simpan
              </button>
            </div>
          </div>

          {/* Section 2: Instructions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-[#1B5558]" />
              Panduan Menghubungkan Google Spreadsheet
            </h4>
            <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1.5 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200">
              <li>Buat Google Spreadsheet baru di Google Drive Anda.</li>
              <li>Klik menu <b>Extensions (Ekstensi) &gt; Apps Script</b>.</li>
              <li>Hapus kode bawaan dan tempel kode <code className="font-mono text-[#1B5558]">Code.gs</code> SADIGA.</li>
              <li>Jalankan fungsi <code className="font-mono font-bold text-emerald-800">setup()</code> satu kali untuk membuat otomatis 24 sheets, header kolom, dan akun admin default.</li>
              <li>Klik <b>Deploy &gt; New deployment &gt; Web app</b>.</li>
              <li>Atur <i>Execute as: Me</i> dan <i>Who has access: Anyone</i>.</li>
              <li>Salin URL Web App yang dihasilkan lalu tempel ke kolom di atas.</li>
            </ol>
          </div>

          {/* Section 3: Backup & Restore */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-[#1B5558]" />
              Cadangkan &amp; Pulihkan Data (JSON Backup)
            </h4>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#1B5558]" />
                Unduh Cadangan Database (.json)
              </button>

              <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-[#1B5558]" />
                <span>Pulihkan dari File (.json)</span>
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset Data Demo
              </button>
            </div>
          </div>

          {/* Section 4: Code.gs Snippet Toggle */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowCode(!showCode)}
              className="text-xs font-bold text-[#1B5558] hover:underline cursor-pointer flex items-center gap-1"
            >
              {showCode ? 'Sembunyikan Cuplikan Code.gs' : 'Tampilkan Cuplikan Kode Code.gs'}
            </button>

            {showCode && (
              <div className="mt-2 relative">
                <button
                  type="button"
                  onClick={copyScriptCode}
                  className="absolute top-2 right-2 px-2.5 py-1 rounded bg-slate-800 text-white text-[10px] font-semibold flex items-center gap-1 hover:bg-slate-700 transition"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Tersalin' : 'Salin Kode'}</span>
                </button>
                <pre className="p-3 bg-slate-900 text-emerald-300 text-[11px] rounded-lg font-mono overflow-x-auto max-h-48 leading-relaxed">
                  {sampleAppsScriptCode}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#1B5558] hover:bg-[#143F41] text-white text-xs font-semibold cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
