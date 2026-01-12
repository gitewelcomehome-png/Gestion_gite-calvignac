# 📘 Guide Complet - Gestion Gîtes Calvignac

**Version:** 5.0 - Production  
**Dernière mise à jour:** 5 janvier 2026

---

## 🎯 Vue d'ensemble

Application web complète de gestion de gîtes touristiques (Trévoux, Couzon, Calvignac).

**Stack technique:**
- Frontend: HTML5, JavaScript vanilla, CSS3
- Backend: Supabase PostgreSQL
- Hosting: Vercel
- PWA: Service Worker + Manifest

**URL Production:** Configurée via Vercel

---

## 🚀 Démarrage rapide

### 1. Configuration Supabase

**URL:** `https://gltdpwcqkzmxsqqxibnh.supabase.co`

Tous les schémas SQL sont dans `_archives/sql_production/`

Tables principales: reservations, cleaning_planning, charges, fiscalite, todos, clients, fiches_clients, demandes_horaires, problemes_signales, evaluations_sejour, faq, checklists

### 2. Déploiement

```bash
vercel --prod
```

### 3. PWA Fiches Clients

Accès: `https://[domaine]/fiche-client.html?id=[client_id]`

---

## 💡 Fonctionnalités

### Réservations
- Import iCal automatique
- Affichage 2 colonnes (Trévoux | Couzon)
- Filtrage période
- Statuts paiement

### Dashboard
- Réservations semaine
- Tâches actions (Réservations, Travaux, Achats)
- Stats rapides

### Fiscalité
- Calcul IR + URSSAF
- Comparaison années
- Export période

### Planning Ménage
- Calendrier 4 semaines
- Validation/refus
- Badge notifications

### Tâches Récurrentes
- Hebdo/Bimensuel/Mensuel
- Choix jour semaine
- Auto-régénération
- Visible dès minuit

### Fiches Clients (PWA)
- 5 onglets
- QR Code WiFi
- Demandes temps réel
- Évaluation 6 critères
- Mode hors ligne

---

## 🔧 Développement

### Serveur local
```bash
python3 -m http.server 8080
```

### Structure
- `js/` - Scripts métier
- `tabs/` - Onglets interface
- `_archives/` - Fichiers obsolètes

---

## 🐛 Dépannage

### Réservations invisibles
- Vérifier filtre `nuits >= 1`
- Console: logs 📋

### Tâches récurrentes invisibles
- Vérifier `next_occurrence` < maintenant
- Console: logs 🔁

### PWA ne s'installe pas
- HTTPS obligatoire
- Vérifier manifest + service worker

---

## 📝 SQL Utiles

### Créer tâche récurrente
```sql
INSERT INTO todos (title, category, is_recurrent, frequency, frequency_detail, next_occurrence)
VALUES ('Ma tâche', 'reservations', true, 'weekly', '{"day_of_week": 1}', '2026-01-06 00:00:00+00');
```

### Mise à jour WiFi
```sql
UPDATE infos_gites SET wifi_ssid = 'MonSSID', wifi_password = 'MotDePasse' WHERE gite_name = 'Trévoux';
```

---

## ✅ Checklist déploiement

- [ ] Tables Supabase créées
- [ ] RLS désactivé
- [ ] Import réservations
- [ ] Test PWA mobile
- [ ] QR Code WiFi
- [ ] Tâches récurrentes
- [ ] FAQ remplie

---

**🎯 Documentation complète disponible dans les archives**

Schémas SQL: `_archives/sql_production/`  
Guides détaillés: `_archives/guides_obsoletes/`
