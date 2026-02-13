export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

export function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  // En France, la semaine commence le lundi (1), le dimanche est 0
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  return startOfDay(result);
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

// Nouvelles fonctions pour le calendrier
export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function addMonths(date: Date, months: number) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function subMonths(date: Date, months: number) {
  return addMonths(date, -months);
}

export function formatYYYYMMDD(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatMonthYear(date: Date) {
  const months = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatFullDate(date: Date) {
  return date.toLocaleDateString('fr-FR', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });
}
