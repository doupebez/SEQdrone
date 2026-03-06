import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculatePriorityScore(severity: string, condition: string, confidence: number): number {
  const severityMap: Record<string, number> = { 'Critical': 100, 'High': 70, 'Medium': 40, 'Low': 10 };
  const conditionMap: Record<string, number> = { 'Critical': 100, 'Poor': 70, 'Fair': 40, 'Good': 10, 'Excellent': 0 };

  const sev = severityMap[severity] || 0;
  const cond = conditionMap[condition] || 0;

  // Weighted score: 50% severity, 30% condition, 20% confidence
  const score = (sev * 0.5) + (cond * 0.3) + (confidence * 0.2);
  return Math.round(score);
}
/**
 * Calculates the area of a polygon using the Shoelace formula.
 * @param polygon Array of [y, x] coordinates in normalized 0-1000 scale.
 * @param pixelsPerMeter The calibration constant (ppm).
 * @returns Area in square meters.
 */
export function calculatePolygonArea(polygon: number[][], pixelsPerMeter: number): number {
  if (!polygon || polygon.length < 3) return 0;

  let area = 0;
  for (let i = 0; i < polygon.length; i++) {
    const [y1, x1] = polygon[i];
    const [y2, x2] = polygon[(i + 1) % polygon.length];

    area += (x1 * y2) - (x2 * y1);
  }

  area = Math.abs(area) / 2;

  // area is currently in "normalized units squared" (where 1000x1000 is the total square).
  // Meters per normalized unit = 1 / pixelsPerMeter (assuming normalized 1000 = current image resolution)
  // Actually, our pixelsPerMeter is relative to the REAL image size.
  // Our normalized 1000 is a representation of that size.
  // So normalized unit in meters = (Actual Image Width / 1000) / (pixelsPerMeter / ???)
  // Simplified: 1000 / pixelsPerMeter = Real Width.
  // normalized 1 unit = (1000 / pixelsPerMeter) / 1000 = 1 / pixelsPerMeter
  return area * Math.pow(1 / pixelsPerMeter, 2);
}
export function calculateGrowthDelta(currentArea: number, previousArea: number) {
  if (previousArea <= 0) return { percentChange: 0, status: 'New' as const };

  const delta = currentArea - previousArea;
  const percentChange = (delta / previousArea) * 100;

  let status: 'Growing' | 'Stable' | 'Shrinking' = 'Stable';
  if (percentChange > 5) status = 'Growing';
  else if (percentChange < -5) status = 'Shrinking';

  return {
    previousArea,
    currentArea,
    percentChange: Math.round(percentChange),
    status
  };
}
