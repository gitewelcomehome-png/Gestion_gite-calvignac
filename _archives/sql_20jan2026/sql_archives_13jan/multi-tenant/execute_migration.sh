#!/bin/bash

# ================================================================
# SCRIPT D'EXÉCUTION MIGRATION MULTI-TENANT
# ================================================================
# Date: 7 janvier 2026
# Usage: ./execute_migration.sh [supabase_connection_string]
# ================================================================

set -e  # Arrêter si erreur

# Couleurs pour output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
echo "===================================================="
echo "  MIGRATION MULTI-TENANT - GÎTES CALVIGNAC"
echo "===================================================="
echo -e "${NC}"

# Vérifier si connection string fournie
if [ -z "$1" ]; then
    echo -e "${RED}❌ Erreur: Connection string Supabase requise${NC}"
    echo ""
    echo "Usage: $0 'postgresql://user:pass@host:port/database'"
    echo ""
    echo "Obtenir la connection string:"
    echo "1. Aller sur https://app.supabase.com"
    echo "2. Settings → Database → Connection string"
    echo "3. Copier la 'Connection string' (avec mot de passe)"
    exit 1
fi

DB_CONN="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Fonction pour exécuter un script SQL
execute_sql() {
    local file=$1
    local name=$2
    
    echo -e "${YELLOW}▶ Exécution: ${name}${NC}"
    
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Fichier introuvable: $file${NC}"
        exit 1
    fi
    
    if psql "$DB_CONN" -f "$file" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ ${name} - OK${NC}"
    else
        echo -e "${RED}❌ ${name} - ERREUR${NC}"
        echo "Vérifier les logs ci-dessus"
        exit 1
    fi
    
    echo ""
}

# Vérifier que psql est installé
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ psql n'est pas installé${NC}"
    echo "Installer PostgreSQL client:"
    echo "  - Ubuntu/Debian: sudo apt install postgresql-client"
    echo "  - macOS: brew install postgresql"
    exit 1
fi

# Vérifier connexion
echo -e "${YELLOW}🔍 Vérification connexion à la base...${NC}"
if psql "$DB_CONN" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Connexion OK${NC}"
    echo ""
else
    echo -e "${RED}❌ Impossible de se connecter à la base${NC}"
    echo "Vérifier la connection string"
    exit 1
fi

# Demander confirmation
echo -e "${YELLOW}⚠️  ATTENTION ⚠️${NC}"
echo ""
echo "Cette migration va :"
echo "  1. Créer 3 nouvelles tables (organizations, gites, organization_members)"
echo "  2. Ajouter des colonnes aux tables existantes"
echo "  3. Migrer toutes vos données actuelles"
echo "  4. Activer Row Level Security (isolation des données)"
echo ""
echo -e "${RED}Avez-vous fait un BACKUP complet ? (y/N)${NC}"
read -r response

if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo ""
    echo "📦 Créer un backup d'abord :"
    echo "   pg_dump \"$DB_CONN\" > backup_\$(date +%Y%m%d_%H%M%S).sql"
    echo ""
    exit 0
fi

echo ""
echo -e "${GREEN}🚀 Démarrage de la migration...${NC}"
echo ""

# ================================================================
# PHASE 1: Tables de base
# ================================================================

echo -e "${BLUE}[PHASE 1/4] Création des tables de base${NC}"
echo ""

execute_sql "$SCRIPT_DIR/01_create_organizations_table.sql" "01 - Table organizations"
execute_sql "$SCRIPT_DIR/02_create_gites_table.sql" "02 - Table gites"
execute_sql "$SCRIPT_DIR/03_create_organization_members_table.sql" "03 - Table organization_members"

# ================================================================
# PHASE 2: Ajout colonnes
# ================================================================

echo -e "${BLUE}[PHASE 2/4] Ajout des colonnes multi-tenant${NC}"
echo ""

execute_sql "$SCRIPT_DIR/04_add_tenant_columns.sql" "04 - Ajout organization_id & gite_id"

# ================================================================
# PHASE 3: Migration données
# ================================================================

echo -e "${BLUE}[PHASE 3/4] Migration des données existantes${NC}"
echo ""

echo -e "${YELLOW}⚠️  Vérifier les paramètres dans 06_migrate_existing_data.sql${NC}"
echo "   (nom organization, email, adresse du gîte, etc.)"
echo ""
echo "Continuer ? (y/N)"
read -r response

if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo "Migration annulée"
    exit 0
fi

execute_sql "$SCRIPT_DIR/06_migrate_existing_data.sql" "06 - Migration données"

# Vérification migration
echo -e "${YELLOW}🔍 Vérification de la migration...${NC}"
psql "$DB_CONN" -c "SELECT * FROM verify_migration();"
echo ""

# ================================================================
# PHASE 4: RLS Policies
# ================================================================

echo -e "${BLUE}[PHASE 4/4] Activation Row Level Security${NC}"
echo ""

execute_sql "$SCRIPT_DIR/05_create_rls_policies.sql" "05 - RLS Policies"

# Vérification RLS
echo -e "${YELLOW}🔍 Vérification RLS...${NC}"
psql "$DB_CONN" -c "SELECT * FROM verify_rls_enabled();"
echo ""

# ================================================================
# TERMINÉ
# ================================================================

echo -e "${GREEN}"
echo "===================================================="
echo "  ✅ MIGRATION TERMINÉE AVEC SUCCÈS !"
echo "===================================================="
echo -e "${NC}"

echo ""
echo "📊 Vérifications post-migration :"
echo ""
echo "1. Organization créée :"
echo "   SELECT * FROM organizations;"
echo ""
echo "2. Gîte créé :"
echo "   SELECT * FROM gites;"
echo ""
echo "3. Données migrées :"
echo "   SELECT * FROM verify_migration();"
echo ""
echo "4. RLS activé :"
echo "   SELECT * FROM verify_rls_enabled();"
echo ""

echo -e "${YELLOW}⚠️  PROCHAINES ÉTAPES :${NC}"
echo ""
echo "1. Tester l'application avec un user"
echo "2. Vérifier que l'isolation RLS fonctionne"
echo "3. Adapter le code frontend (voir README.md)"
echo "4. Décommenter l'ÉTAPE 9 dans 06_migrate_existing_data.sql"
echo "   pour rendre les colonnes NOT NULL (après tests OK)"
echo ""

echo -e "${GREEN}Bonne continuation ! 🎉${NC}"
