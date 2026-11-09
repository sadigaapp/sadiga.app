import React, { useState } from 'react';
import { UserSession } from '../types';
import {
  CalendarCheck,
  GraduationCap,
  FileSpreadsheet,
  Users,
  Award,
  BookMarked,
  ShieldCheck,
  CheckSquare,
  BedDouble,
  Sliders,
  Database,
  Key,
  HelpCircle,
  FileText,
  UserCheck,
  ChevronDown,
  Layers,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  currentModule: string;
  onSelectModule: (mod: string) => void;
  user: UserSession;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenSpreadsheetSync: () => void;
}

interface MenuDef {
  key: string;
  label: string;
  icon: any;
  group: 'Akademik' | 'Kesiswaan' | 'Rapor' | 'Santri' | 'Data Induk';
  musyrifOnly?: boolean;
  adminOnly?: boolean;
  waliOnly?: boolean;
}

const MENU_ITEMS: MenuDef[] = [
  // Akademik
  { key: 'Presensi', label: 'Presensi', icon: CalendarCheck, group: 'Akademik' },
  { key: 'Penilaian', label: 'Log Penilaian', icon: CheckSquare, group: 'Akademik' },
  { key: 'Ujian', label: 'Log Ujian', icon: FileText, group: 'Akademik' },
  { key: 'TP', label: 'Tujuan Pembelajaran', icon: Layers, group: 'Akademik' },
  { key: 'Rekap', label: 'Rekap Nilai Akhir', icon: FileSpreadsheet, group: 'Akademik' },
  { key: 'Leger', label: 'Leger & Statistik Kelas', icon: FileSpreadsheet, group: 'Akademik' },

  // Kesiswaan
  { key: 'Perilaku', label: 'Log Perilaku', icon: ShieldCheck, group: 'Kesiswaan' },
  { key: 'Mutabaah', label: "Mutaba'ah Yaumiyah", icon: CheckSquare, group: 'Kesiswaan' },
  { key: 'Piket', label: 'Piket Musyrif', icon: BedDouble, group: 'Kesiswaan', musyrifOnly: true },
  { key: 'Setoran', label: 'Tahsin & Tahfizh', icon: BookMarked, group: 'Kesiswaan' },
  { key: 'Ekskul', label: 'Penilaian Ekskul', icon: Award, group: 'Kesiswaan' },

  // Rapor
  { key: 'Rapor', label: 'Rapor Akademik', icon: Award, group: 'Rapor' },
  { key: 'RaporPondok', label: 'Rapor Pondok', icon: Award, group: 'Rapor' },
  { key: 'NilaiPondok', label: 'Editor Rapor Pondok', icon: FileSpreadsheet, group: 'Rapor', waliOnly: true },
  { key: 'Wali', label: 'Data Wali Kelas', icon: UserCheck, group: 'Rapor', waliOnly: true },
  { key: 'Kegiatan', label: 'Ekskul & Prestasi', icon: Award, group: 'Rapor' },
  { key: 'MI', label: 'Penilaian MI', icon: Sparkles, group: 'Rapor' },
  { key: 'Kuesioner', label: 'Kuesioner MI', icon: HelpCircle, group: 'Rapor' },

  // Santri
  { key: 'MutSaya', label: "Mutaba'ah Saya", icon: CheckSquare, group: 'Santri' },
  { key: 'RaporSaya', label: 'Rapor Saya', icon: Award, group: 'Santri' },

  // Data Induk
  { key: 'Siswa', label: 'Data Siswa', icon: Users, group: 'Data Induk', adminOnly: true },
  { key: 'Kelas', label: 'Data Kelas', icon: GraduationCap, group: 'Data Induk', adminOnly: true },
  { key: 'Mapel', label: 'Mata Pelajaran', icon: BookMarked, group: 'Data Induk', adminOnly: true },
  { key: 'JenisNilai', label: 'Jenis Penilaian', icon: Sliders, group: 'Data Induk', adminOnly: true },
  { key: 'ItemMutabaah', label: "Item Mutaba'ah", icon: CheckSquare, group: 'Data Induk', adminOnly: true },
  { key: 'KegiatanPiket', label: 'Kegiatan Piket', icon: BedDouble, group: 'Data Induk', adminOnly: true },
  { key: 'SoalMI', label: 'Butir Kuesioner MI', icon: HelpCircle, group: 'Data Induk', adminOnly: true },
  { key: 'PetaMI', label: 'Peta Kecerdasan (MI)', icon: Sparkles, group: 'Data Induk', adminOnly: true },
  { key: 'Kamar', label: 'Atur Kamar Asrama', icon: BedDouble, group: 'Data Induk', adminOnly: true },
  { key: 'AkunSantri', label: 'Akun Santri & Orang Tua', icon: Key, group: 'Data Induk', adminOnly: true },
  { key: 'Pengampu', label: 'Pengampu Mapel', icon: Users, group: 'Data Induk', adminOnly: true },
  { key: 'Pengguna', label: 'Pengguna', icon: Users, group: 'Data Induk', adminOnly: true },
  { key: 'Pengaturan', label: 'Pengaturan Sistem', icon: Sliders, group: 'Data Induk', adminOnly: true }
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentModule,
  onSelectModule,
  user,
  mobileOpen,
  onCloseMobile,
  onOpenSpreadsheetSync
}) => {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (grp: string) => {
    setCollapsedGroups(prev => ({ ...prev, [grp]: !prev[grp] }));
  };

  const userRoles = Array.isArray(user.peran) ? user.peran : [user.role];
  const isAdmin = userRoles.includes('admin');
  const isMudir = userRoles.includes('mudir');
  const isKepsek = userRoles.includes('kepsek');
  const isMusyrif = userRoles.includes('musyrif');
  const isWali = (user.wali || []).length > 0;
  const isSantri = user.role === 'santri';

  const isVisible = (item: MenuDef) => {
    if (isSantri) {
      return item.group === 'Santri';
    }
    if (item.group === 'Santri') {
      return false;
    }
    // Khusus menu Piket Musyrif hanya untuk Musyrif, Admin, dan Mudir
    if (item.musyrifOnly) {
      return isMusyrif || isAdmin || isMudir;
    }
    // Menu Data Induk dapat dilihat oleh Admin dan Mudir
    if (item.adminOnly) {
      return isAdmin || isMudir;
    }
    if (item.waliOnly) {
      return isAdmin || isMudir || isWali;
    }
    if (item.key === 'Rapor' || item.key === 'RaporPondok') {
      return isAdmin || isMudir || isKepsek || isWali;
    }
    return true;
  };

  const visibleItems = MENU_ITEMS.filter(isVisible);

  // Group items
  const groups: Record<string, MenuDef[]> = {};
  visibleItems.forEach(item => {
    if (!groups[item.group]) groups[item.group] = [];
    groups[item.group].push(item);
  });

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-68 bg-[#1B5558] text-white z-40 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-emerald-800/60">
          <div className="font-extrabold text-lg tracking-wider text-white">SADIGA</div>
          <div className="text-[11px] text-emerald-200/80 font-medium leading-tight mt-0.5">
            Sistem Administrasi Digital Granada
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 custom-scrollbar">
          {Object.entries(groups).map(([grp, items]) => {
            const isCollapsed = !!collapsedGroups[grp];
            return (
              <div key={grp} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(grp)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-200/70 hover:text-white transition-colors cursor-pointer"
                >
                  <span>{grp}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-150 ${
                      isCollapsed ? '-rotate-90' : 'rotate-0'
                    }`}
                  />
                </button>

                {!isCollapsed && (
                  <div className="space-y-0.5">
                    {items.map(item => {
                      const Icon = item.icon;
                      const active = currentModule === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => {
                            onSelectModule(item.key);
                            onCloseMobile();
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-left ${
                            active
                              ? 'bg-white text-[#1B5558] shadow-sm'
                              : 'text-emerald-100/90 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#1B5558]' : 'text-emerald-300'}`} />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Integrasi Apps Script Footer Link */}
        <div className="p-3 border-t border-emerald-800/60 bg-[#143F41]/60">
          <button
            type="button"
            onClick={onOpenSpreadsheetSync}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-emerald-100 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <Database className="w-4 h-4 text-emerald-300" />
            <div className="flex-1 text-left">
              <span className="block font-semibold">Database &amp; Apps Script</span>
              <span className="block text-[10px] text-emerald-300/80">Google Spreadsheet API</span>
            </div>
          </button>
        </div>
      </aside>
    </>
  );
};
