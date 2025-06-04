import { deltaE2000 } from './deltaE';

export interface ColorName {
  name: string;
  lab: { l: number; a: number; b: number };
  hex: string;
  category: string;
  source?: string;
  alternateNames?: string[];
  pantone?: string;
  ncs?: string;
  ral?: string;
}

// Import the full JSON array
import rawColors from '../data/all_colors.json';
export const colorDatabase: ColorName[] = rawColors.colors;

// Enhanced perceptual weights for different color attributes
const weights = {
  lightness: 2.0,    // Increased weight for lightness differences
  chroma: 1.5,       // Increased weight for saturation differences
  hue: 1.2,          // Increased weight for hue differences
  deltaE: 1.8        // Base deltaE weight
};

// Descriptive modifiers for better color naming
const modifiers = {
  lightness: {
    veryLight: 20,
    light: 10,
    dark: -10,
    veryDark: -20
  },
  saturation: {
    vivid: 1.3,
    bright: 1.15,
    muted: 0.85,
    dull: 0.7
  }
};

function calculatePerceptualDifference(
  lab1: { l: number; a: number; b: number },
  lab2: { l: number; a: number; b: number }
): number {
  // Calculate base deltaE
  const dE = deltaE2000(lab1, lab2);
  
  // Calculate chroma (saturation) values
  const c1 = Math.sqrt(lab1.a * lab1.a + lab1.b * lab1.b);
  const c2 = Math.sqrt(lab2.a * lab2.a + lab2.b * lab2.b);
  
  // Calculate hue angles
  const h1 = Math.atan2(lab1.b, lab1.a);
  const h2 = Math.atan2(lab2.b, lab2.a);
  
  // Calculate weighted differences
  const dL = Math.abs(lab1.l - lab2.l) * weights.lightness;
  const dC = Math.abs(c1 - c2) * weights.chroma;
  const dH = (Math.abs(h1 - h2) / Math.PI) * weights.hue;
  
  // Combine all differences with weights
  return (dE * weights.deltaE + dL + dC + dH) / 4;
}

function getColorModifiers(
  targetLab: { l: number; a: number; b: number },
  baseColor: ColorName
): string[] {
  const modifierList: string[] = [];
  
  // Calculate lightness difference
  const dL = targetLab.l - baseColor.lab.l;
  if (dL >= modifiers.lightness.veryLight) {
    modifierList.push('Very Light');
  } else if (dL >= modifiers.lightness.light) {
    modifierList.push('Light');
  } else if (dL <= modifiers.lightness.veryDark) {
    modifierList.push('Very Dark');
  } else if (dL <= modifiers.lightness.dark) {
    modifierList.push('Dark');
  }
  
  // Calculate saturation difference
  const targetChroma = Math.sqrt(targetLab.a * targetLab.a + targetLab.b * targetLab.b);
  const baseChroma = Math.sqrt(
    baseColor.lab.a * baseColor.lab.a + 
    baseColor.lab.b * baseColor.lab.b
  );
  const saturationRatio = targetChroma / baseChroma;
  
  if (saturationRatio >= modifiers.saturation.vivid) {
    modifierList.push('Vivid');
  } else if (saturationRatio >= modifiers.saturation.bright) {
    modifierList.push('Bright');
  } else if (saturationRatio <= modifiers.saturation.dull) {
    modifierList.push('Dull');
  } else if (saturationRatio <= modifiers.saturation.muted) {
    modifierList.push('Muted');
  }
  
  return modifierList;
}

export function findClosestColorName(targetLab: { l: number; a: number; b: number }): string {
  let closestColor = colorDatabase[0];
  let smallestDiff = Infinity;
  let secondClosestColor = colorDatabase[1];
  let secondSmallestDiff = Infinity;
  
  // Find the two closest matching colors
  for (const color of colorDatabase) {
    const diff = calculatePerceptualDifference(targetLab, color.lab);
    
    if (diff < smallestDiff) {
      secondClosestColor = closestColor;
      secondSmallestDiff = smallestDiff;
      closestColor = color;
      smallestDiff = diff;
    } else if (diff < secondSmallestDiff) {
      secondClosestColor = color;
      secondSmallestDiff = diff;
    }
  }

  // If we have a very close match (deltaE < 2), use the exact name
  if (deltaE2000(targetLab, closestColor.lab) < 2) {
    return closestColor.name;
  }

  // Get modifiers based on the differences
  const modifierList = getColorModifiers(targetLab, closestColor);
  
  // If the color is between two named colors, use interpolation
  if (Math.abs(smallestDiff - secondSmallestDiff) < 5) {
    const firstColorWeight = secondSmallestDiff / (smallestDiff + secondSmallestDiff);
    const secondColorWeight = smallestDiff / (smallestDiff + secondSmallestDiff);
    
    if (firstColorWeight > 0.3 && secondColorWeight > 0.3) {
      return `${closestColor.name}-${secondClosestColor.name} Blend`;
    }
  }

  // Return the modified color name
  return modifierList.length > 0
    ? `${modifierList.join(' ')} ${closestColor.name}`
    : closestColor.name;
}

export function getColorInfo(lab: { l: number; a: number; b: number }): ColorName | null {
  if (!lab || colorDatabase.length === 0) return null;
  
  let closestColor = colorDatabase[0];
  let smallestDiff = Infinity;
  
  for (const color of colorDatabase) {
    const diff = calculatePerceptualDifference(lab, color.lab);
    if (diff < smallestDiff) {
      smallestDiff = diff;
      closestColor = color;
    }
  }
  
  return closestColor;
}