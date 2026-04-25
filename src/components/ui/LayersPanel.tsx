/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Plus, Eye, EyeOff, Lock, Unlock, Trash2, GripVertical } from 'lucide-react';
import { Layer } from '@/src/types/canvas';
import { cn } from '@/src/lib/utils';

interface LayersPanelProps {
  layers: Layer[];
  activeId: string;
  onUpdate: (layers: Layer[]) => void;
  onSetActive: (id: string) => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({ 
  layers, 
  activeId, 
  onUpdate,
  onSetActive 
}) => {
  const addLayer = () => {
    const newLayer: Layer = {
      id: `layer-${Date.now()}`,
      name: `Layer ${layers.length + 1}`,
      opacity: 1,
      visible: true,
      locked: false,
    };
    onUpdate([newLayer, ...layers]);
    onSetActive(newLayer.id);
  };

  const toggleVisibility = (id: string) => {
    onUpdate(layers.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  };

  const toggleLock = (id: string) => {
    onUpdate(layers.map(l => l.id === id ? { ...l, locked: !l.locked } : l));
  };

  const deleteLayer = (id: string) => {
    if (layers.length <= 1) return;
    const newLayers = layers.filter(l => l.id !== id);
    onUpdate(newLayers);
    if (activeId === id) onSetActive(newLayers[0].id);
  };

  return (
    <div className="flex flex-col h-full bg-[#161617]">
      <div className="p-6 border-b border-[#2D2D2E] flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C5A059]">Livelli</h3>
        <button 
          onClick={addLayer}
          className="p-1.5 rounded-lg hover:bg-[#2D2D2E] text-gray-400 transition-colors border border-[#2D2D2E]"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {layers.map((layer) => (
          <div
            key={layer.id}
            onClick={() => onSetActive(layer.id)}
            className={cn(
              "group p-3 rounded-xl flex items-center gap-4 cursor-pointer transition-all border border-transparent",
              activeId === layer.id ? "bg-[#1F1F20] border-[#2D2D2E] shadow-xl" : "hover:bg-[#1F1F20]/50"
            )}
          >
            <div className={cn(
              "text-gray-600 transition-colors",
              activeId === layer.id ? "text-[#C5A059]" : "group-hover:text-gray-400"
            )}>
               <GripVertical size={14} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className={cn(
                "text-xs font-bold truncate transition-colors",
                activeId === layer.id ? "text-[#E0E0E0]" : "text-gray-500"
              )}>{layer.name.replace('Layer', 'Livello')}</div>
              <div className="text-[10px] text-gray-600 font-mono italic">{Math.round(layer.opacity * 100)}% Pass</div>
            </div>

            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={(e) => { e.stopPropagation(); toggleVisibility(layer.id); }}
                className={cn("p-1.5 rounded hover:bg-[#2D2D2E] text-gray-500", !layer.visible && "text-red-900 bg-red-900/10")}
              >
                {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); toggleLock(layer.id); }}
                className={cn("p-1.5 rounded hover:bg-[#2D2D2E] text-gray-500", layer.locked && "text-[#C5A059] bg-[#C5A059]/10")}
              >
                {layer.locked ? <Lock size={14} /> : <Unlock size={14} />}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }}
                className="p-1.5 rounded hover:bg-red-900/20 text-gray-600 hover:text-red-500"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 mt-auto border-t border-[#2D2D2E]">
        <div className="px-4 py-2.5 rounded-xl bg-[#0F0F0F] text-[10px] text-gray-600 font-mono font-bold uppercase tracking-wider border border-[#2D2D2E] flex justify-between">
          <span>Conteggio livelli</span>
          <span className="text-[#C5A059]">{layers.length}</span>
        </div>
      </div>
    </div>
  );
};
