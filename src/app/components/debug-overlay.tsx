import React, { useState } from 'react';

// Turn this on to enable the debug overlay
const SHOW_DEBUG_OVERLAY = false;

type DebugInfo = {
  id: string;
  width: number;
  height: number;
  left: number;
  top: number;
  isActive?: boolean;
  isOver?: boolean;
};

type DebugOverlayProps = {
  items: DebugInfo[];
  activeId?: string | null;
  overId?: string | null;
};

export const DebugOverlay: React.FC<DebugOverlayProps> = ({
  items,
  activeId,
  overId,
}) => {
  if (!SHOW_DEBUG_OVERLAY) {
    return null;
  }

  return (
    <div
      className="fixed top-0 right-0 z-50 bg-black/80 p-2 text-xs text-white"
      style={{ maxHeight: '80vh', overflow: 'auto', width: '200px' }}
    >
      <h3 className="mb-1 border-b border-white/30 font-bold">Debug Info</h3>

      {activeId && (
        <div className="mb-2">
          <strong>Active:</strong> {activeId}
        </div>
      )}

      {overId && (
        <div className="mb-2">
          <strong>Over:</strong> {overId}
        </div>
      )}

      <h4 className="mt-2 font-bold">Items:</h4>
      <div className="space-y-1">
        {items.map((item) => (
          <div
            key={item.id}
            className={`p-1 text-xs ${
              item.isActive
                ? 'bg-red-900/80'
                : item.isOver
                  ? 'bg-green-900/80'
                  : 'bg-gray-800/80'
            }`}
          >
            <div>
              <strong>{item.id}</strong>
            </div>
            <div>
              w: {item.width}px, h: {item.height}px
            </div>
            <div>
              x: {item.left}px, y: {item.top}px
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Hook to track items for debugging
export function useDebugItems() {
  const [items, setItems] = useState<DebugInfo[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const updateItem = (itemInfo: DebugInfo) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === itemInfo.id);
      if (existingIndex >= 0) {
        return [
          ...prev.slice(0, existingIndex),
          { ...prev[existingIndex], ...itemInfo },
          ...prev.slice(existingIndex + 1),
        ];
      } else {
        return [...prev, itemInfo];
      }
    });
  };

  const setActive = (id: string | null) => {
    setActiveId(id);
    if (id) {
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          isActive: item.id === id,
        })),
      );
    } else {
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          isActive: false,
        })),
      );
    }
  };

  const setOver = (id: string | null) => {
    setOverId(id);
    if (id) {
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          isOver: item.id === id,
        })),
      );
    } else {
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          isOver: false,
        })),
      );
    }
  };

  return {
    items,
    updateItem,
    setActive,
    setOver,
    activeId,
    overId,
  };
}
