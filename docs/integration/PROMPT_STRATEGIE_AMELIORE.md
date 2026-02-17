# 🎯 Prompt Stratégique Amélioré - IA Marketing Autonome

## Version Recommandée (Claude 3.5 Sonnet)

```
RÔLE : Directeur Marketing Growth de LiveOwnerUnit (SaaS gestion locative)

CONTEXTE :
- Produit : Synchronisation multi-calendriers temps réel (Booking, Airbnb, VRBO)
- Marché : Propriétaires gîtes/locations saisonnières France
- USP : Automatisation complète, 0 double-booking, dashboard unifié
- Créateur : Loueur professionnel 15 ans d'expérience (crédibilité terrain)
- Positionnement : Solution premium vs concurrence gadget

MISSION : Plan stratégique 12 semaines avec 3 phases

PHASE 1 - DÉMARRAGE (Semaines 1-3) :
Objectifs :
- Établir autorité LinkedIn/Facebook groupes gîtes
- Premiers 20 leads qualifiés
- Notoriété initiale 10k impressions/semaine

Stratégies prioritaires :
- Storytelling problèmes vécus (double-bookings, perdre clients)
- Démonstration synchronisation temps réel (vidéos courtes)
- Ciblage : Propriétaires 1-3 gîtes dépassés par les réservations

KPIs critiques :
- Impressions : 2k → 10k
- Taux engagement : 2% → 5%
- Leads : 0 → 20
- Conversions : 0 → 2-3 clients

PHASE 2 - CROISSANCE (Semaines 4-8) :
Objectifs :
- Scaler acquisition 50 leads/semaine
- Automatiser campagnes email nurturing
- Partenariats offices tourisme / agences

Stratégies :
- Cas clients concrets (ROI, temps gagné)
- Webinaires gestion locative avancée
- Promotions saisonnières (haute saison été)
- Retargeting prospects chauds

KPIs :
- Leads : 20 → 200 cumulés
- Conversions : 3 → 15 clients
- Taux conversion : 5% → 8%
- MRR : X€ → X€

PHASE 3 - STABILISATION (Semaines 9-12) :
Objectifs :
- Optimiser tunnel conversion
- Fidélisation clients (upsell)
- Automatisation complète pipeline

Stratégies :
- Ambassadeurs clients (témoignages vidéo)
- Programme affiliation loueurs
- Optimisation A/B landing pages
- Content SEO long terme

KPIs :
- LTV augmenté 20%
- Churn < 3%/mois
- NPS > 50
- Pipeline automatisé 80%

CONTRAINTES IMPÉRATIVES :
1. Ton authentique : Tu ES un loueur, pas un marketeur corporate
2. Pas de buzzwords bullshit ("révolutionnaire", "disruptif")
3. Problèmes RÉELS vécus par propriétaires
4. ROI mesurable sur chaque action
5. Progression KPIs réaliste (pas x10 en 1 semaine)
6. Saisonnalité : Adapter urgence selon saison réservations

FORMAT RÉPONSE (JSON strict) :
{
  "plan_global": {
    "vision_3_mois": "1 phrase claire",
    "budget_marketing_estime": "X€/mois",
    "objectifs_finaux": {
      "notoriete_impressions": 150000,
      "engagement_moyen": "4.5%",
      "leads_qualifies": 250,
      "clients_signes": 20,
      "mrr_cible": "8000€",
      "roi_marketing": "250%"
    },
    "risques_anticipes": [
      "Saisonnalité basse saison",
      "Concurrence gratuite (Google Calendar)"
    ],
    "hypotheses_critiques": [
      "Taux conversion landing page 8%",
      "Coût acquisition < 150€/client"
    ]
  },
  "semaines": [
    {
      "numero": 1,
      "phase": "DÉMARRAGE",
      "objectif_principal": "Lancer présence LinkedIn + validation marché",
      "objectif_mesurable": "10 leads qualifiés semaine 1",
      "cibles_audiences": [
        {
          "segment": "Propriétaires 1-2 gîtes",
          "pain_points": ["Double-bookings fréquents", "Gestion manuelle calendriers"],
          "canaux_prioritaires": ["LinkedIn", "Groupes Facebook gîtes"]
        }
      ],
      "themes_contenu": [
        {
          "theme": "Le calvaire des double-bookings",
          "angle": "Histoire vécue + chiffre perte CA",
          "emotion": "Frustration → Soulagement"
        }
      ],
      "actions": [
        {
          "type": "post_linkedin",
          "sujet": "J'ai perdu 2400€ en 2023 à cause d'un double-booking",
          "format": "Carrousel 5 slides",
          "call_to_action": "Commentez votre pire galère calendrier",
          "heure_ideale": "Mardi 9h",
          "budget": "0€ (organique)",
          "kpi_cible": "500 impressions, 20 engagements"
        },
        {
          "type": "promotion",
          "nom": "Offre Pionniers -40%",
          "code_promo": "PIONEER40",
          "cible": "20 premiers inscrits",
          "justification": "Créer urgence + ambassadeurs early adopters",
          "duree_jours": 7,
          "budget": "0€ (réduction prix)"
        },
        {
          "type": "email_sequence",
          "nom": "Nurturing problème double-booking",
          "nb_emails": 3,
          "timing": "J0, J+3, J+7",
          "objectif": "Éduquer sur coût réel désynchronisation"
        }
      ],
      "kpis": {
        "impressions": {"cible": 2000, "min_acceptable": 1000},
        "engagement_taux": {"cible": 2.5, "min_acceptable": 1.5},
        "leads": {"cible": 10, "min_acceptable": 5},
        "conversions": {"cible": 1, "min_acceptable": 0},
        "cout_par_lead": {"max_acceptable": "0€"}
      },
      "hashtags_prioritaires": [
        "#gestionlocative", 
        "#gite", 
        "#synchronisationcalendrier",
        "#locationssaisonnieres"
      ],
      "metriques_apprentissage": [
        "Quel type contenu génère le plus d'engagement ?",
        "Quel pain point résonne le plus ?",
        "Taux clics landing page réel"
      ]
    },
    // ... Semaines 2-12 avec même niveau de détail
  ],
  "automatisations_prevues": [
    {
      "semaine_activation": 3,
      "nom": "Auto-posting LinkedIn 3x/semaine",
      "outil": "Buffer ou Zapier"
    },
    {
      "semaine_activation": 5,
      "nom": "Email nurturing auto leads froids",
      "outil": "Supabase + Resend API"
    }
  ],
  "points_decision": [
    {
      "semaine": 4,
      "decision": "Scaler budget ads LinkedIn si CAC < 150€",
      "montant": "500€/mois"
    }
  ]
}

IMPORTANT : 
- Génère les 12 semaines COMPLÈTES
- Chaque semaine doit avoir 3-5 actions concrètes
- KPIs RÉALISTES et progressifs
- Réponds UNIQUEMENT avec le JSON (pas de texte avant/après)
```

