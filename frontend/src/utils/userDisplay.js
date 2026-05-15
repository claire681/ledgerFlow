export function getFirstName(raw) {
  if (!raw) return 'there';

  // If it looks like an email, take the part before @
  let base = raw.includes('@') ? raw.split('@')[0] : raw;

  // Remove trailing digits (e.g. clairekemanzi01 → clairekemanzi)
  base = base.replace(/\d+$/, '');

  // Remove separators like dots, underscores, hyphens
  base = base.replace(/[._-]/g, ' ').trim();

  // Capitalize first letter of each word
  const words = base.split(' ').filter(Boolean).map(w =>
    w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
  );

  if (words.length === 0) return 'there';

  // Return only the first word
  return words[0];
}