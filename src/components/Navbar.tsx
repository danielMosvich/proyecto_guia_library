import React, { useState, useEffect } from 'react';
import { PackageCheck, Wifi, WifiOff, Download, ChevronLeft } from 'lucide-react';

interface NavbarProps {
  onBack?: () => void;
  title?: string;
  subtitle?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onBack, title, subtitle }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setCanInstall(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <header className="bg-white/90 backdrop-blur-md text-[#1C1C1E] border-b border-[#E5E5EA] sticky top-0 z-40 select-none">
      <div className="max-w-2xl mx-auto px-3.5 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {onBack ? (
            <button
              onClick={onBack}
              aria-label="Volver a recepciones"
              className="p-1 -ml-1 text-[#007AFF] hover:bg-slate-100 active:bg-slate-200 rounded-xl transition-colors flex items-center gap-0.5 min-w-[36px] min-h-[36px] font-medium"
            >
              <ChevronLeft className="w-5 h-5 -mr-1" />
              <span className="text-xs font-semibold hidden xs:inline">Atrás</span>
            </button>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-[#007AFF] flex items-center justify-center shadow-xs shrink-0 text-white">
              <PackageCheck className="w-4 h-4" />
            </div>
          )}

          <div className="min-w-0">
            <h1 className="text-sm font-bold text-[#1C1C1E] truncate leading-tight">
              {title || 'Recepción Almacén SUNAT'}
            </h1>
            <p className="text-[11px] text-[#8E8E93] truncate leading-tight">
              {subtitle || 'Guías & Facturas · Offline 100%'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {canInstall && (
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-[#007AFF] hover:bg-[#0066D6] active:scale-95 text-white rounded-full shadow-xs transition-transform"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instalar</span>
            </button>
          )}

          <div
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
              isOnline
                ? 'bg-[#EBF9EE] text-[#34C759] border-[#D1F2D9]'
                : 'bg-[#FFF4E5] text-[#FF9500] border-[#FFE2BF] animate-pulse'
            }`}
            title={isOnline ? 'Conexión activa' : 'Modo Offline - Guardando en IndexedDB'}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3 h-3" />
                <span className="hidden xs:inline">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3" />
                <span>Offline</span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
