import { calculateColorDifference, rgbToLab, labToRgb, hexToRgb } from './colorConversion';
import { colorDatabase } from './colorDatabase';

interface Paint {
  id: string;
  name: string;
  hex: string;
  lab: { l: number; a: number; b: number };
  opacity: number;
  mixability: number;
  costFactor: number;
}

// Convert color database entries to paint database
const paintDatabase: Paint[] = colorDatabase.map(color => ({
  id: color.name.toLowerCase().replace(/\s+/g, '-'),
  name: color.name,
  hex: color.hex,
  lab: color.lab,
  opacity: 0.9,
  mixability: 0.85,
  costFactor: 1.0
}));

interface MixResult {
  paints: Array<{ paint: Paint; percentage: number }>;
  deltaE: number;
  estimatedCost: number;
  requiresColorCorrection: boolean;
}

function findClosestPaints(targetLab: { l: number; a: number; b: number }): Paint[] {
  // Always include white and black
  const white = paintDatabase.find(p => p.lab.l > 95);
  const black = paintDatabase.find(p => p.lab.l < 5);
  
  // Sort remaining paints by color difference
  const sortedPaints = paintDatabase
    .filter(p => p !== white && p !== black)
    .sort((a, b) => {
      const diffA = calculateColorDifference(targetLab, a.lab);
      const diffB = calculateColorDifference(targetLab, b.lab);
      return diffA - diffB;
    });

  // Return white, black, and the 3 closest matching paints
  return [
    white!,
    black!,
    ...sortedPaints.slice(0, 3)
  ].filter(Boolean);
}

function mixColors(paints: Array<{ paint: Paint; percentage: number }>): { l: number; a: number; b: number } {
  let l = 0, a = 0, b = 0;
  const totalPercentage = paints.reduce((sum, p) => sum + p.percentage, 0);

  for (const { paint, percentage } of paints) {
    const weight = percentage / totalPercentage;
    l += paint.lab.l * weight;
    a += paint.lab.a * weight;
    b += paint.lab.b * weight;
  }

  return { l, a, b };
}

function optimizeMixture(
  targetLab: { l: number; a: number; b: number },
  basePaints: Paint[]
): Array<{ paint: Paint; percentage: number }> {
  const steps = 20; // Number of steps for each paint percentage
  let bestMix: Array<{ paint: Paint; percentage: number }> = [];
  let bestDeltaE = Infinity;

  // Try different combinations systematically
  for (let i = 0; i <= steps; i++) {
    const p1 = (i / steps) * 100;
    for (let j = 0; j <= steps - i; j++) {
      const p2 = (j / steps) * 100;
      for (let k = 0; k <= steps - i - j; k++) {
        const p3 = (k / steps) * 100;
        const p4 = 100 - p1 - p2 - p3;
        
        if (p4 < 0) continue;

        const mix = [
          { paint: basePaints[0], percentage: p1 },
          { paint: basePaints[1], percentage: p2 },
          { paint: basePaints[2], percentage: p3 },
          { paint: basePaints[3], percentage: p4 }
        ].filter(p => p.percentage > 0);

        const mixedColor = mixColors(mix);
        const deltaE = calculateColorDifference(targetLab, mixedColor);

        if (deltaE < bestDeltaE) {
          bestDeltaE = deltaE;
          bestMix = mix;
        }
      }
    }
  }

  return bestMix;
}

export function generatePaintRecipe(
  targetLab: { l: number; a: number; b: number },
  options = {
    maxPaints: 4,
    preferCostEffective: false,
    allowColorCorrection: true
  }
): MixResult {
  // Find the best base paints to use
  const basePaints = findClosestPaints(targetLab);
  
  // Optimize the mixture
  const mixture = optimizeMixture(targetLab, basePaints);
  
  // Calculate final color
  const mixedColor = mixColors(mixture);
  const deltaE = calculateColorDifference(targetLab, mixedColor);

  // Round percentages to one decimal place
  const finalMixture = mixture.map(m => ({
    ...m,
    percentage: Math.round(m.percentage * 10) / 10
  }));

  return {
    paints: finalMixture,
    deltaE,
    estimatedCost: finalMixture.reduce((cost, { paint, percentage }) => 
      cost + (paint.costFactor * percentage / 100), 0),
    requiresColorCorrection: deltaE > 1.5
  };
}