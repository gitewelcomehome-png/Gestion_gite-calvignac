import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://gltdpwcqkzmxsqqxibnh.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsdGRwd2Nxa3pteHNxcXhpYm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQxODI3NjAsImV4cCI6MjA0OTc1ODc2MH0.5OoYE1IQV5_ikmxLJFCLQqDOtb3VxMQ6u-SIiE16REE'
);

const { data: todos, error } = await supabase
    .from('todos')
    .select('*')
    .eq('category', 'reservations')
    .eq('completed', false)
    .is('archived_at', null)
    .order('created_at', { ascending: false });

console.log('=== TÂCHES RÉSERVATIONS ===');
console.log('Total:', todos?.length || 0);
console.log('\n');

if (todos && todos.length > 0) {
    todos.forEach(todo => {
        console.log(`ID: ${todo.id}`);
        console.log(`Titre: ${todo.title}`);
        console.log(`Récurrente: ${todo.is_recurrent}`);
        console.log(`Fréquence: ${todo.frequency}`);
        console.log(`Détail fréquence: ${JSON.stringify(todo.frequency_detail)}`);
        console.log(`Prochaine occurrence: ${todo.next_occurrence}`);
        console.log(`Date création: ${todo.created_at}`);
        
        if (todo.is_recurrent && todo.next_occurrence) {
            const nextDate = new Date(todo.next_occurrence);
            const now = new Date();
            const diff = nextDate - now;
            const daysDiff = Math.floor(diff / (1000 * 60 * 60 * 24));
            console.log(`👉 Visible: ${nextDate <= now ? 'OUI ✅' : `NON ❌ (dans ${daysDiff} jours)`}`);
        }
        console.log('---');
    });
}

if (error) console.error('Erreur:', error);
