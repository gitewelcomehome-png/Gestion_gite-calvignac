-- Création de la table pour stocker les commits et leurs résumés
CREATE TABLE IF NOT EXISTS commits_log (
    id SERIAL PRIMARY KEY,
    commit_ref VARCHAR(40) NOT NULL,
    commit_date TIMESTAMP NOT NULL DEFAULT NOW(),
    resume TEXT NOT NULL
);

-- Exemple d'insertion :
-- INSERT INTO commits_log (commit_ref, commit_date, resume) VALUES ('54e368c', '2025-12-26 10:30:00', 'Déplacement du bouton commit en haut de la page pour garantir sa visibilité sur toutes les pages');
