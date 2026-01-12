-- Test manuel d'insertion d'une réservation
INSERT INTO reservations (
    owner_user_id,
    gite_id,
    check_in,
    check_out,
    client_name,
    platform,
    total_price,
    status
) VALUES (
    (SELECT id FROM auth.users ORDER BY created_at LIMIT 1),
    (SELECT id FROM gites LIMIT 1),
    '2026-02-01',
    '2026-02-05',
    'Test Client',
    'Airbnb',
    500.00,
    'confirmed'
) RETURNING *;
