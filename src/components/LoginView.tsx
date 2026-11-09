import React, { useState } from 'react';
import { db } from '../lib/storage';
import { UserSession } from '../types';
import { Shield, BookOpen, User, CheckCircle2, AlertCircle, KeyRound, Sparkles } from 'lucide-react';

interface LoginViewProps {
  onSuccess: (user: UserSession) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await db.login(username, password);
      if (res.ok && res.user) {
        onSuccess(res.user);
      } else {
        setError(res.msg || 'Username atau kata sandi tidak sesuai.');
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal terhubung ke sistem.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen flex flex-col md:grid md:grid-cols-12 bg-white text-slate-800 font-sans">
      {/* Hero Left Section */}
      <div className="md:col-span-6 lg:col-span-7 bg-[#1B5558] text-white p-8 md:p-14 lg:p-20 flex flex-col justify-between relative overflow-hidden">
        {/* Decorative background Islamic geometry / circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-400/10 rounded-full blur-2xl -ml-16 -mb-16 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center font-extrabold text-2xl text-emerald-200 border border-white/20">
              S
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-wider">SADIGA</span>
              <span className="block text-xs text-emerald-200/80 font-medium">Sistem Administrasi Digital Granada</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 my-10 md:my-auto max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold backdrop-blur mb-6 border border-white/10">
            <Sparkles className="w-3.5 h-3.5" />
            Integrasi Google Spreadsheet &amp; Apps Script Web App
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight text-white mb-5">
            Manajemen Akademik, Karakter &amp; Asrama Pesantren Terpadu
          </h1>
          <p className="text-emerald-100/85 text-sm md:text-base leading-relaxed">
            Presensi mapel, log penilaian kurikulum dengan deskripsi TP otomatis, mutaba'ah yaumiyah, setoran tahsin-tahfizh, piket musyrif kamar, multiple intelligences, hingga cetak rapor F4 resmi.
          </p>

          <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-white/15 text-xs text-emerald-100/90">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
              <span>Rapor Kurikulum Merdeka &amp; Rapor Pondok format F4 (Folio)</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
              <span>Portal Mandiri Orang Tua &amp; Santri dengan Kartu Akun Cetak</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-emerald-200/60 flex items-center justify-between">
          <span>&copy; {new Date().getFullYear()} Granada Islamic Boarding School</span>
          <span className="font-mono">v1.2.0 • Standalone &amp; Cloud Apps Script</span>
        </div>
      </div>

      {/* Login Box Right Section */}
      <div className="md:col-span-6 lg:col-span-5 flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-16 bg-slate-50/50">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Assalamu'alaikum</h2>
            <p className="text-slate-500 text-sm mt-1">
              Silakan masuk dengan akun guru, musyrif, kepala sekolah, atau santri/wali santri.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5" htmlFor="login_u">
                Username / NISG
              </label>
              <div className="relative">
                <input
                  id="login_u"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: admin atau 26001"
                  className="w-full px-3.5 py-2.5 pl-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5558] focus:border-transparent bg-white text-sm"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5" htmlFor="login_p">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  id="login_p"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="w-full px-3.5 py-2.5 pl-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5558] focus:border-transparent bg-white text-sm"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-[#1B5558] hover:bg-[#143F41] active:bg-[#0f2e30] text-white font-semibold text-sm transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? 'Memverifikasi...' : 'Masuk ke Sistem'}
            </button>
          </form>

          {/* Quick Demo Credentials helper */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              Akun Demonstrasi Cepat (Klik untuk Mengisi):
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="p-2 rounded-lg border border-slate-200 bg-white hover:border-[#1B5558] hover:bg-emerald-50/40 text-left transition text-slate-700 flex flex-col"
              >
                <b className="text-slate-900 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-[#1B5558]" /> Admin
                </b>
                <span className="text-[11px] text-slate-500">admin / admin123</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('ustadz.ahmad', 'guru123')}
                className="p-2 rounded-lg border border-slate-200 bg-white hover:border-[#1B5558] hover:bg-emerald-50/40 text-left transition text-slate-700 flex flex-col"
              >
                <b className="text-slate-900 flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-[#1B5558]" /> Guru &amp; Wali 7A
                </b>
                <span className="text-[11px] text-slate-500">ustadz.ahmad / guru123</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('musyrif.zaid', 'musyrif123')}
                className="p-2 rounded-lg border border-slate-200 bg-white hover:border-[#1B5558] hover:bg-emerald-50/40 text-left transition text-slate-700 flex flex-col"
              >
                <b className="text-slate-900 flex items-center gap-1">
                  <User className="w-3 h-3 text-[#1B5558]" /> Musyrif Asrama
                </b>
                <span className="text-[11px] text-slate-500">musyrif.zaid / musyrif123</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('26001', 'santri123')}
                className="p-2 rounded-lg border border-slate-200 bg-white hover:border-[#1B5558] hover:bg-emerald-50/40 text-left transition text-slate-700 flex flex-col"
              >
                <b className="text-slate-900 flex items-center gap-1">
                  <User className="w-3 h-3 text-[#1B5558]" /> Santri / Orang Tua
                </b>
                <span className="text-[11px] text-slate-500">26001 / santri123</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
