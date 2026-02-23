/**
 * Variable-scale range validation for appearance (and other ordinal) dimensions.
 * DB CHECK allows 1–5; app layer must enforce min/max <= scale length so 3-label
 * dimensions never store 4 or 5. Use this in seed and any future appearance
 * insert/update endpoints.
 */
export function validateOrdinalRange(
  scaleLength: number,
  minValue: number,
  maxValue: number
): { valid: true } | { valid: false; message: string } {
  if (scaleLength < 1) {
    return { valid: false, message: "scaleLength must be >= 1" };
  }
  if (minValue < 1 || minValue > scaleLength) {
    return {
      valid: false,
      message: `minValue ${minValue} must be between 1 and ${scaleLength}`,
    };
  }
  if (maxValue < 1 || maxValue > scaleLength) {
    return {
      valid: false,
      message: `maxValue ${maxValue} must be between 1 and ${scaleLength}`,
    };
  }
  if (minValue > maxValue) {
    return { valid: false, message: "minValue must be <= maxValue" };
  }
  return { valid: true };
}
