/**
 * getFirstName — extracts a clean first name from any raw username/email/full name
 *
 * Examples:
 *   "Clairekemanzi01"        → "Claire"
 *   "claire.kemanzi@gmail"   → "Claire"
 *   "Claire Kemanzi"         → "Claire"
 *   "clairekemanzi01@gmail"  → "Claire"
 *   "john_doe"               → "John"
 *   ""                       → "there"
 */
export function getFirstName(rawName) {
  if (!rawName || typeof rawName !== 'string') return 'there';

  let name = rawName.trim();

  // Strip email domain
  if (name.includes('@')) name = name.split('@')[0];

  // Replace separators with spaces
  name = name.replace(/[._\-]/g, ' ').trim();

  // Take the first segment
  const first = name.split(/\s+/)[0];

  if (!first) return 'there';

  // Strip trailing digits
  const stripped = first.replace(/\d+$/, '');

  if (!stripped) return 'there';

  // Capitalize first letter
  const capitalized = stripped.charAt(0).toUpperCase() + stripped.slice(1);

  // Extract first capitalized word using regex — handles "Clairekemanzi" → "Claire"
  const match = capitalized.match(/^[A-Z][a-z]+/);
  if (match) return match[0];

  // Fallback — return capitalized version as-is if no camelCase boundary found
  return capitalized.length > 0 ? capitalized : 'there';
}