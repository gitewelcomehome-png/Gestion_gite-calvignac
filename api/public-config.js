/**
 * Endpoint public : expose la configuration Supabase (clé anon uniquement)
 * La clé anon Supabase est publique par nature (conçue pour le client).
 * Cet endpoint permet de l'injecter sans la commiter dans le code.
 */
export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    const url = process.env.SUPABASE_URL || '';
    const key = process.env.SUPABASE_ANON_KEY || '';

    if (!url || !key) {
        return res.status(503).json({ error: 'Configuration Supabase non disponible' });
    }

    return res.status(200).json({ supabaseUrl: url, supabaseKey: key });
}
