// Test pour voir le problème de date
const testDate = new Date('2025-12-31');
console.log('Date test:', testDate);
console.log('ISO:', testDate.toISOString());
console.log('ISO split:', testDate.toISOString().split('T')[0]);
console.log('toLocaleDateString:', testDate.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' }));
