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

  // Live query for active reception in navbar
  const activeReception = useLiveQuery(async (): Promise<Reception | undefined> => {
    if (!selectedReceptionId) return undefined;
    return await db.receptions.get(selectedReceptionId);
  }, [selectedReceptionId]);

  // For summary opened from the list view
  const summaryItems = useLiveQuery(async (): Promise<ReceptionItem[]> => {
    if (!summaryModalReception) return [];
    return await db.receptionItems.where('receptionId').equals(summaryModalReception.id).toArray();
  }, [summaryModalReception?.id]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col select-none">
      {/* Top Main Navigation */}
      <Navbar
        onBack={selectedReceptionId ? () => setSelectedReceptionId(null) : undefined}
        title={
          activeReception
            ? `${activeReception.documentType === 'DespatchAdvice' ? 'Guía' : 'Factura'} ${activeReception.serieNumero}`
            : 'Recepción Almacén SUNAT'
        }
        subtitle={
          activeReception
            ? activeReception.proveedorNombre
            : 'Control y Verificación Física · PWA Offline'
        }
      />

      {/* Screen Views */}
      {!selectedReceptionId ? (
        <ReceptionList
          onSelectReception={(id) => setSelectedReceptionId(id)}
          onOpenSummary={(rec) => setSummaryModalReception(rec)}
        />
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
