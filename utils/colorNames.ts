// Comprehensive color database with accurate LAB values
import { deltaE2000 } from './deltaE';
import { colorDatabase } from './colorDatabase';

interface ColorName {
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

// Advanced color matching using perceptual color spaces
function findClosestColorInSpace(
  targetLab: { l: number; a: number; b: number },
  space: 'natural' | 'artistic' | 'technical' = 'natural'
): ColorName {
  const weights = {
    natural: { l: 1, a: 1, b: 1 },
    artistic: { l: 0.8, a: 1.2, b: 1.2 },
    technical: { l: 1.2, a: 0.9, b: 0.9 }
  };

  let closestColor = colorDatabase[0];
  let smallestDeltaE = Infinity;

  for (const color of colorDatabase) {
    const deltaE = deltaE2000(targetLab, color.lab);
    const weightedDeltaE = deltaE * weights[space].l;
    
    if (weightedDeltaE < smallestDeltaE) {
      smallestDeltaE = weightedDeltaE;
      closestColor = color;
    }
  }

  return closestColor;
}

export function findClosestColorName(targetLab: { l: number; a: number; b: number }): string {
  // Try different perceptual spaces and combine results
  const naturalMatch = findClosestColorInSpace(targetLab, 'natural');
  const artisticMatch = findClosestColorInSpace(targetLab, 'artistic');
  const technicalMatch = findClosestColorInSpace(targetLab, 'technical');

  // Calculate confidence scores
  const scores = [
    { color: naturalMatch, weight: 0.4 },
    { color: artisticMatch, weight: 0.35 },
    { color: technicalMatch, weight: 0.25 }
  ];

  // Find the best match based on weighted scores
  let bestMatch = scores[0].color;
  let highestScore = 0;

  for (const { color, weight } of scores) {
    const deltaE = deltaE2000(targetLab, color.lab);
    const score = (1 - deltaE / 100) * weight;
    
    if (score > highestScore) {
      highestScore = score;
      bestMatch = color;
    }
  }

  // Return the name with additional context if available
  if (bestMatch.alternateNames && bestMatch.alternateNames.length > 0) {
    return `${bestMatch.name} (${bestMatch.alternateNames[0]})`;
  }

  return bestMatch.name;
}

// Helper function to get color information
export function getColorInfo(lab: { l: number; a: number; b: number }): ColorName | null {
  return findClosestColorInSpace(lab, 'natural');
}