// shooting-manager-frontend/src/utils/formatters.js

/**
 * Formate un nombre en Won coréen
 * Format: 123.456 (point comme séparateur de milliers, pas de décimales)
 * Exemple: 850000 → ₩850.000
 */
export function formatWon(value) {
  if (value === null || value === undefined) return '₩0';
  
  // Convertir en nombre entier (pas de décimales)
  const roundedValue = Math.round(parseFloat(value));
  
  // Formater avec point comme séparateur de milliers
  const formatted = roundedValue.toLocaleString('de-DE');
  
  return `₩${formatted}`;
}

/**
 * Formate juste le nombre sans le symbole Won
 */
export function formatNumber(value) {
  if (value === null || value === undefined) return '0';
  
  const roundedValue = Math.round(parseFloat(value));
  return roundedValue.toLocaleString('de-DE');
}