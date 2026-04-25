/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import * as fabric from 'fabric';
import { useFabric } from '@/src/hooks/useFabric';
import { ToolType, Layer } from '@/src/types/canvas';
import { jsPDF } from 'jspdf';

interface VectorCanvasProps {
  tool: ToolType;
  color: string;
  strokeWidth: number;
  paperType: 'plain' | 'grid' | 'dots' | 'lined';
  layers: Layer[];
  activeLayerId: string;
  onSelection?: (objects: fabric.FabricObject[]) => void;
}

export interface CanvasHandle {
  exportImage: () => void;
  exportSVG: () => void;
  exportPDF: () => void;
  getCanvasJSON: () => any;
  loadCanvasJSON: (json: any) => void;
  addRemoteObject: (json: any) => void;
  importImage: () => void;
  resetCanvas: () => void;
}

export const VectorCanvas = forwardRef<CanvasHandle, VectorCanvasProps>(({
  tool,
  color,
  strokeWidth,
  paperType,
  layers,
  activeLayerId,
  onSelection,
}, ref) => {
  const { canvasRef, fabricRef, containerRef } = useFabric();
  const historyRef = React.useRef<string[]>([]);
  const historyIndexRef = React.useRef<number>(-1);
  const isUndoRedoRef = React.useRef(false);

  // Draw Grid/Paper pattern
  const updateBackground = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    // Use a clean white for the paper
    canvas.backgroundColor = '#ffffff';

    if (paperType === 'grid') {
      const grid = 30;
      const patternCanvas = document.createElement('canvas');
      patternCanvas.width = grid;
      patternCanvas.height = grid;
      const ctx = patternCanvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#e0e0e0'; // Darker, more visible grid
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(grid, 0); ctx.lineTo(0, 0); ctx.lineTo(0, grid);
        ctx.stroke();
      }
      canvas.backgroundColor = new fabric.Pattern({ source: patternCanvas, repeat: 'repeat' });
    } else if (paperType === 'dots') {
       const grid = 30;
       const patternCanvas = document.createElement('canvas');
       patternCanvas.width = grid;
       patternCanvas.height = grid;
       const ctx = patternCanvas.getContext('2d');
       if (ctx) {
         ctx.fillStyle = '#bbb'; // Darker, more visible dots
         ctx.beginPath(); ctx.arc(1.5, 1.5, 1.2, 0, Math.PI * 2); ctx.fill();
       }
       canvas.backgroundColor = new fabric.Pattern({ source: patternCanvas, repeat: 'repeat' });
    } else if (paperType === 'plain') {
       canvas.backgroundColor = '#ffffff';
    }
    
    canvas.renderAll();
  }, [paperType]);

  const saveHistory = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas || isUndoRedoRef.current) return;
    
    // Use toDatalessJSON for performance with complex paths
    const json = JSON.stringify(canvas.toDatalessJSON(['layerId']));
    
    // Check if what we are saving is different from current index state
    if (historyIndexRef.current >= 0 && historyRef.current[historyIndexRef.current] === json) {
      return;
    }

    // New action: discard "future" states from current index onwards
    const currentList = historyRef.current.slice(0, historyIndexRef.current + 1);
    currentList.push(json);
    
    // Limit history length to 50
    historyRef.current = currentList.slice(-50);
    historyIndexRef.current = historyRef.current.length - 1;
  }, []);

  const undo = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas || historyIndexRef.current <= 0) return;
    
    isUndoRedoRef.current = true;
    historyIndexRef.current -= 1;
    const prevState = historyRef.current[historyIndexRef.current];
    
    canvas.loadFromJSON(prevState).then(() => {
      updateBackground();
      canvas.renderAll();
      setTimeout(() => {
        isUndoRedoRef.current = false;
      }, 100);
    }).catch(err => {
      console.error("Undo error:", err);
      isUndoRedoRef.current = false;
    });
  }, [updateBackground]);

  const redo = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas || historyIndexRef.current >= historyRef.current.length - 1) return;
    
    isUndoRedoRef.current = true;
    historyIndexRef.current += 1;
    const nextState = historyRef.current[historyIndexRef.current];
    
    canvas.loadFromJSON(nextState).then(() => {
      updateBackground();
      canvas.renderAll();
      setTimeout(() => {
        isUndoRedoRef.current = false;
      }, 100);
    }).catch(err => {
      console.error("Redo error:", err);
      isUndoRedoRef.current = false;
    });
  }, [updateBackground]);

  // Export Functions
  useImperativeHandle(ref, () => ({
    exportImage: () => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const dataURL = canvas.toDataURL({ format: 'png', multiplier: 2 });
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = `Sketch_${new Date().getTime()}.png`;
      link.click();
    },
    exportSVG: () => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const svg = canvas.toSVG();
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `Sketch_${new Date().getTime()}.svg`;
      link.href = url;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    },
    exportPDF: () => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const dataURL = canvas.toDataURL({ format: 'png', multiplier: 2 });
      const pdf = new jsPDF('landscape', 'px', [canvas.width || 800, canvas.height || 600]);
      pdf.addImage(dataURL, 'PNG', 0, 0, canvas.width || 800, canvas.height || 600);
      pdf.save(`Sketch_${new Date().getTime()}.pdf`);
    },
    getCanvasJSON: () => {
      const canvas = fabricRef.current;
      if (!canvas) return null;
      return canvas.toObject(['layerId']);
    },
    loadCanvasJSON: (json: any) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      canvas.loadFromJSON(json).then(() => {
        updateBackground();
        canvas.renderAll();
        saveHistory();
      });
    },
    addRemoteObject: (json: any) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      fabric.util.enlivenObjects([json]).then((objects) => {
        objects.forEach(obj => canvas.add(obj));
        canvas.renderAll();
        saveHistory();
      });
    },
    importImage: () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.style.position = 'absolute';
      input.style.top = '-9999px';
      document.body.appendChild(input);
      
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = async (f) => {
            const data = f.target?.result as string;
            try {
              const img = await fabric.FabricImage.fromURL(data);
              const canvas = fabricRef.current;
              if (!canvas) return;
              
              const scale = Math.min(
                (canvas.width! * 0.8) / img.width!,
                (canvas.height! * 0.8) / img.height!
              );
              img.scale(scale);
              
              (img as any).layerId = activeLayerId;
              canvas.add(img);
              canvas.centerObject(img);
              canvas.setActiveObject(img);
              canvas.renderAll();
              saveHistory();
            } catch (err) {
              console.error("Errore importazione immagine:", err);
            }
          };
          reader.readAsDataURL(file);
        }
        document.body.removeChild(input);
      };
      
      input.click();
    },
    undo,
    redo,
    resetCanvas: () => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      
      isUndoRedoRef.current = true;
      
      // Clear all objects
      canvas.clear();
      
      // Restore background
      updateBackground();
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      
      setTimeout(() => {
        isUndoRedoRef.current = false;
        saveHistory();
        canvas.renderAll();
      }, 50);
    }
  }), [activeLayerId, updateBackground, undo, redo, saveHistory]);

  // Handle Layers Visibility & Lock
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const objects = canvas.getObjects();
    objects.forEach((obj: any) => {
      const layer = layers.find(l => l.id === obj.layerId);
      if (layer) {
        obj.visible = layer.visible;
        obj.selectable = !layer.locked;
        obj.evented = !layer.locked;
        obj.opacity = layer.opacity;
      }
    });
    canvas.renderAll();
  }, [layers]);

  // Drag and Drop Images & Files
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      const canvas = fabricRef.current;
      if (!canvas) return;

      const files = Array.from(e.dataTransfer?.files || []);
      for (const file of files) {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = async (f) => {
             const data = f.target?.result as string;
             const img = await fabric.FabricImage.fromURL(data);
             img.scale(0.5);
             (img as any).layerId = activeLayerId;
             canvas.add(img);
             canvas.centerObject(img);
             canvas.setActiveObject(img);
             canvas.renderAll();
          };
          reader.readAsDataURL(file);
        }
      }
    };

    const handleDragOver = (e: DragEvent) => e.preventDefault();

    container.addEventListener('drop', handleDrop);
    container.addEventListener('dragover', handleDragOver);
    return () => {
      container.removeEventListener('drop', handleDrop);
      container.removeEventListener('dragover', handleDragOver);
    };
  }, [activeLayerId]);

  // Tool specific adjustments
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = false;
    canvas.selection = tool === 'select';
    canvas.skipTargetFind = false;
    canvas.defaultCursor = tool === 'pan' ? 'grab' : 'default';

    if (['pencil', 'pen', 'brush', 'marker', 'eraser'].includes(tool)) {
      canvas.isDrawingMode = true;
      canvas.selection = false;
      canvas.skipTargetFind = true;
      
      if (tool === 'eraser') {
        const eraser = new fabric.PencilBrush(canvas);
        eraser.color = '#ffffff'; 
        eraser.width = strokeWidth * 5; // Eraser should be slightly bigger
        canvas.freeDrawingBrush = eraser;
      } else {
        const brush = new fabric.PencilBrush(canvas);
        brush.color = color;
        brush.width = strokeWidth;

        // Tool specific adjustments
        if (tool === 'pencil') {
          brush.decimate = 4.0; // Very sketchy, captures less precision for organic feel
          brush.width = strokeWidth * 0.6; // Thinner
          
          // Graphite look: translucent and slightly grayed out
          let pencilColor = color;
          if (color.startsWith('#')) {
            pencilColor = color + '66'; // ~40% opacity
          } else if (color.startsWith('rgb')) {
            pencilColor = color.replace('rgb', 'rgba').replace(')', ', 0.4)');
          }
          
          brush.color = pencilColor;
          brush.shadow = new fabric.Shadow({
            color: pencilColor.replace('0.4', '0.15'),
            blur: 3,
            offsetX: 0.5,
            offsetY: 0.5
          });
          brush.strokeLineCap = 'round';
          brush.strokeLineJoin = 'round';
        } else if (tool === 'pen') {
          brush.decimate = 0.05; // Maximum smoothness
          brush.width = strokeWidth * 0.9; // Solid presence
          brush.color = color; // 100% Solid
          brush.strokeLineCap = 'round';
          brush.strokeLineJoin = 'round';
          brush.shadow = null;
        } else if (tool === 'brush') {
          brush.width = strokeWidth * 1.5;
          brush.shadow = new fabric.Shadow({
            color: color,
            blur: strokeWidth * 0.5,
            offsetX: 0,
            offsetY: 0,
          });
        } else if (tool === 'marker') {
          brush.color = color.replace(')', ', 0.4)').replace('rgb', 'rgba');
          brush.width = strokeWidth * 3;
          brush.strokeLineCap = 'square';
        }
        
        canvas.freeDrawingBrush = brush;
      }

      const handlePathCreated = (e: any) => {
        e.path.layerId = activeLayerId;
      };
      canvas.on('path:created', handlePathCreated);
      return () => { canvas.off('path:created', handlePathCreated); };
    }

    const handleMouseDown = (opt: any) => {
      const evt = opt.e;
      
      if (tool === 'fill') {
        const target = opt.target;
        if (target) {
          target.set('fill', color);
          canvas.renderAll();
          saveHistory();
        }
        return;
      }

      if (['rect', 'circle', 'text', 'triangle', 'star'].includes(tool)) {
        const pointer = canvas.getScenePoint(evt);
        let obj: fabric.FabricObject;

        if (tool === 'rect') {
          obj = new (fabric.Rect as any)({
            left: pointer.x, top: pointer.y,
            fill: 'transparent', stroke: color, strokeWidth: strokeWidth,
            width: 50, height: 50, layerId: activeLayerId
          });
        } else if (tool === 'circle') {
          obj = new (fabric.Circle as any)({
            left: pointer.x, top: pointer.y,
            fill: 'transparent', stroke: color, strokeWidth: strokeWidth,
            radius: 25, layerId: activeLayerId
          });
        } else if (tool === 'triangle') {
          obj = new (fabric.Triangle as any)({
            left: pointer.x, top: pointer.y,
            fill: 'transparent', stroke: color, strokeWidth: strokeWidth,
            width: 50, height: 50, layerId: activeLayerId
          });
        } else if (tool === 'star') {
          // Simplified star as a polygon
          const points = [
            { x: 25, y: 0 }, { x: 30, y: 15 }, { x: 50, y: 15 },
            { x: 35, y: 30 }, { x: 40, y: 50 }, { x: 25, y: 40 },
            { x: 10, y: 50 }, { x: 15, y: 30 }, { x: 0, y: 15 },
            { x: 20, y: 15 }
          ];
          obj = new (fabric.Polygon as any)(points, {
            left: pointer.x, top: pointer.y,
            fill: 'transparent', stroke: color, strokeWidth: strokeWidth,
            layerId: activeLayerId
          });
        } else {
          obj = new (fabric.IText as any)('Double tap', {
            left: pointer.x, top: pointer.y,
            fill: color, fontSize: strokeWidth * 10, layerId: activeLayerId
          });
        }

        canvas.add(obj);
        canvas.setActiveObject(obj);
        canvas.renderAll();
        return;
      }

      if (tool === 'pan' || evt.altKey) {
        canvas.isDragging = true;
        canvas.selection = false;
        canvas.lastPosX = evt.clientX;
        canvas.lastPosY = evt.clientY;
      }
    };

    const handleMouseMove = (opt: any) => {
      if (canvas.isDragging) {
        const e = opt.e;
        const vpt = canvas.viewportTransform;
        vpt[4] += e.clientX - canvas.lastPosX;
        vpt[5] += e.clientY - canvas.lastPosY;
        canvas.requestRenderAll();
        canvas.lastPosX = e.clientX;
        canvas.lastPosY = e.clientY;
      }
    };

    const handleMouseUp = () => {
      canvas.setViewportTransform(canvas.viewportTransform);
      canvas.isDragging = false;
    };

    const handleMouseWheel = (opt: any) => {
      const delta = opt.e.deltaY;
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** delta;
      if (zoom > 20) zoom = 20;
      if (zoom < 0.01) zoom = 0.01;
      canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    };

    // Grid Snapping logic
    const snapToGrid = (obj: fabric.FabricObject) => {
      const grid = 30;
      obj.set({
        left: Math.round((obj.left || 0) / grid) * grid,
        top: Math.round((obj.top || 0) / grid) * grid,
      });
    };

    canvas.on('object:moving', (options) => {
      if (paperType === 'grid' && options.target) {
        snapToGrid(options.target);
      }
    });

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);
    canvas.on('mouse:wheel', handleMouseWheel);
    
    const handleSelectionCreated = (e: any) => {
      onSelection?.(e.selected || []);
    };
    const handleSelectionUpdated = (e: any) => {
      onSelection?.(e.selected || []);
    };
    const handleSelectionCleared = () => {
      onSelection?.([]);
    };

    const handleObjectAdded = () => {
      if (!isUndoRedoRef.current) saveHistory();
    };
    const handleObjectModified = () => {
      if (!isUndoRedoRef.current) saveHistory();
    };
    const handleObjectRemoved = () => {
      if (!isUndoRedoRef.current) saveHistory();
    };

    canvas.on('selection:created', handleSelectionCreated);
    canvas.on('selection:updated', handleSelectionUpdated);
    canvas.on('selection:cleared', handleSelectionCleared);
    
    canvas.on('object:added', handleObjectAdded);
    canvas.on('object:modified', handleObjectModified);
    canvas.on('object:removed', handleObjectRemoved);

    // Initial state
    if (historyRef.current.length === 0) {
      saveHistory();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && !canvas.isDrawingMode) {
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length > 0) {
          canvas.discardActiveObject();
          canvas.remove(...activeObjects);
          canvas.renderAll();
        }
      }
      
      // CTRL+Z / CMD+Z Undo
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        const api = (ref as any).current;
        if (api && api.undo) api.undo();
      }

      // CTRL+Y or CTRL+SHIFT+Z Redo
      if ((e.ctrlKey || e.metaKey) && ((e.shiftKey && e.key === 'z') || e.key === 'y')) {
        e.preventDefault();
        const api = (ref as any).current;
        if (api && api.redo) api.redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
      canvas.off('mouse:wheel', handleMouseWheel);
      canvas.off('selection:created', handleSelectionCreated);
      canvas.off('selection:updated', handleSelectionUpdated);
      canvas.off('selection:cleared', handleSelectionCleared);
    };
  }, [tool, color, strokeWidth, activeLayerId, onSelection, saveHistory]);

  useEffect(() => { updateBackground(); }, [updateBackground]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#121212] flex items-center justify-center p-8 md:p-16 lg:p-24">
      <div 
        ref={containerRef} 
        className="w-full max-w-[1400px] h-full max-h-[1000px] shadow-[0_30px_100px_rgba(0,0,0,0.7)] border border-[#2D2D2E] bg-white relative overflow-hidden rounded-sm"
      >
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
});

