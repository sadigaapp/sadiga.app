import React, { useState } from 'react';
import { db } from '../lib/storage';
import { UserSession } from '../types';
import { User, AlertCircle, KeyRound } from 'lucide-react';

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

  return (
    <div className="min-h-screen flex flex-col md:grid md:grid-cols-12 bg-white text-slate-800 font-sans">
      {/* Hero Left Section */}
      <div className="md:col-span-6 lg:col-span-7 bg-[#1B5558] text-white p-8 md:p-14 lg:p-20 flex flex-col justify-between relative overflow-hidden min-h-[350px] md:min-h-screen">
        {/* Decorative background circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-400/10 rounded-full blur-2xl -ml-16 -mb-16 pointer-events-none" />

        {/* Top Spacer */}
        <div className="hidden md:block"></div>

        {/* Brand Container - Rata Kiri Sejajar & Spasi Huruf Alami */}
        <div className="relative z-10 text-left my-auto py-6">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-normal text-white drop-shadow-sm">
            SADIGA
          </h1>
          <p className="mt-2 md:mt-4 text-base md:text-xl lg:text-2xl text-emerald-100/90 font-normal tracking-normal max-w-2xl">
            Sistem Administrasi Digital Granada
          </p>
        </div>

        {/* Footer info di bawah */}
        <div className="relative z-10 text-xs text-emerald-200/60 flex items-center justify-between">
          <span>&copy; {new Date().getFullYear()} Granada 2 Islamic Heritage School</span>
          <span className="font-mono">SADIGA v.2.0</span>
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
        </div>
      </div>
    </div>
  );
};