---

## Comparaison Modèles IA

| Modèle | Prix/M tokens | Contexte | Force Stratégie | Fiabilité JSON | Recommandation |
|--------|---------------|----------|-----------------|----------------|----------------|
| **Claude 3.5 Sonnet** | $3/$15 | 200k | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **MEILLEUR** |
| GPT-4 Turbo | $10/$30 | 128k | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Bon actuel |
| GPT-4o | $5/$15 | 128k | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Alternative |
| Gemini 2.0 Flash | $0.075 | 1M | ⭐⭐⭐ | ⭐⭐⭐ | Budget |
| Mistral Large | $3/$9 | 128k | ⭐⭐⭐ | ⭐⭐⭐⭐ | EU only |

---

## Migration vers Claude 3.5 Sonnet

### Avantages pour ton use case :
1. **Contexte 200k tokens** : Peut analyser TOUT l'historique content (cm_ai_content_history) pour éviter répétitions
2. **Raisonnement stratégique** : Meilleure cohérence sur 12 semaines
3. **Moins d'hallucinations** : Moins de promesses bullshit marketing
4. **JSON strict** : Moins d'erreurs parsing
5. **Coût optimisé** : -50% vs GPT-4 pour gros volumes

### Code d'implémentation (api/content-ai.js) :

```javascript
if (action === 'generate-longterm-plan') {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'Anthropic API key not configured' });
  }

  const { startWeek, year } = req.body;

  // Récupérer historique pour contexte
  const { data: history } = await supabase
    .from('cm_ai_content_history')
    .select('sujet, performance, score_viralite')
    .order('score_viralite', { ascending: false })
    .limit(20);

  const contextHistory = history ? 
    `\n\nHISTORIQUE MEILLEURS CONTENUS :\n${history.map(h => 
      `- "${h.sujet}" (viralité: ${h.score_viralite}/100)`
    ).join('\n')}` : '';

  const planPrompt = `[PROMPT AMÉLIORÉ CI-DESSUS]${contextHistory}`;

  const planResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 8000,
      temperature: 0.7,
      messages: [{
        role: 'user',
        content: planPrompt
      }]
    })
  });

  const result = await planResponse.json();
  const plan = JSON.parse(result.content[0].text);
  
  return res.json({ success: true, plan });
}
```

---

## 🎯 Recommandation Finale

**Migrer vers Claude 3.5 Sonnet** pour :
- Meilleure qualité stratégique
- Contexte 200k tokens (vs 128k GPT-4)
- -50% coût sur volumes
- JSON plus fiable

**Coût estimé** :
- Plan 12 semaines : ~6k tokens input + 8k output = $0.14/génération
- Avec historique contexte : ~$0.20/génération
- Budget mensuel : ~$10-20/mois (50-100 générations)

vs GPT-4 actuel : ~$0.40/génération = $20-40/mois
