/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HexColorPicker } from 'react-colorful';
import { COPIC_COLORS } from '@/src/types/canvas';
import { cn } from '@/src/lib/utils';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange }) => {
  return (
    <div className="p-4 h-full flex flex-col gap-6 overflow-y-auto bg-[#161617]">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C5A059]">Chrome Palette</h3>
        <div 
          className="w-6 h-6 rounded-lg border border-[#2D2D2E] shadow-lg" 
          style={{ backgroundColor: color }} 
        />
      </div>

      <div className="p-2 bg-[#1F1F20] rounded-2xl border border-[#2D2D2E]">
        <HexColorPicker color={color} onChange={onChange} className="!w-full !h-48" />
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">COPIC Studio Series</h4>
          <div className="flex-1 h-[1px] bg-[#2D2D2E]" />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {COPIC_COLORS.map((c) => (
            <button
              key={c.name}
              onClick={() => onChange(c.color)}
              className={cn(
                "group relative flex flex-col items-center gap-1.5",
              )}
            >
              <div 
                className="w-full aspect-square rounded-lg border border-[#2D2D2E] transition-all hover:scale-105 active:scale-95 shadow-md"
                style={{ backgroundColor: c.color }}
              />
              <span className="text-[8px] font-mono font-bold text-gray-500 group-hover:text-[#C5A059] transition-colors">{c.name}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="space-y-3 mt-auto">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-[1px] bg-[#2D2D2E]" />
          <span className="text-[10px] text-gray-600 font-serif italic">Crafted in Milan</span>
          <div className="flex-1 h-[1px] bg-[#2D2D2E]" />
        </div>
      </div>
    </div>
  );
};
