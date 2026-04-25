/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Download, Upload, Share2, Grid3X3, Circle, LogIn, LogOut, User as UserIcon, Save, Grip, RotateCcw, Trash2, Undo, Redo } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/lib/AuthContext';

interface TopBarProps {
  paperType: string;
  setPaperType: (t: any) => void;
  onExport: (type: 'png' | 'svg' | 'pdf') => void;
  onSave?: () => void;
  onImport: () => void;
  onReset: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  hasSelection: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({ paperType, setPaperType, onExport, onSave, onImport, onReset, onUndo, onRedo, onDelete, hasSelection }) => {
  const { user, signIn, logout, loading } = useAuth();
  const [showExport, setShowExport] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleShare = async () => {
    try {
      const url = window.location.href;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback for non-secure contexts or iframes
        const textArea = document.createElement("textarea");
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  React.useEffect(() => {
    const handleClickOutside = () => setShowExport(false);
    if (showExport) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [showExport]);

  return (
    <div className="flex items-center justify-between w-full pointer-events-auto">
      <div className="flex items-center gap-3">
        <div className="glass-panel p-2 rounded-xl border border-[#2D2D2E] flex items-center gap-3 pr-4 shadow-[0_0_10px_rgba(0,0,0,0.3)]">
           <div className="w-8 h-8 rounded-lg bg-[#C5A059] flex items-center justify-center text-[#121212] font-black italic shadow-[0_0_8px_rgba(197,160,89,0.3)]">V</div>
           <div className="hidden sm:block">
             <div className="text-xs font-serif font-black italic leading-none text-[#C5A059]">VectorSketch</div>
             <div className="text-[9px] text-gray-500 uppercase tracking-[0.2em] font-bold">Creative Studio</div>
           </div>
        </div>
        
        <button 
          onClick={onSave}
          className="glass-panel px-4 py-2 rounded-xl border border-[#2D2D2E] flex items-center gap-2 hover:bg-[#1F1F20] transition-all text-xs font-bold text-gray-300"
        >
          <Save size={14} className="text-[#C5A059]" />
          <span>Salva Localmente</span>
        </button>

        <div className="glass-panel px-1.5 py-1.5 rounded-xl border border-[#2D2D2E] hidden md:flex items-center gap-1">

          {[
            { id: 'plain', icon: Circle, label: 'Vuoto' },
            { id: 'grid', icon: Grid3X3, label: 'Griglia' },
            { id: 'dots', icon: Grip, label: 'Punti' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPaperType(item.id)}
              className={cn(
                "p-2 rounded-lg text-gray-500 transition-all hover:bg-[#1F1F20]",
                paperType === item.id && "bg-[#2D2D2E] text-[#C5A059] shadow-inner"
              )}
              title={item.label}
            >
              <item.icon size={16} />
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="glass-panel p-1 rounded-xl border border-[#2D2D2E] flex items-center gap-1">
          <button 
            onClick={onUndo}
            className="p-2.5 rounded-lg hover:bg-[#1F1F20] text-gray-400 transition-colors"
            title="Annulla (Ctrl+Z)"
          >
            <Undo size={18} />
          </button>
          <div className="w-px h-4 bg-[#2D2D2E]" />
          <button 
            onClick={onRedo}
            className="p-2.5 rounded-lg hover:bg-[#1F1F20] text-gray-400 transition-colors"
            title="Ripristina (Ctrl+Y)"
          >
            <Redo size={18} />
          </button>
        </div>

        {hasSelection && (
          <button 
            onClick={onDelete}
            className="glass-panel p-2.5 rounded-xl border border-red-900/30 bg-red-900/10 hover:bg-red-900/20 transition-all group"
            title="Elimina selezione"
          >
            <Trash2 size={18} className="text-red-500 group-hover:scale-110 transition-transform" />
          </button>
        )}

        <button 
          onClick={onReset}
          className="glass-panel p-2.5 rounded-xl border border-[#2D2D2E] hover:bg-[#1F1F20] transition-all group"
          title="Resetta foglio"
        >
          <RotateCcw size={18} className="text-gray-400 group-hover:rotate-[-45deg] transition-transform" />
        </button>

        <div className="glass-panel p-1 rounded-xl border border-[#2D2D2E] flex items-center gap-1">
          <button 
            onClick={onImport}
            className="px-3 py-2 rounded-lg hover:bg-[#1F1F20] text-xs font-medium flex items-center gap-2 text-gray-400"
          >
            <Upload size={14} />
            <span className="hidden sm:inline">Importa</span>
          </button>
          <div className="w-px h-4 bg-[#2D2D2E]" />
          
          <div className="relative">
            <button 
              className="px-3 py-2 rounded-lg hover:bg-[#1F1F20] text-xs font-medium flex items-center gap-2 text-gray-400"
              onClick={(e) => {
                e.stopPropagation();
                setShowExport(!showExport);
              }}
            >
              <Download size={14} />
              <span className="hidden sm:inline">Esporta</span>
            </button>
            
            {showExport && (
              <div 
                className="absolute top-full right-0 mt-2 w-48 glass-panel rounded-xl border border-[#2D2D2E] p-1.5 z-[100] shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-top-1 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  onClick={() => { onExport('png'); setShowExport(false); }} 
                  className="w-full text-left px-3 py-3 text-[10px] font-bold hover:bg-[#2D2D2E] text-gray-300 rounded-lg flex items-center justify-between transition-colors"
                >
                  <span>ESPORTA PNG</span>
                  <span className="text-[8px] text-gray-600 font-mono">IMAGE</span>
                </button>
                <button 
                  onClick={() => { onExport('svg'); setShowExport(false); }} 
                  className="w-full text-left px-3 py-3 text-[10px] font-bold hover:bg-[#2D2D2E] text-gray-300 rounded-lg flex items-center justify-between transition-colors"
                >
                  <span>ESPORTA SVG</span>
                  <span className="text-[8px] text-gray-600 font-mono">VECTOR</span>
                </button>
                <button 
                  onClick={() => { onExport('pdf'); setShowExport(false); }} 
                  className="w-full text-left px-3 py-3 text-[10px] font-bold hover:bg-[#2D2D2E] text-gray-300 rounded-lg flex items-center justify-between transition-colors"
                >
                  <span>ESPORTA PDF</span>
                  <span className="text-[8px] text-gray-600 font-mono">DOCUMENT</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={handleShare}
          className={cn(
            "glass-panel p-2.5 rounded-xl border border-[#2D2D2E] hover:bg-[#1F1F20] transition-all relative overflow-hidden",
            copied && "border-green-500/50 bg-green-500/10"
          )}
          title="Copia link per condividere"
        >
          <Share2 size={18} className={cn("text-gray-400 transition-colors", copied && "text-green-500")} />
          {copied && (
            <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center animate-in fade-in zoom-in duration-300">
               <span className="text-[8px] font-black italic text-green-500">COPIATO!</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );

};
