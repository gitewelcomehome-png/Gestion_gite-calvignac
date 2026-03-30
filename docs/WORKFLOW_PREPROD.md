# Workflow Pré-Prod — Copilot + Claude

## Vue d'ensemble

```
main (production) ← merge apres validation Claude
  └── preprod (branche test)
        ├── Copilot corrige les erreurs
        ├── GitHub Actions CI (syntaxe JS + pages HTML)
        ├── Vercel deploie en preview automatiquement
        └── Claude teste et valide
```

## Etapes du cycle de correction

### 1. Copilot detecte et corrige
- Analyse le code dans le Codespace
- Applique la correction sur la branche `preprod`
- Commit + push → GitHub Actions se declenche

### 2. GitHub Actions CI verifie automatiquement
- Syntaxe de tous les fichiers JS (`node --check`)
- Presence des pages HTML critiques
- Resultat visible dans l'onglet Actions GitHub

### 3. Vercel deploie en preview
- URL pattern: `https://gestion-gite-calvignac-git-preprod-*.vercel.app`
- Deploiement automatique a chaque push sur preprod

### 4. Claude teste en live
- Ouvre l'URL Vercel preview dans le navigateur
- Verifie les pages critiques: monitoring, dashboard, auth
- Inspecte la console JS (erreurs, warnings)
- Teste les appels RPC Supabase
- Valide le pipeline complet

### 5. Validation ou remontee d'erreur
- **OK**: Claude confirme → Copilot merge preprod → main
- **Erreur**: Claude rapporte precisement → Copilot corrige → retour etape 1

## Regles importantes
- Ne JAMAIS pusher directement sur main sans passer par preprod
- Les corrections SQL passent aussi par preprod (test RPC avant prod)
- Supabase: meme DB pour preprod et prod (pas de donnees de test polluantes)
