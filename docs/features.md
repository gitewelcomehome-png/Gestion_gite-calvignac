# Fonctionnalités — Gestion Gîte Calvignac

Catalogue des fonctionnalités notables du projet, avec contexte technique et date de livraison.

---

## Météo — Prévisions 3 jours

**Date** : 2 avril 2026  
**Commit** : `7c8d46c` — `feat: ajouter prévisions météo 3 jours`  
**Branche** : `preprod`

### Description

Le widget météo de la fiche client (`pages/fiche-client.html`) affiche désormais les prévisions sur 3 jours en plus de la météo actuelle.

### Fonctionnement

**API** : [WeatherAPI.com](https://www.weatherapi.com/) — plan Free (1M appels/mois, usage commercial autorisé)  
**Endpoint** : `GET /v1/forecast.json?key=...&q={lat},{lon}&days=3&lang={fr|en}&aqi=no`

**Données affichées pour chaque jour :**
- Emoji représentatif des conditions (mappé sur les codes WeatherAPI)
- Température max / min en °C
- Probabilité de pluie (%)
- Label du jour : "Aujourd'hui" / "Demain" / nom du jour de semaine (i18n FR + EN)

### Fichiers modifiés

| Fichier | Changement |
|---------|-----------|
| `js/fiche-client-app.js` | `loadWeatherData()` — endpoint `current.json` → `forecast.json?days=3`, génération HTML des 3 cartes, clés i18n `forecast_today` / `forecast_tomorrow` / `forecast_rain` (FR + EN) |
| `pages/fiche-client.html` | CSS : `.weather-forecast`, `.weather-forecast-card`, `.weather-forecast-day`, `.weather-forecast-temps`, `.weather-forecast-max`, `.weather-forecast-min`, `.weather-forecast-rain`, `.weather-forecast-emoji` + règles responsive mobile |

### Structure HTML générée

```html
<div class="weather-forecast">
  <div class="weather-forecast-card">
    <div class="weather-forecast-day">Aujourd'hui</div>
    <div class="weather-forecast-emoji">☀️</div>
    <div class="weather-forecast-temps">
      <span class="weather-forecast-max">22°</span>
      <span class="weather-forecast-min">14°</span>
    </div>
    <div class="weather-forecast-rain">💧 10%</div>
  </div>
  <!-- × 3 jours -->
</div>
```

### Prérequis

- Le gîte doit avoir des coordonnées GPS (`giteInfo.latitude` / `giteInfo.gps_lat` et `longitude` / `gps_lon`)
- Si les coordonnées sont absentes, le widget ne s'affiche pas (retour silencieux)
- La clé API WeatherAPI est stockée directement dans `loadWeatherData()` — à migrer vers `system_config` si nécessaire

---
