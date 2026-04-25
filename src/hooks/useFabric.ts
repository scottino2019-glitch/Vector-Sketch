/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';

export function useFabric(options: Partial<fabric.TOptions<fabric.CanvasOptions>> = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      ...options,
      enableRetinaScaling: true,
      fireRightClick: true,
      stopContextMenu: true,
    });

    fabricRef.current = canvas;

    const handleResize = () => {
      if (containerRef.current && fabricRef.current) {
        fabricRef.current.setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
        fabricRef.current.renderAll();
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.dispose();
    };
  }, []);

  return { canvasRef, fabricRef, containerRef };
}
