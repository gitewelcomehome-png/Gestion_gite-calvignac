import json

with open('/workspaces/Gestion_gite-calvignac/tmp/export_snapshot.json') as f:
    data = json.load(f)
tables = data['tables']

def sql_str(v):
    if v is None:
        return 'NULL'
    if isinstance(v, (dict, list)):
        s = json.dumps(v, ensure_ascii=False)
        return "'" + s.replace("'", "''") + "'::jsonb"
    if isinstance(v, str):
        return "'" + v.replace("'", "''") + "'"
    if isinstance(v, bool):
        return 'true' if v else 'false'
    return str(v)

lines = []
lines.append("-- ====================================================================")
lines.append("-- IMPORT DONNEES FISCALES - depuis export_snapshot.json (2026-03-06)")
lines.append("-- ====================================================================")
lines.append("-- Source : ancienne instance Supabase (export du 2026-03-06)")
lines.append("-- Tables : fiscal_history (3 lignes) + fiscalite_amortissements (30 lignes)")
lines.append("-- IMPORTANT : Ce script detecte automatiquement le user_id du premier")
lines.append("--             utilisateur de la nouvelle instance.")
lines.append("--             Verifiez que c'est bien votre compte avant d'executer.")
lines.append("-- PREREQUIS : Executer CORRECTIONS_SCHEMA_APP_2026-03-07.sql d'abord !")
lines.append("-- SAFE TO RE-RUN : ON CONFLICT DO UPDATE / DO NOTHING")
lines.append("-- ====================================================================")
lines.append("")
lines.append("DO $$")
lines.append("DECLARE")
lines.append("    v_user_id UUID;")
lines.append("BEGIN")
lines.append("    -- Recupere le premier utilisateur de la nouvelle instance")
lines.append("    SELECT id INTO v_user_id FROM auth.users ORDER BY created_at LIMIT 1;")
lines.append("    IF v_user_id IS NULL THEN")
lines.append("        RAISE EXCEPTION 'Aucun utilisateur dans auth.users. Creez votre compte d''abord.';")
lines.append("    END IF;")
lines.append("    RAISE NOTICE 'Import pour user_id = %', v_user_id;")
lines.append("")

# fiscal_history
lines.append("    -- ----------------------------------------------------------------")
lines.append("    -- fiscal_history (3 simulations fiscales : 2024, 2025, 2026)")
lines.append("    -- ----------------------------------------------------------------")
fh_rows = tables['fiscal_history']['rows']
for r in sorted(fh_rows, key=lambda x: x['year']):
    year = r['year']
    dd = sql_str(r.get('donnees_detaillees'))
    regime = sql_str(r.get('regime'))
    gite = sql_str(r.get('gite', 'multi'))
    revenus = r.get('revenus', 0)
    charges = r.get('charges', 0)
    resultat = r.get('resultat', 0)
    lines.append("    INSERT INTO public.fiscal_history")
    lines.append("        (owner_user_id, year, gite, revenus, charges, resultat, regime, donnees_detaillees)")
    lines.append("    VALUES (")
    lines.append("        v_user_id,")
    lines.append("        " + str(year) + ",")
    lines.append("        " + gite + ",")
    lines.append("        " + str(revenus) + ",")
    lines.append("        " + str(charges) + ",")
    lines.append("        " + str(resultat) + ",")
    lines.append("        " + regime + ",")
    lines.append("        " + dd)
    lines.append("    ) ON CONFLICT (owner_user_id, year, gite) DO UPDATE SET")
    lines.append("        revenus = EXCLUDED.revenus,")
    lines.append("        charges = EXCLUDED.charges,")
    lines.append("        resultat = EXCLUDED.resultat,")
    lines.append("        regime = EXCLUDED.regime,")
    lines.append("        donnees_detaillees = EXCLUDED.donnees_detaillees,")
    lines.append("        updated_at = NOW();")
    lines.append("    RAISE NOTICE 'fiscal_history annee " + str(year) + " insere/mis a jour';")
    lines.append("")

# fiscalite_amortissements
lines.append("    -- ----------------------------------------------------------------")
lines.append("    -- fiscalite_amortissements (30 lignes d'amortissements)")
lines.append("    -- ----------------------------------------------------------------")
fa_rows = tables['fiscalite_amortissements']['rows']
for r in fa_rows:
    ao = sql_str(r.get('amortissement_origine'))
    annee = r['annee']
    typ = sql_str(r['type'])
    desc = sql_str(r.get('description'))
    gite = sql_str(r.get('gite'))
    montant = r.get('montant', 0)
    lines.append("    INSERT INTO public.fiscalite_amortissements")
    lines.append("        (user_id, annee, type, description, gite, montant, amortissement_origine)")
    lines.append("    VALUES (")
    lines.append("        v_user_id,")
    lines.append("        " + str(annee) + ",")
    lines.append("        " + typ + ",")
    lines.append("        " + desc + ",")
    lines.append("        " + gite + ",")
    lines.append("        " + str(montant) + ",")
    lines.append("        " + ao)
    lines.append("    ) ON CONFLICT DO NOTHING;")

lines.append("")
lines.append("    RAISE NOTICE 'Import termine avec succes !';")
lines.append("END $$;")
lines.append("")
lines.append("-- ====================================================================")
lines.append("-- VERIFICATION FINALE")
lines.append("-- ====================================================================")
lines.append("SELECT year, gite, revenus,")
lines.append("       donnees_detaillees->>'chiffre_affaires' AS ca,")
lines.append("       donnees_detaillees->>'statut_fiscal' AS statut")
lines.append("FROM public.fiscal_history")
lines.append("ORDER BY year;")
lines.append("")
lines.append("SELECT COUNT(*) AS nb_amortissements FROM public.fiscalite_amortissements;")

print('\n'.join(lines))
