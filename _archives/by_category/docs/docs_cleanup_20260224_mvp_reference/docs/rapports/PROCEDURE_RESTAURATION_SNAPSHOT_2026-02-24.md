# Procédure de restauration — Snapshot applicatif

**Date :** 24/02/2026  
**Snapshot de référence :** `_backups/system_snapshots/20260224_152636`  
**Archive de référence :** `_backups/system_snapshots_20260224_152636.tar.gz`  
**Checksum :** `_backups/system_snapshots_20260224_152636.tar.gz.sha256`

---

## 1) Vérifier l’intégrité de l’archive

```bash
cd /workspaces/Gestion_gite-calvignac
sha256sum -c _backups/system_snapshots_20260224_152636.tar.gz.sha256
```

Résultat attendu : `OK`.

---

## 2) Restaurer depuis le dossier snapshot (rapide)

```bash
cd /workspaces/Gestion_gite-calvignac
SNAPSHOT_DIR="_backups/system_snapshots/20260224_152636"
rsync -a --delete --exclude '_backups/system_snapshots' "$SNAPSHOT_DIR/" ./
```

Cette commande remet le workspace dans l’état exact du snapshot.

---

## 3) Restaurer depuis l’archive (si besoin)

```bash
cd /workspaces/Gestion_gite-calvignac
mkdir -p _backups/restore_tmp

tar -xzf _backups/system_snapshots_20260224_152636.tar.gz -C _backups/restore_tmp
SNAPSHOT_DIR="_backups/restore_tmp/20260224_152636"

rsync -a --delete --exclude '_backups/system_snapshots' "$SNAPSHOT_DIR/" ./
```

---

## 4) Contrôles post-restauration

```bash
cd /workspaces/Gestion_gite-calvignac

git status --short
```

Puis vérifier rapidement :
- chargement de l’application,
- accès aux pages admin critiques,
- disponibilité de la page d’audit sécurité/RGPD.

---

## 5) Rollback prod (si nécessaire)

Si le rollback doit être visible en production, redéployer l’état restauré :

```bash
cd /workspaces/Gestion_gite-calvignac
vercel --prod --yes
```

---

## 6) Notes importantes

- Cette procédure restaure **les fichiers applicatifs** du repo.
- Les données Supabase (BDD) ne sont pas couvertes par ce snapshot fichier.
- En cas d’incident base de données, utiliser la procédure de restauration BDD dédiée.
