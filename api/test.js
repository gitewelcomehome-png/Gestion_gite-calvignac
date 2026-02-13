// Test simple pour vérifier que les fonctions Vercel fonctionnent
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ 
        message: 'Les fonctions Vercel fonctionnent !',
        timestamp: new Date().toISOString()
    });
}
