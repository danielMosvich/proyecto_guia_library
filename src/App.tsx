import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import type { Reception, ReceptionItem } from './types';
import { Navbar } from './components/Navbar';
import { ReceptionList } from './components/ReceptionList';
import { ReceptionDetailView } from './components/ReceptionDetailView';
import { SummaryModal } from './components/SummaryModal';

export const App: React.FC = () => {
  const [selectedReceptionId, setSelectedReceptionId] = useState<string | null>(null);
  const [summaryModalReception, setSummaryModalReception] = useState<Reception | null>(null);

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
            onSelectReception={(id) => setSelectedReceptionId(id)}
            onOpenSummary={(rec) => setSummaryModalReception(rec)}
          />
        </>
      ) : (
        <ReceptionDetailView
          receptionId={selectedReceptionId}
          onBack={() => setSelectedReceptionId(null)}
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
            setSelectedReceptionId(summaryModalReception.id);
          }}
        />
      )}
    </div>
  );
};

export default App;
