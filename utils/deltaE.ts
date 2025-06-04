/**
 * Implements the CIEDE2000 color difference formula
 * Based on the paper "The CIEDE2000 Color-Difference Formula: Implementation Notes,
 * Supplementary Test Data, and Mathematical Observations" by Gaurav Sharma et al.
 */
export function deltaE2000(
  lab1: { l: number, a: number, b: number },
  lab2: { l: number, a: number, b: number }
): number {
  // Constants
  const kL = 1;
  const kC = 1;
  const kH = 1;
  
  // Calculate Cprime
  const C1 = Math.sqrt(lab1.a * lab1.a + lab1.b * lab1.b);
  const C2 = Math.sqrt(lab2.a * lab2.a + lab2.b * lab2.b);
  const Cbar = (C1 + C2) / 2;
  
  // Calculate aprime
  const C7 = Math.pow(Cbar, 7);
  const G = 0.5 * (1 - Math.sqrt(C7 / (C7 + Math.pow(25, 7))));
  const a1prime = (1 + G) * lab1.a;
  const a2prime = (1 + G) * lab2.a;
  
  // Calculate Cprime
  const C1prime = Math.sqrt(a1prime * a1prime + lab1.b * lab1.b);
  const C2prime = Math.sqrt(a2prime * a2prime + lab2.b * lab2.b);
  const Cbar_prime = (C1prime + C2prime) / 2;
  
  // Calculate h'ab
  let h1prime = Math.atan2(lab1.b, a1prime) * 180 / Math.PI;
  if (h1prime < 0) h1prime += 360;
  
  let h2prime = Math.atan2(lab2.b, a2prime) * 180 / Math.PI;
  if (h2prime < 0) h2prime += 360;
  
  // Calculate ΔH'
  const deltaHprime = calculateDeltaHprime(C1prime, C2prime, h1prime, h2prime);
  
  // Calculate ΔL', ΔC', ΔH'
  const deltaLprime = lab2.l - lab1.l;
  const deltaCprime = C2prime - C1prime;
  
  // Calculate CIEDE2000
  const L_term = deltaLprime / (kL * SL(lab1.l));
  const C_term = deltaCprime / (kC * SC(Cbar_prime));
  const H_term = deltaHprime / (kH * SH(Cbar_prime));
  
  return Math.sqrt(L_term * L_term + C_term * C_term + H_term * H_term);
}

/**
 * Helper function to calculate ΔH'
 */
function calculateDeltaHprime(
  C1prime: number,
  C2prime: number,
  h1prime: number,
  h2prime: number
): number {
  let dhprime;
  const hdiff = h2prime - h1prime;
  
  if (C1prime * C2prime === 0) {
    dhprime = 0;
  } else if (Math.abs(hdiff) <= 180) {
    dhprime = hdiff;
  } else if (hdiff > 180) {
    dhprime = hdiff - 360;
  } else {
    dhprime = hdiff + 360;
  }
  
  return 2 * Math.sqrt(C1prime * C2prime) * Math.sin(dhprime * Math.PI / 360);
}

/**
 * Lightness weighting function
 */
function SL(L: number): number {
  return 1 + (0.015 * Math.pow(L - 50, 2)) / Math.sqrt(20 + Math.pow(L - 50, 2));
}

/**
 * Chroma weighting function
 */
function SC(C: number): number {
  return 1 + 0.045 * C;
}

/**
 * Hue weighting function
 */
function SH(C: number): number {
  return 1 + 0.015 * C;
}