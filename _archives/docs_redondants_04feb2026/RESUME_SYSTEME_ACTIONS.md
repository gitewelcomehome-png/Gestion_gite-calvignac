✅ **Système complet implémenté :**

1. **SQL créé** : `/sql/ADD_PLAN_DETAILLE_COLUMN.sql` - À exécuter dans Supabase
   ```sql
   ALTER TABLE cm_ai_content_queue ADD COLUMN plan_detaille JSONB;
   ```

2. **Renommage** : "Publications Programmées" → "Actions Validées"

3. **Fonctionnalités ajoutées** :
   - Badge "✓ Plan généré" si plan existe
   - Bouton "🤖 Générer plan" si pas de plan
   - Bouton "📋 Voir plan" si plan sauvegardé
   - Bouton "✓ Valider" (change statut → publié)
   - Bouton "🗑️ Supprimer"
   - Bouton "💾 Sauvegarder" après génération plan

4. **Workflow complet** :
   - Accepter action → Apparaît dans "Actions Validées"
   - Cliquer action → Modale ouvre
   - Générer plan IA → Bouton Sauvegarder apparaît
   - Sauvegarder → Badge vert affiché
   - Valider → Marque comme terminée (statut=publié)
   - Supprimer → Supprime de la liste

**TODO URGENT** : Exécuter le SQL dans Supabase pour ajouter la colonne !
