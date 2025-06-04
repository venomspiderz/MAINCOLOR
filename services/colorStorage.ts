import AsyncStorage from '@react-native-async-storage/async-storage';
import { EventEmitter } from 'events';

// Event emitter for color history changes
const eventEmitter = new EventEmitter();

// Types
export interface Color {
  id: string;
  hex: string;
  name: string;
  createdAt: string;
  location?: string;
  lab?: {
    l: number;
    a: number;
    b: number;
  };
}

export interface Palette {
  id: string;
  name: string;
  colors: string[];
  createdAt: string;
  updatedAt: string;
}

// Keys for AsyncStorage
const KEYS = {
  COLORS: 'colorlens:colors',
  PALETTES: 'colorlens:palettes',
  COLOR_HISTORY: 'colorlens:color_history',
};

// Event names
export const EVENTS = {
  HISTORY_UPDATED: 'historyUpdated',
  PALETTES_UPDATED: 'palettesUpdated',
};

// Service for storing and retrieving colors and palettes
export const colorStorage = {
  // Subscribe to history changes
  onHistoryChange(callback: () => void) {
    eventEmitter.on(EVENTS.HISTORY_UPDATED, callback);
    return () => eventEmitter.off(EVENTS.HISTORY_UPDATED, callback);
  },

  // Subscribe to palette changes
  onPalettesChange(callback: () => void) {
    eventEmitter.on(EVENTS.PALETTES_UPDATED, callback);
    return () => eventEmitter.off(EVENTS.PALETTES_UPDATED, callback);
  },

  // Color Operations
  async saveColor(color: Color): Promise<void> {
    try {
      const colorsJson = await AsyncStorage.getItem(KEYS.COLORS);
      const colors: Color[] = colorsJson ? JSON.parse(colorsJson) : [];
      
      colors.push(color);
      
      await AsyncStorage.setItem(KEYS.COLORS, JSON.stringify(colors));
      
      await this.addToHistory(color.id);
      eventEmitter.emit(EVENTS.HISTORY_UPDATED);
    } catch (error) {
      console.error('Error saving color:', error);
      throw error;
    }
  },
  
  async getColor(id: string): Promise<Color | null> {
    try {
      const colorsJson = await AsyncStorage.getItem(KEYS.COLORS);
      const colors: Color[] = colorsJson ? JSON.parse(colorsJson) : [];
      
      return colors.find(color => color.id === id) || null;
    } catch (error) {
      console.error('Error getting color:', error);
      throw error;
    }
  },
  
  async getAllColors(): Promise<Color[]> {
    try {
      const colorsJson = await AsyncStorage.getItem(KEYS.COLORS);
      return colorsJson ? JSON.parse(colorsJson) : [];
    } catch (error) {
      console.error('Error getting all colors:', error);
      throw error;
    }
  },
  
  async deleteColor(id: string): Promise<void> {
    try {
      const colorsJson = await AsyncStorage.getItem(KEYS.COLORS);
      const colors: Color[] = colorsJson ? JSON.parse(colorsJson) : [];
      
      const updatedColors = colors.filter(color => color.id !== id);
      
      await AsyncStorage.setItem(KEYS.COLORS, JSON.stringify(updatedColors));
      
      await this.removeFromHistory(id);
      
      const palettesJson = await AsyncStorage.getItem(KEYS.PALETTES);
      const palettes: Palette[] = palettesJson ? JSON.parse(palettesJson) : [];
      
      const updatedPalettes = palettes.map(palette => ({
        ...palette,
        colors: palette.colors.filter(colorId => colorId !== id)
      }));
      
      await AsyncStorage.setItem(KEYS.PALETTES, JSON.stringify(updatedPalettes));
      eventEmitter.emit(EVENTS.HISTORY_UPDATED);
      eventEmitter.emit(EVENTS.PALETTES_UPDATED);
    } catch (error) {
      console.error('Error deleting color:', error);
      throw error;
    }
  },
  
  // Palette Operations
  async savePalette(palette: Palette): Promise<void> {
    try {
      const palettesJson = await AsyncStorage.getItem(KEYS.PALETTES);
      const palettes: Palette[] = palettesJson ? JSON.parse(palettesJson) : [];
      
      const existingIndex = palettes.findIndex(p => p.id === palette.id);
      
      if (existingIndex >= 0) {
        palettes[existingIndex] = {
          ...palette,
          updatedAt: new Date().toISOString(),
        };
      } else {
        palettes.push(palette);
      }
      
      await AsyncStorage.setItem(KEYS.PALETTES, JSON.stringify(palettes));
      eventEmitter.emit(EVENTS.PALETTES_UPDATED);
    } catch (error) {
      console.error('Error saving palette:', error);
      throw error;
    }
  },
  
  async getPalette(id: string): Promise<Palette | null> {
    try {
      const palettesJson = await AsyncStorage.getItem(KEYS.PALETTES);
      const palettes: Palette[] = palettesJson ? JSON.parse(palettesJson) : [];
      
      return palettes.find(palette => palette.id === id) || null;
    } catch (error) {
      console.error('Error getting palette:', error);
      throw error;
    }
  },
  
  async getAllPalettes(): Promise<Palette[]> {
    try {
      const palettesJson = await AsyncStorage.getItem(KEYS.PALETTES);
      return palettesJson ? JSON.parse(palettesJson) : [];
    } catch (error) {
      console.error('Error getting all palettes:', error);
      throw error;
    }
  },
  
  async deletePalette(id: string): Promise<void> {
    try {
      const palettesJson = await AsyncStorage.getItem(KEYS.PALETTES);
      const palettes: Palette[] = palettesJson ? JSON.parse(palettesJson) : [];
      
      const updatedPalettes = palettes.filter(palette => palette.id !== id);
      
      await AsyncStorage.setItem(KEYS.PALETTES, JSON.stringify(updatedPalettes));
      eventEmitter.emit(EVENTS.PALETTES_UPDATED);
    } catch (error) {
      console.error('Error deleting palette:', error);
      throw error;
    }
  },
  
  async addColorToPalette(paletteId: string, colorId: string): Promise<void> {
    try {
      const palette = await this.getPalette(paletteId);
      
      if (!palette) {
        throw new Error(`Palette with id ${paletteId} not found`);
      }
      
      if (palette.colors.includes(colorId)) {
        return;
      }
      
      palette.colors.push(colorId);
      palette.updatedAt = new Date().toISOString();
      
      await this.savePalette(palette);
      eventEmitter.emit(EVENTS.PALETTES_UPDATED);
    } catch (error) {
      console.error('Error adding color to palette:', error);
      throw error;
    }
  },
  
  async removeColorFromPalette(paletteId: string, colorId: string): Promise<void> {
    try {
      const palette = await this.getPalette(paletteId);
      
      if (!palette) {
        throw new Error(`Palette with id ${paletteId} not found`);
      }
      
      palette.colors = palette.colors.filter(id => id !== colorId);
      palette.updatedAt = new Date().toISOString();
      
      await this.savePalette(palette);
      eventEmitter.emit(EVENTS.PALETTES_UPDATED);
    } catch (error) {
      console.error('Error removing color from palette:', error);
      throw error;
    }
  },
  
  // History Operations
  async getColorHistory(limit: number = 50): Promise<Color[]> {
    try {
      const historyJson = await AsyncStorage.getItem(KEYS.COLOR_HISTORY);
      const history: string[] = historyJson ? JSON.parse(historyJson) : [];
      
      const colors: Color[] = [];
      
      for (const colorId of history.slice(0, limit)) {
        const color = await this.getColor(colorId);
        if (color) {
          colors.push(color);
        }
      }
      
      return colors;
    } catch (error) {
      console.error('Error getting color history:', error);
      throw error;
    }
  },
  
  async addToHistory(colorId: string): Promise<void> {
    try {
      const historyJson = await AsyncStorage.getItem(KEYS.COLOR_HISTORY);
      let history: string[] = historyJson ? JSON.parse(historyJson) : [];
      
      history = history.filter(id => id !== colorId);
      history.unshift(colorId);
      history = history.slice(0, 100);
      
      await AsyncStorage.setItem(KEYS.COLOR_HISTORY, JSON.stringify(history));
      eventEmitter.emit(EVENTS.HISTORY_UPDATED);
    } catch (error) {
      console.error('Error adding to history:', error);
      throw error;
    }
  },
  
  async removeFromHistory(colorId: string): Promise<void> {
    try {
      const historyJson = await AsyncStorage.getItem(KEYS.COLOR_HISTORY);
      let history: string[] = historyJson ? JSON.parse(historyJson) : [];
      
      history = history.filter(id => id !== colorId);
      
      await AsyncStorage.setItem(KEYS.COLOR_HISTORY, JSON.stringify(history));
      eventEmitter.emit(EVENTS.HISTORY_UPDATED);
    } catch (error) {
      console.error('Error removing from history:', error);
      throw error;
    }
  },
  
  async clearHistory(): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.COLOR_HISTORY, JSON.stringify([]));
      eventEmitter.emit(EVENTS.HISTORY_UPDATED);
    } catch (error) {
      console.error('Error clearing history:', error);
      throw error;
    }
  },
  
  // Utility functions
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        KEYS.COLORS,
        KEYS.PALETTES,
        KEYS.COLOR_HISTORY
      ]);
      eventEmitter.emit(EVENTS.HISTORY_UPDATED);
      eventEmitter.emit(EVENTS.PALETTES_UPDATED);
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }
};