/**
 * Tracking Code Generation Service
 * Generates unique codes in format: #MZ-ABC123-XYZ
 */

export function generateTrackingCode(): string {
  // Generate random alphanumeric parts
  const part1 = generateRandomString(3).toUpperCase(); // ABC
  const part2 = generateRandomNumbers(3); // 123
  const part3 = generateRandomString(3).toUpperCase(); // XYZ

  return `#MZ-${part1}${part2}-${part3}`;
}

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateRandomNumbers(length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10);
  }
  return result;
}

/**
 * Validate tracking code format
 */
export function validateTrackingCode(code: string): boolean {
  const pattern = /^#MZ-[A-Z]{3}\d{3}-[A-Z]{3}$/;
  return pattern.test(code);
}
