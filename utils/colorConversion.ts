// Color conversion utilities
import { deltaE2000 } from './deltaE';

/**
 * Converts a hex color string to RGB values
 */
export function hexToRgb(hex: string): { r: number, g: number, b: number } {
  // Remove the hash if present
  const cleanHex = hex.replace('#', '');
  
  // Parse the hex values
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  
  return { r, g, b };
}

/**
 * Converts RGB values to a hex color string
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = n.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return '#' + toHex(r) + toHex(g) + toHex(b);
}

/**
 * Converts RGB values to HSL color space
 */
export function rgbToHsl(r: number, g: number, b: number): { h: number, s: number, l: number } {
  // Convert RGB to [0,1] range
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case rr:
        h = (gg - bb) / d + (gg < bb ? 6 : 0);
        break;
      case gg:
        h = (bb - rr) / d + 2;
        break;
      case bb:
        h = (rr - gg) / d + 4;
        break;
    }
    h /= 6;
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/**
 * Converts RGB values to CMYK color space
 */
export function rgbToCmyk(r: number, g: number, b: number): { c: number, m: number, y: number, k: number } {
  // Convert RGB to [0,1] range
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  
  // Find key (black)
  const k = 1 - Math.max(rr, gg, bb);
  
  // Handle pure black
  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }
  
  // Calculate CMY values
  const c = (1 - rr - k) / (1 - k);
  const m = (1 - gg - k) / (1 - k);
  const y = (1 - bb - k) / (1 - k);
  
  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100)
  };
}

/**
 * Converts RGB color to CIE-LAB color space under D65 illuminant
 * Implementation follows ICC specifications for color management
 */
export function rgbToLab(r: number, g: number, b: number): { l: number, a: number, b: number } {
  // Convert RGB to XYZ
  // First, convert to linear RGB by removing gamma correction
  const rLinear = linearize(r / 255);
  const gLinear = linearize(g / 255);
  const bLinear = linearize(b / 255);
  
  // Convert to XYZ using D65 matrix
  const x = rLinear * 0.4124564 + gLinear * 0.3575761 + bLinear * 0.1804375;
  const y = rLinear * 0.2126729 + gLinear * 0.7151522 + bLinear * 0.0721750;
  const z = rLinear * 0.0193339 + gLinear * 0.1191920 + bLinear * 0.9503041;
  
  // Convert XYZ to LAB
  // Using D65 reference white point
  const xn = 0.95047;
  const yn = 1.00000;
  const zn = 1.08883;
  
  const fx = labTransform(x / xn);
  const fy = labTransform(y / yn);
  const fz = labTransform(z / zn);
  
  const l = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const bValue = 200 * (fy - fz);
  
  return { l, a, b: bValue };
}

/**
 * Helper function to linearize RGB values
 */
function linearize(value: number): number {
  return value <= 0.04045 
    ? value / 12.92 
    : Math.pow((value + 0.055) / 1.055, 2.4);
}

/**
 * Helper function for LAB transformation
 */
function labTransform(value: number): number {
  const epsilon = 216 / 24389;
  const kappa = 24389 / 27;
  
  return value > epsilon 
    ? Math.pow(value, 1/3) 
    : (kappa * value + 16) / 116;
}

/**
 * Converts LAB color back to RGB
 * Used for preview generation
 */
export function labToRgb(l: number, a: number, b: number): { r: number, g: number, b: number } {
  // First convert to XYZ
  const fy = (l + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;
  
  const xn = 0.95047;
  const yn = 1.00000;
  const zn = 1.08883;
  
  const x = xn * inverseLabTransform(fx);
  const y = yn * inverseLabTransform(fy);
  const z = zn * inverseLabTransform(fz);
  
  // Convert XYZ to linear RGB
  const rLinear = x *  3.2404542 - y * 1.5371385 - z * 0.4985314;
  const gLinear = -x * 0.9692660 + y * 1.8760108 + z * 0.0415560;
  const bLinear = x *  0.0556434 - y * 0.2040259 + z * 1.0572252;
  
  // Convert to sRGB
  const r = Math.round(delinearize(rLinear) * 255);
  const g = Math.round(delinearize(gLinear) * 255);
  const blue = Math.round(delinearize(bLinear) * 255);
  
  return { 
    r: clamp(r, 0, 255),
    g: clamp(g, 0, 255),
    b: clamp(blue, 0, 255)
  };
}

/**
 * Helper function to delinearize RGB values
 */
function delinearize(value: number): number {
  return value <= 0.0031308
    ? value * 12.92
    : 1.055 * Math.pow(value, 1/2.4) - 0.055;
}

/**
 * Helper function for inverse LAB transformation
 */
function inverseLabTransform(value: number): number {
  const epsilon = 216 / 24389;
  const kappa = 24389 / 27;
  const cube = value * value * value;
  
  return cube > epsilon 
    ? cube 
    : (116 * value - 16) / kappa;
}

/**
 * Clamps a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculates color difference using CIEDE2000
 * Returns a value where:
 * < 1.0: Difference is imperceptible
 * 1-2: Difference is perceptible through close observation
 * 2-10: Difference is perceptible at a glance
 * 11-49: Colors are more similar than opposite
 * 100: Colors are exact opposites
 */
export function calculateColorDifference(
  lab1: { l: number, a: number, b: number },
  lab2: { l: number, a: number, b: number }
): number {
  return deltaE2000(lab1, lab2);
}

/**
 * Determines if a color difference requires "Color-Correct" mode
 * Based on ISO 12647-2:2013 standards for printing
 */
export function needsColorCorrection(deltaE: number): boolean {
  return deltaE > 1.5; // Standard threshold for critical color matching
}