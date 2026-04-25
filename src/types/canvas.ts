/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ToolType = 'pencil' | 'pen' | 'brush' | 'marker' | 'eraser' | 'select' | 'pan' | 'rect' | 'circle' | 'text' | 'triangle' | 'star' | 'fill';

export interface ColorHSL {
  h: number;
  s: number;
  l: number;
}

export interface Layer {
  id: string;
  name: string;
  opacity: number;
  visible: boolean;
  locked: boolean;
}

export interface CanvasState {
  zoom: number;
  panX: number;
  panY: number;
  selectedTool: ToolType;
  currentColor: string;
  strokeWidth: number;
  paperType: 'plain' | 'grid' | 'dots' | 'lined';
  layers: Layer[];
  activeLayerId: string;
}

export const COPIC_COLORS = [
  { name: 'R27', color: '#E32D2D' }, // Cadmium Red
  { name: 'Y06', color: '#FFF300' }, // Yellow
  { name: 'G07', color: '#00A651' }, // Nile Green
  { name: 'B29', color: '#0054A6' }, // Ultramarine
  { name: 'V09', color: '#4E2D87' }, // Violet
  { name: 'YR04', color: '#F7941D' }, // Chrome Orange
  { name: 'E29', color: '#603913' }, // Burnt Umber
  { name: 'C7', color: '#58595B' }, // Cool Gray No. 7
  { name: '100', color: '#000000' }, // Black
];
