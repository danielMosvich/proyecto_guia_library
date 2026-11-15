import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import type { Reception, ReceptionItem } from './types';
import { Navbar } from './components/Navbar';
import { ReceptionList } from './components/ReceptionList';
import { ReceptionDetailView } from './components/ReceptionDetailView';
import { SummaryModal } from './components/SummaryModal';

export const App: React.FC = () => {
  // Restore previously active reception if the PWA or browser was restarted
  const [selectedReceptionId, setSelectedReceptionId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('sunat_active_reception_id');
    } catch {
      return null;
    }
  });
  const [summaryModalReception, setSummaryModalReception] = useState<Reception | null>(null);

  const handleSelectReception = (id: string | null) => {
    setSelectedReceptionId(id);
    try {
      if (id) {
        localStorage.setItem('sunat_active_reception_id', id);
      } else {
        localStorage.removeItem('sunat_active_reception_id');
      }
    } catch {
      // Safe fallback if storage quota exceeded
    }
  };

  // For summary opened from the list view
  const summaryItems = useLiveQuery(async (): Promise<ReceptionItem[]> => {
    if (!summaryModalReception) return [];
    return await db.receptionItems.where('receptionId').equals(summaryModalReception.id).toArray();
  }, [summaryModalReception?.id]);

  return (
    <div className="min-h-screen bg-[#F2F2F7] text-[#1C1C1E] flex flex-col select-none">
      {/* Top Navbar ONLY displayed on List screen (unified single header on detail screen) */}
      {!selectedReceptionId ? (
        <>
          <Navbar
            title="Recepción Almacén SUNAT"
            subtitle="Guías & Facturas · Offline 100%"
          />
          <ReceptionList
            onSelectReception={handleSelectReception}
            onOpenSummary={(rec) => setSummaryModalReception(rec)}
          />
        </>
      ) : (
        <ReceptionDetailView
          receptionId={selectedReceptionId}
          onBack={() => handleSelectReception(null)}
        />
      )}

      {/* Standalone Summary Modal when triggered from List View */}
      {summaryModalReception && summaryItems && (
        <SummaryModal
          isOpen={Boolean(summaryModalReception)}
          reception={summaryModalReception}
          items={summaryItems}
          onClose={() => setSummaryModalReception(null)}
          onReopen={async () => {
            await db.receptions.update(summaryModalReception.id, {
              status: 'en_proceso',
              updatedAt: Date.now(),
            });
            setSummaryModalReception(null);
            handleSelectReception(summaryModalReception.id);
          }}
        />
      )}
    </div>
  );
};

export default App;
