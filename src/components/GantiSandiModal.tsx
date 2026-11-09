import React, { useState } from 'react';
import { db } from '../lib/storage';
import { KeyRound, AlertCircle, CheckCircle2, X } from 'lucide-react';

interface GantiSandiModalProps {
  wajib?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const GantiSandiModal: React.FC<GantiSandiModalProps> = ({ wajib, onClose, onSuccess }) => {
  const [lama, setLama] = useState('');
  const [baru, setBaru] = useState('');
  const [ulang, setUlang] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (baru.length < 6) {
      setError('Kata sandi baru minimal 6 karakter.');
      return;
    }
    if (baru !== ulang) {
      setError('Konfirmasi kata sandi baru tidak sama.');
      return;
    }

    setLoading(true);
    try {
      await db.api('gantiSandi', 'Penilaian', { lama, baru });
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Gagal mengganti kata sandi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#1B5558] flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Ganti Kata Sandi</h3>
              {wajib && <p className="text-[11px] text-amber-700 font-medium">Wajib diubah pada login pertama demi keamanan.</p>}
            </div>
          </div>
          {!wajib && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="pwd_lama">
              Kata Sandi Lama
            </label>
            <input
              id="pwd_lama"
              type="password"
              required
              value={lama}
              onChange={(e) => setLama(e.target.value)}
              placeholder="Masukkan kata sandi saat ini"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5558]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="pwd_baru">
              Kata Sandi Baru (Minimal 6 Karakter)
            </label>
            <input
              id="pwd_baru"
              type="password"
              required
              minLength={6}
              value={baru}
              onChange={(e) => setBaru(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5558]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="pwd_ulang">
              Ulangi Kata Sandi Baru
            </label>
            <input
              id="pwd_ulang"
              type="password"
              required
              value={ulang}
              onChange={(e) => setUlang(e.target.value)}
              placeholder="Ketik ulang kata sandi baru"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5558]"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            {!wajib && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-[#1B5558] hover:bg-[#143F41] text-white text-xs font-semibold transition cursor-pointer disabled:opacity-60"
            >
              {loading ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
