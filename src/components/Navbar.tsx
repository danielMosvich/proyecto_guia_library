import React, { useState, useEffect } from 'react';
import { PackageCheck, Wifi, WifiOff, Download, ArrowLeft } from 'lucide-react';

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
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 select-none">
      <div className="max-w-2xl mx-auto px-3 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {onBack ? (
            <button
              onClick={onBack}
              aria-label="Volver a recepciones"
              className="p-2 -ml-1 text-slate-300 hover:text-white active:bg-slate-800 rounded-lg transition-colors flex items-center justify-center min-w-[40px] min-h-[40px]"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-md shrink-0">
              <PackageCheck className="w-5 h-5 text-white" />
            </div>
          )}

          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white truncate leading-tight">
              {title || 'Recepción Almacén SUNAT'}
            </h1>
            <p className="text-xs text-slate-400 truncate leading-tight">
              {subtitle || 'Guías & Facturas · Offline 100%'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {canInstall && (
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-full shadow-sm transition-transform active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instalar</span>
            </button>
          )}

          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
              isOnline
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
                : 'bg-amber-950/80 text-amber-300 border-amber-800/80 animate-pulse'
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
