-- Vérifier quelles tables existent déjà
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name IN (
    'gites', 'reservations', 'cleaning_schedule', 'charges',
    'demandes_horaires', 'retours_menage', 'stocks_draps',
    'infos_pratiques', 'faq', 'todos', 'problemes_signales',
    'simulations_fiscales', 'suivi_soldes_bancaires',
    'infos_gites', 'client_access_tokens', 'fiche_generation_logs',
    'retours_clients', 'activites_gites', 'activites_consultations',
    'checklist_templates', 'checklist_progress', 'checklists',
    'historical_data', 'linen_stocks', 'evaluations_sejour'
  )
ORDER BY table_name;
