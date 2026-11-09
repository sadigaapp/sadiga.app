import React, { useState, useEffect } from 'react';
import { db } from './lib/storage';
import { UserSession } from './types';
import { LoginView } from './components/LoginView';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { GenericTableView } from './components/GenericTableView';
import { RekapNilaiView } from './components/RekapNilaiView';
import { LegerStatistikView } from './components/LegerStatistikView';
import { PenilaianEkskulView } from './components/PenilaianEkskulView';
import { RaporView } from './components/RaporView';
import { PiketMusyrifView } from './components/PiketMusyrifView';
import { SetoranTahfizhView } from './components/SetoranTahfizhView';
import { MutabaahYaumiyahView } from './components/MutabaahYaumiyahView';
import { MultipleIntelligencesView } from './components/MultipleIntelligencesView';
import { SantriPortalView } from './components/SantriPortalView';
import { AkunSantriView } from './components/AkunSantriView';
import { AturKamarView } from './components/AturKamarView';
import { GantiSandiModal } from './components/GantiSandiModal';
import { SpreadsheetSyncModal } from './components/SpreadsheetSyncModal';
import { BulkPresensiPenilaianModal } from './components/BulkPresensiPenilaianModal';

export default function App() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [currentModule, setCurrentModule] = useState<string>('Presensi');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals
  const [isGantiSandiOpen, setIsGantiSandiOpen] = useState(false);
  const [isSpreadsheetSyncOpen, setIsSpreadsheetSyncOpen] = useState(false);
  const [bulkModalType, setBulkModalType] = useState<'Presensi' | 'Penilaian' | null>(null);

  // Key to force refresh tables when database updates
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const session = db.getSession();
    if (session) {
      setUser(session);
      if (session.role === 'santri') {
        setCurrentModule('MutSaya');
      }
      if (session.wajibGanti) {
        setIsGantiSandiOpen(true);
      }
    }
  }, []);

  const handleLoginSuccess = (newUser: UserSession) => {
    setUser(newUser);
    if (newUser.role === 'santri') {
      setCurrentModule('MutSaya');
    } else {
      setCurrentModule('Presensi');
    }
    if (newUser.wajibGanti) {
      setIsGantiSandiOpen(true);
    }
  };

  const handleLogout = () => {
    db.setSession(null);
    setUser(null);
    setCurrentModule('Presensi');
  };

  if (!user) {
    return <LoginView onSuccess={handleLoginSuccess} />;
  }

  const renderModuleContent = () => {
    switch (currentModule) {
      case 'Rekap':
        return <RekapNilaiView key={`rekap_${refreshKey}`} />;
      case 'Leger':
        return <LegerStatistikView key={`leger_${refreshKey}`} />;
      case 'Ekskul':
        return <PenilaianEkskulView key={`ekskul_${refreshKey}`} user={user} />;
      case 'Rapor':
        return <RaporView key={`rapor_ak_${refreshKey}`} tipe="akademik" user={user} />;
      case 'RaporPondok':
        return <RaporView key={`rapor_pd_${refreshKey}`} tipe="pondok" user={user} />;
      case 'Piket':
        return <PiketMusyrifView key={`piket_${refreshKey}`} user={user} />;
      case 'Setoran':
        return <SetoranTahfizhView key={`setoran_${refreshKey}`} user={user} />;
      case 'Mutabaah':
        return <MutabaahYaumiyahView key={`mutabaah_${refreshKey}`} user={user} />;
      case 'MI':
        return <MultipleIntelligencesView key={`mi_${refreshKey}`} user={user} mode="penilaian" />;
      case 'Kuesioner':
        return <MultipleIntelligencesView key={`kues_${refreshKey}`} user={user} mode="kuesioner" />;
      case 'MutSaya':
        return <SantriPortalView key={`mut_saya_${refreshKey}`} user={user} view="mutabaah" />;
      case 'RaporSaya':
        return <SantriPortalView key={`rapor_saya_${refreshKey}`} user={user} view="rapor" />;
      case 'AkunSantri':
        return <AkunSantriView key={`akun_${refreshKey}`} />;
      case 'Kamar':
        return <AturKamarView key={`kamar_${refreshKey}`} />;
      default:
        return (
          <GenericTableView
            key={`${currentModule}_${refreshKey}`}
            mod={currentModule}
            user={user}
            onOpenBulkModal={
              currentModule === 'Presensi' || currentModule === 'Penilaian'
                ? () => setBulkModalType(currentModule as any)
                : undefined
            }
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* Sidebar Navigation */}
      <Sidebar
        currentModule={currentModule}
        onSelectModule={setCurrentModule}
        user={user}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onOpenSpreadsheetSync={() => setIsSpreadsheetSyncOpen(true)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-68 flex flex-col min-h-screen transition-all">
        {/* Top Header */}
        <Header
          user={user}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenGantiSandi={() => setIsGantiSandiOpen(true)}
          onOpenSpreadsheetSync={() => setIsSpreadsheetSyncOpen(true)}
          onLogout={handleLogout}
        />

        {/* Page Body */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderModuleContent()}
        </main>
      </div>

      {/* Ganti Sandi Modal */}
      {isGantiSandiOpen && (
        <GantiSandiModal
          wajib={user.wajibGanti}
          onClose={() => setIsGantiSandiOpen(false)}
          onSuccess={() => {
            setIsGantiSandiOpen(false);
            if (user) {
              const updated = { ...user, wajibGanti: false };
              setUser(updated);
              db.setSession(updated);
            }
            alert('Kata sandi berhasil diperbarui.');
          }}
        />
      )}

      {/* Spreadsheet & Database Sync Modal */}
      {isSpreadsheetSyncOpen && (
        <SpreadsheetSyncModal
          onClose={() => setIsSpreadsheetSyncOpen(false)}
          onRefreshData={() => setRefreshKey(k => k + 1)}
        />
      )}

      {/* Bulk Presensi / Penilaian Input Modal */}
      {bulkModalType && (
        <BulkPresensiPenilaianModal
          mod={bulkModalType}
          onClose={() => setBulkModalType(null)}
          onSuccess={(count) => {
            setBulkModalType(null);
            setRefreshKey(k => k + 1);
            alert(`Alhamdulillah, ${count} data berhasil disimpan secara massal.`);
          }}
        />
      )}
    </div>
  );
}
