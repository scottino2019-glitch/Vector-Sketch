/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { 
  Pencil, 
  PenTool, 
  Brush, 
  Eraser, 
  MousePointer2, 
  Move, 
  Layers, 
  Palette,
  Minus,
  Plus,
  Square,
  Circle as CircleIcon,
  Triangle,
  Sparkles,
  Type,
  PaintBucket
} from 'lucide-react';
import { ToolType } from '@/src/types/canvas';
import { cn } from '@/src/lib/utils';

interface ToolbarProps {
  selectedTool: ToolType;
  setTool: (t: ToolType) => void;
  strokeWidth: number;
  setStrokeWidth: (w: number) => void;
  activePanel: 'none' | 'layers' | 'colors';
  setActivePanel: (p: 'none' | 'layers' | 'colors') => void;
}

const tools = [
  { id: 'select', icon: MousePointer2, label: 'Selezione' },
  { id: 'pan', icon: Move, label: 'Sposta' },
  { id: 'pencil', icon: Pencil, label: 'Matita' },
  { id: 'pen', icon: PenTool, label: 'Penna' },
  { id: 'brush', icon: Brush, label: 'Pennello' },
  { id: 'fill', icon: PaintBucket, label: 'Riempi' },
  { id: 'rect', icon: Square, label: 'Rettangolo' },
  { id: 'circle', icon: CircleIcon, label: 'Cerchio' },
  { id: 'triangle', icon: Triangle, label: 'Triangolo' },
  { id: 'star', icon: Sparkles, label: 'Stella' },
  { id: 'text', icon: Type, label: 'Testo' },
  { id: 'eraser', icon: Eraser, label: 'Gomma' },
] as const;

export const Toolbar: React.FC<ToolbarProps> = ({ 
  selectedTool, 
  setTool, 
  strokeWidth, 
  setStrokeWidth,
  activePanel,
  setActivePanel
}) => {
  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass-panel rounded-full px-4 py-3 flex items-center gap-4 border border-[#2D2D2E] shadow-2xl"
    >
      <div className="flex items-center gap-2 pr-4 border-r border-[#2D2D2E]">
        <button
          onClick={() => setActivePanel(activePanel === 'colors' ? 'none' : 'colors')}
          className={cn(
            "p-2.5 rounded-full transition-all hover:bg-[#1F1F20] text-gray-400",
            activePanel === 'colors' && "bg-[#C5A059] text-[#121212] shadow-[0_0_12px_rgba(197,160,89,0.4)]"
          )}
        >
          <Palette size={20} />
        </button>
      </div>

      <div className="flex items-center gap-1">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setTool(tool.id)}
            className={cn(
              "p-2.5 rounded-full transition-all flex flex-col items-center group relative",
              selectedTool === tool.id ? "bg-[#2D2D2E] text-[#C5A059] shadow-inner" : "hover:bg-[#1F1F20] text-gray-500"
            )}
          >
            <tool.icon size={20} />
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#1F1F20] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-[#2D2D2E]">
              {tool.label}
            </span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 pl-4 border-l border-[#2D2D2E]">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setStrokeWidth(Math.max(1, strokeWidth - 1))}
            className="p-1 hover:bg-[#1F1F20] rounded text-gray-500"
          >
            <Minus size={14} />
          </button>
          <div className="w-8 text-center text-xs font-bold text-gray-400">{strokeWidth}</div>
          <button 
            onClick={() => setStrokeWidth(Math.min(50, strokeWidth + 1))}
            className="p-1 hover:bg-[#1F1F20] rounded text-gray-500"
          >
            <Plus size={14} />
          </button>
        </div>

        <button
          onClick={() => setActivePanel(activePanel === 'layers' ? 'none' : 'layers')}
          className={cn(
            "p-2.5 rounded-full transition-all hover:bg-[#1F1F20] text-gray-400",
            activePanel === 'layers' && "bg-[#C5A059] text-[#121212] shadow-[0_0_12px_rgba(197,160,89,0.4)]"
          )}
        >
          <Layers size={20} />
        </button>
      </div>
    </motion.div>
  );
};
