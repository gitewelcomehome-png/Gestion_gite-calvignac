-- ==========================================
-- Ajouter la colonne wifi_qr_code_url à infos_gites
-- ==========================================
-- Cette colonne stocke l'URL publique du QR code WiFi généré
-- depuis Supabase Storage ou un service externe comme QR Code Generator
-- ==========================================

ALTER TABLE infos_gites
ADD COLUMN IF NOT EXISTS wifi_qr_code_url TEXT;

COMMENT ON COLUMN infos_gites.wifi_qr_code_url IS 'URL publique du QR code WiFi (pour connexion rapide)';

-- Exemple de génération de QR code WiFi:
-- Format: WIFI:T:WPA;S:<SSID>;P:<password>;;
-- URL génératrice: https://www.qr-code-generator.com/
-- Ou utiliser Supabase Storage pour héberger l'image
