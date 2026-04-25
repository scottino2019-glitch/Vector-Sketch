/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { VectorCanvas } from './components/canvas/VectorCanvas';
import { Toolbar } from './components/ui/Toolbar';
import { LayersPanel } from './components/ui/LayersPanel';
import { ColorPicker } from './components/ui/ColorPicker';
import { TopBar } from './components/ui/TopBar';
import { CanvasState, ToolType, Layer } from './types/canvas';
import { AnimatePresence, motion } from 'motion/react';
import { SketchService } from './lib/firestoreService';
import { useAuth } from './lib/AuthContext';
import { FolderOpen } from 'lucide-react';

const INITIAL_LAYERS: Layer[] = [
  { id: 'layer-1', name: 'Layer 1', opacity: 1, visible: true, locked: false },
];

export default function App() {
  const { user } = useAuth();
  const canvasRef = React.useRef<any>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('Untitled Sketch');
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [savedProjects, setSavedProjects] = useState<any[]>([]);
  
  const [state, setState] = useState<CanvasState>({
    zoom: 1,
    panX: 0,
    panY: 0,
    selectedTool: 'pencil',
    currentColor: '#000000',
    strokeWidth: 2,
    paperType: 'grid',
    layers: INITIAL_LAYERS,
    activeLayerId: 'layer-1',
  });

  const [activePanel, setActivePanel] = useState<'none' | 'layers' | 'colors'>('none');
  const [hasSelection, setHasSelection] = useState(false);

  const updateState = (updates: Partial<CanvasState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const handleExport = (type: 'png' | 'svg' | 'pdf') => {
    if (!canvasRef.current) return;
    if (type === 'png') canvasRef.current.exportImage();
    if (type === 'svg') canvasRef.current.exportSVG();
    if (type === 'pdf') canvasRef.current.exportPDF();
  };

  const handleSave = async () => {
    if (!user || !canvasRef.current) return;
    const json = canvasRef.current.getCanvasJSON();
    const id = currentProjectId || `sk-${Date.now()}`;
    
    try {
      await SketchService.saveSketch(id, projectName, JSON.stringify(json));
      setCurrentProjectId(id);
      alert('Sketch salvato nel cloud!');
      refreshProjects();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUndo = () => {
    canvasRef.current?.undo?.();
  };

  const handleRedo = () => {
    canvasRef.current?.redo?.();
  };

  const handleReset = () => {
    canvasRef.current?.resetCanvas();
  };

  const handleDelete = () => {
    // We can simulate a delete key press or call a specific method
    const event = new KeyboardEvent('keydown', { key: 'Delete' });
    window.dispatchEvent(event);
  };

  const refreshProjects = async () => {
    if (!user) return;
    const projects = await SketchService.getSketches();
    setSavedProjects(projects || []);
  };

  const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Eliminare definitivamente questo schizzo?')) return;
    try {
      await SketchService.deleteSketch(id);
      if (currentProjectId === id) {
        setCurrentProjectId(null);
        setProjectName('Untitled Sketch');
        canvasRef.current?.resetCanvas();
      }
      refreshProjects();
    } catch (e) {
      console.error(e);
    }
  };

  const loadProject = (project: any) => {
    if (!canvasRef.current) return;
    setProjectName(project.name);
    setCurrentProjectId(project.id);
    canvasRef.current.loadCanvasJSON(JSON.parse(project.canvasData));
    setIsProjectMenuOpen(false);
  };

  const formatDate = (date: any) => {
    if (!date) return 'Recently Saved';
    // Handle Firestore Timestamp
    if (date.toDate) return date.toDate().toLocaleDateString();
    // Handle local JS number/date
    return new Date(date).toLocaleDateString();
  };

  useEffect(() => {
    refreshProjects();
  }, [user]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0A0A0A] text-gray-100 select-none">
      {/* Project Browser Button (Side) */}
      <button 
        onClick={() => setIsProjectMenuOpen(true)}
        className="fixed left-4 top-1/2 -translate-y-1/2 glass-panel p-3 rounded-full hover:bg-[#1F1F20] flex items-center justify-center z-40 shadow-xl border border-[#2D2D2E]"
        title="Open Sketches"
      >
        <FolderOpen size={24} className="text-gray-400" />
      </button>

      {/* Main Canvas Area */}
      <main className="flex-1 relative">
        <VectorCanvas 
          ref={canvasRef}
          tool={state.selectedTool}
          color={state.currentColor}
          strokeWidth={state.strokeWidth}
          paperType={state.paperType}
          layers={state.layers}
          activeLayerId={state.activeLayerId}
          onSelection={(items) => setHasSelection(items.length > 0)}
        />

        {/* Top Management Bar */}
        <div className="absolute top-4 left-0 right-0 px-4 pointer-events-none">
          <TopBar 
            paperType={state.paperType} 
            setPaperType={(t) => updateState({ paperType: t })}
            onExport={handleExport}
            onSave={handleSave}
            onImport={() => canvasRef.current?.importImage()}
            onReset={handleReset}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onDelete={handleDelete}
            hasSelection={hasSelection}
          />
        </div>

        {/* Floating Tool Wheel/Bar */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <Toolbar 
            selectedTool={state.selectedTool} 
            setTool={(t) => updateState({ selectedTool: t })}
            strokeWidth={state.strokeWidth}
            setStrokeWidth={(w) => updateState({ strokeWidth: w })}
            activePanel={activePanel}
            setActivePanel={setActivePanel}
          />
        </div>

        {/* Side Panels */}
        <AnimatePresence>
          {activePanel === 'layers' && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="absolute right-4 top-20 bottom-24 w-72 glass-panel rounded-2xl overflow-hidden pointer-events-auto"
            >
              <LayersPanel 
                layers={state.layers} 
                activeId={state.activeLayerId}
                onUpdate={(layers) => updateState({ layers })}
                onSetActive={(id) => updateState({ activeLayerId: id })}
              />
            </motion.div>
          )}

          {activePanel === 'colors' && (
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className="absolute left-4 top-20 bottom-24 w-72 glass-panel rounded-2xl overflow-hidden pointer-events-auto"
            >
              <ColorPicker 
                color={state.currentColor} 
                onChange={(c) => updateState({ currentColor: c })}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Project Browser Modal */}
        <AnimatePresence>
          {isProjectMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl pointer-events-auto"
              onClick={() => setIsProjectMenuOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-white rounded-[32px] border border-gray-200 shadow-2xl w-full max-w-2xl h-[600px] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-8 border-b border-[#2D2D2E] flex items-center justify-between bg-[#1f1f20]/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#C5A059] flex items-center justify-center text-[#121212] font-serif font-black text-2xl italic shadow-[0_0_20px_rgba(197,160,89,0.3)]">V</div>
                    <div>
                      <h2 className="text-xl font-serif font-black italic text-[#C5A059]">Local Library</h2>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Offline Storage</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsProjectMenuOpen(false)}
                    className="p-3 hover:bg-[#2D2D2E] rounded-full transition-all text-gray-500 hover:text-white"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#161617]">
                  {savedProjects.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      {savedProjects.map((p) => (
                        <div key={p.id} className="group relative space-y-3">
                          <button
                            onClick={() => loadProject(p)}
                            className="w-full text-left"
                          >
                            <div className="aspect-[4/3] bg-[#0A0A0A] rounded-2xl border border-[#2D2D2E] group-hover:border-[#C5A059] group-hover:shadow-lg transition-all flex items-center justify-center overflow-hidden relative">
                               <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#C5A059 1px, transparent 0)', backgroundSize: '15px 15px' }}></div>
                               <div className="text-[10px] font-mono text-gray-700 group-hover:text-[#C5A059] transition-colors z-10 font-bold uppercase tracking-tighter">
                                  Vector Preview
                               </div>
                            </div>
                            <div className="px-1 mt-2">
                              <div className="text-xs font-bold truncate text-gray-100 group-hover:text-[#C5A059] transition-colors">{p.name}</div>
                              <div className="text-[9px] text-gray-500 font-mono font-bold uppercase tracking-tighter mt-1 flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-green-500/50"></span>
                                {formatDate(p.updatedAt)}
                              </div>
                            </div>
                          </button>
                          
                          {/* Delete Button */}
                          <button 
                            onClick={(e) => handleDeleteProject(e, p.id)}
                            className="absolute top-2 right-2 p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all z-20 backdrop-blur-md"
                            title="Cancella Sketch"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-6">
                      <div className="w-20 h-20 rounded-full bg-[#1F1F20] flex items-center justify-center border border-[#2D2D2E]">
                        <FolderOpen size={40} className="text-gray-700" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-black italic text-gray-500 uppercase tracking-widest leading-loose">No active sketches</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-[#2D2D2E] bg-[#1F1F20]/50 flex justify-center">
                   <p className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.3em] font-mono">VectorSketch Pro v1.2 // Local Storage</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );

}

