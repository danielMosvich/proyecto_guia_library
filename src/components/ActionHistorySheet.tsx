import React, { useMemo } from 'react';
import { X, History, RotateCcw } from 'lucide-react';
import type { ReceptionItem, PartialCountEntry } from '../types';

interface ActionEntry {
  entryId: string;
  itemId: string;
  itemCode: string;
  description: string;
  timestamp: number;
  amount: number;
  inputAmount: number;
  unitUsed: string;
  boxTag?: string;
  isLooseUnit?: boolean;
  isLatestForItem: boolean;
}

interface ActionHistorySheetProps {
  isOpen: boolean;
  items: ReceptionItem[];
  onClose: () => void;
  onUndoItem: (itemId: string) => Promise<void>;
}

export const ActionHistorySheet: React.FC<ActionHistorySheetProps> = ({
  isOpen,
  items,
  onClose,
  onUndoItem,
}) => {
  if (!isOpen) return null;

  // Flatten and sort all partial counts from all items by timestamp descending
  const historyEntries: ActionEntry[] = useMemo(() => {
    const list: ActionEntry[] = [];

    items.forEach((item) => {
      const counts = item.partialCounts || [];
      counts.forEach((entry: PartialCountEntry, idx: number) => {
        const isLatestForItem = idx === counts.length - 1;
        list.push({
          entryId: entry.id,
          itemId: item.id,
          itemCode: item.itemCode,
          description: item.description,
          timestamp: entry.timestamp,
          amount: entry.amount,
          inputAmount: entry.inputAmount,
          unitUsed: entry.unitUsed,
          boxTag: entry.boxTag,
          isLooseUnit: entry.isLooseUnit,
          isLatestForItem,
        });
      });
    });

    // Sort newest first
    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [items]);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getRelativeTime = (ts: number) => {
    const diffSec = Math.floor((Date.now() - ts) / 1000);
    if (diffSec < 60) return 'Hace un momento';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `Hace ${diffMin} min`;
    const diffHr = Math.floor(diffMin / 60);
    return `Hace ${diffHr} h`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* iOS Grabber */}
        <div className="pt-2.5 pb-1 flex justify-center">
          <div className="w-9 h-1 bg-[#D1D1D6] rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4 py-2.5 bg-white text-[#1C1C1E] flex items-center justify-between border-b border-[#E5E5EA]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-[#E5F2FF] text-[#007AFF]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1C1C1E]">Historial de Acciones</h2>
              <p className="text-[11px] text-[#8E8E93]">
                {historyEntries.length} {historyEntries.length === 1 ? 'registro de conteo' : 'registros de conteo'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#F2F2F7] text-[#8E8E93]"
            aria-label="Cerrar historial"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content List */}
        <div className="p-4 space-y-2.5 overflow-y-auto flex-1">
          {historyEntries.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-[#F2F2F7] flex items-center justify-center mx-auto text-[#8E8E93]">
                <History className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-[#1C1C1E]">Aún no hay acciones registradas</p>
              <p className="text-[11px] text-[#8E8E93] max-w-xs mx-auto">
                Cada vez que sumes bultos, completes productos o modifiques un conteo, podrás revisarlo y revertirlo desde aquí.
              </p>
            </div>
          ) : (
            historyEntries.map((action) => {
              const isFullComplete = action.boxTag === 'Resto completo';

              return (
                <div
                  key={action.entryId}
                  className="p-3 bg-[#F2F2F7] border border-[#E5E5EA] rounded-2xl space-y-1.5 text-xs transition-colors hover:bg-white hover:border-[#007AFF]/40"
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-[#1C1C1E] border border-[#E5E5EA]">
                        {action.itemCode}
                      </span>
                      <span className="text-[10px] text-[#8E8E93]">
                        {formatTime(action.timestamp)} · {getRelativeTime(action.timestamp)}
                      </span>
                    </div>

                    {isFullComplete ? (
                      <span className="px-1.5 py-0.5 rounded-md bg-[#EBF9EE] text-[#34C759] font-bold text-[10px] border border-[#D1F2D9] shrink-0">
                        Completado
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded-md bg-[#E5F2FF] text-[#007AFF] font-bold text-[10px] border border-[#CCE5FF] shrink-0">
                        +{action.amount} {action.unitUsed}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] font-bold text-[#1C1C1E] truncate">
                    {action.description}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-[#E5E5EA] text-[11px]">
                    <span className="text-[#8E8E93]">
                      {isFullComplete
                        ? `Se completaron ${action.amount} ${action.unitUsed}`
                        : `Ingreso: +${action.amount} ${action.unitUsed}${action.boxTag ? ` (${action.boxTag})` : ''}`}
                    </span>

                    {action.isLatestForItem ? (
                      <button
                        type="button"
                        onClick={async () => {
                          await onUndoItem(action.itemId);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] text-[#007AFF] hover:underline font-bold px-2 py-0.5 rounded-md bg-white border border-[#E5E5EA] hover:border-[#007AFF] active:scale-95 transition-all shadow-2xs"
                      >
                        <RotateCcw className="w-3 h-3 text-[#007AFF]" />
                        <span>Deshacer</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-[#AEAEB2] italic">
                        Histórico
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-[#E5E5EA]">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-[#F2F2F7] hover:bg-[#E5E5EA] active:bg-[#D1D1D6] text-[#1C1C1E] font-bold rounded-2xl text-xs min-h-[44px]"
          >
            Cerrar Historial
          </button>
        </div>
      </div>
    </div>
  );
};
