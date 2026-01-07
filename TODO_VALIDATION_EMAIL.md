# TODO: Validation Email

## Amélioration Future - Sécurité

### Problème Actuel
Actuellement, les comptes sont créés sans validation d'email, ce qui permet :
- ❌ Création de comptes avec emails invalides
- ❌ Usurpation d'identité potentielle
- ❌ Spam d'inscriptions

### Solution à Implémenter

**1. Configuration Supabase**
```sql
-- Dans Supabase Dashboard → Authentication → Email Templates
-- Activer "Confirm signup" (confirmation d'inscription)
```

**2. Modification onboarding.html**
```javascript
// Ligne ~526
const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
        emailRedirectTo: 'https://votre-domaine.com/index.html'
    }
});

// Après signUp, afficher message
if (!error && !data.session) {
    showMessage('✉️ Email de confirmation envoyé ! Vérifiez votre boîte mail.');
    // Ne pas continuer le flow, attendre confirmation
}
```

**3. Email Template Personnalisé**
```html
<!-- Template Supabase -->
<h2>Bienvenue sur Gestion Gîtes !</h2>
<p>Cliquez sur le lien ci-dessous pour confirmer votre adresse email :</p>
<a href="{{ .ConfirmationURL }}">Confirmer mon email</a>
```

**4. Gestion Tokens**
- Token expire après 24h par défaut
- Possibilité de renvoyer l'email de confirmation
- Page dédiée "Confirmer votre email"

**5. UX Flow Complet**
1. User s'inscrit → Email envoyé
2. User clique sur lien → Email confirmé
3. Redirection automatique vers onboarding (étape 2)
4. User complète organization + gîtes
5. Accès dashboard

### Priorité
🔴 **MOYENNE** - À implémenter avant production publique
⚪ **Non bloquant** pour tests internes

### Temps Estimé
- Configuration: 15 min
- Code: 30 min
- Tests: 15 min
- **Total: 1h**

### Référence
- [Supabase Email Confirmation](https://supabase.com/docs/guides/auth/auth-email)
- [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
