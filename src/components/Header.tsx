import React from 'react';
import { UserSession } from '../types';
import { Menu, KeyRound, LogOut, Shield, Database } from 'lucide-react';
import { db } from '../lib/storage';

interface HeaderProps {
  user: UserSession;
  onOpenMobileMenu: () => void;
  onOpenGantiSandi: () => void;
  onOpenSpreadsheetSync: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenMobileMenu,
  onOpenGantiSandi,
  onOpenSpreadsheetSync,
  onLogout
}) => {
  const getRoleLabel = () => {
    const map: Record<string, string> = {
      admin: 'Administrator',
      kepsek: 'Kepala Sekolah',
      guru: 'Guru',
      musyrif: 'Musyrif Asrama',
      santri: 'Orang Tua / Santri'
    };
    const parts = (user.peran || [user.role]).map(r => map[r] || r);
    if (user.wali && user.wali.length > 0) {
      parts.push(`Wali Kelas: ${user.wali.join(', ')}`);
    }
    return parts.join(' • ');
  };

  const isConnectedToGoogle = !!db.getAppsScriptUrl();

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 md:px-6 py-3 flex items-center justify-between gap-4 shadow-xs">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
          aria-label="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900 tracking-tight">{user.nama}</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-[#1B5558] border border-emerald-200">
              {user.role.toUpperCase()}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium truncate max-w-xs md:max-w-md">
            {getRoleLabel()}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Apps Script Connection indicator */}
        <button
          type="button"
          onClick={onOpenSpreadsheetSync}
          title="Status Koneksi Google Spreadsheet"
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
        >
          <Database className={`w-3.5 h-3.5 ${isConnectedToGoogle ? 'text-emerald-600' : 'text-slate-400'}`} />
          <span>{isConnectedToGoogle ? 'Spreadsheet Terhubung' : 'Database Lokal'}</span>
        </button>

        <button
          type="button"
          onClick={onOpenGantiSandi}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#1B5558] transition cursor-pointer"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ganti Sandi</span>
        </button>

        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold transition cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar</span>
        </button>
      </div>
    </header>
  );
};
