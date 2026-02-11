export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

export function toIsoString(date: Date) {
  return date.toISOString();
}

export function formatDate(dateInput?: string | null) {
  if (!dateInput) return 'Date unavailable';
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return date.toLocaleDateString('fr-FR');
}

export function formatDateRange(start?: string | null, end?: string | null) {
  if (!start || !end) return 'Dates unavailable';
  return `${formatDate(start)} - ${formatDate(end)}`;
}
