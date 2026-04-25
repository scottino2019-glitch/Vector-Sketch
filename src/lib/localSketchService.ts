/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface Sketch {
  id: string;
  name: string;
  canvasData: string;
  updatedAt: number;
  createdAt: number;
}

const STORAGE_KEY = 'draw_app_sketches';

export const LocalSketchService = {
  getSketchesList(): Sketch[] {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error("Error parsing sketches from localStorage", e);
      return [];
    }
  },

  saveSketchesList(sketches: Sketch[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sketches));
  },

  async saveSketch(id: string, name: string, canvasData: string) {
    const sketches = this.getSketchesList();

    const index = sketches.findIndex(s => s.id === id);
    const now = Date.now();

    if (index === -1) {
      sketches.push({
        id,
        name,
        canvasData,
        createdAt: now,
        updatedAt: now
      });
    } else {
      sketches[index] = {
        ...sketches[index],
        name,
        canvasData,
        updatedAt: now
      };
    }

    this.saveSketchesList(sketches);
    return Promise.resolve();
  },

  async getSketches() {
    const sketches = this.getSketchesList();
    // Sort by updatedAt descending
    return Promise.resolve(sketches.sort((a, b) => b.updatedAt - a.updatedAt));
  },

  async deleteSketch(id: string) {
    let sketches = this.getSketchesList();
    sketches = sketches.filter(s => s.id !== id);
    this.saveSketchesList(sketches);
    return Promise.resolve();
  }
};
