-- Schema MySQL complet pour la plateforme OCT Stages
-- Ce script est pensé pour être exécuté dans phpMyAdmin ou via la ligne de commande MySQL.
-- Il crée les tables nécessaires pour afficher une interface web fonctionnelle sans erreurs.

CREATE DATABASE IF NOT EXISTS oct_stages CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE oct_stages;

CREATE TABLE IF NOT EXISTS CANDIDAT (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  mot_de_passe VARCHAR(255) NOT NULL,
  telephone VARCHAR(50) DEFAULT NULL,
  etablissement VARCHAR(255) DEFAULT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'candidat',
  provider VARCHAR(50) NOT NULL DEFAULT 'local',
  email_verifie TINYINT(1) NOT NULL DEFAULT 0,
  google_uid VARCHAR(255) DEFAULT NULL,
  verification_token VARCHAR(64) DEFAULT NULL,
  verification_expire DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL,
  UNIQUE KEY uk_candidat_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Compte de demonstration deja verifie, pour tester candidat/rapport.html
-- sans passer par l'inscription : salma.bouzid@example.com / demo123
INSERT IGNORE INTO CANDIDAT (nom, prenom, email, mot_de_passe, telephone, etablissement, role, provider, email_verifie)
VALUES ('Bouzid', 'Salma', 'salma.bouzid@example.com', '$2b$12$yeoZ.3wp87v5WZCR.Dy6O.2NJb.15m70FmJObSk0B2Jq7A5fYl.xi', '+216 22 987 654', 'ISET', 'candidat', 'local', 1);

CREATE TABLE IF NOT EXISTS OFFRE_STAGE (
  id_offre INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  titre VARCHAR(255) NOT NULL,
  service VARCHAR(150) DEFAULT NULL,
  entreprise VARCHAR(255) DEFAULT NULL,
  domaine VARCHAR(150) DEFAULT NULL,
  description TEXT DEFAULT NULL,
  statut VARCHAR(50) NOT NULL DEFAULT 'ouverte',
  date_debut DATE DEFAULT NULL,
  date_fin DATE DEFAULT NULL,
  duree_semaines INT UNSIGNED DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS CANDIDATURE (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reference VARCHAR(100) NOT NULL,
  id_offre INT UNSIGNED NOT NULL,
  id_candidat INT UNSIGNED NOT NULL,
  lettre_motivation VARCHAR(255) DEFAULT NULL,
  cv_path VARCHAR(255) DEFAULT NULL,
  statut VARCHAR(50) NOT NULL DEFAULT 'en_attente',
  date_depot DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  service_affecte VARCHAR(255) DEFAULT NULL,
  date_debut_stage DATE DEFAULT NULL,
  duree_semaines INT UNSIGNED DEFAULT NULL,
  cv_content LONGBLOB DEFAULT NULL,
  lettre_content LONGBLOB DEFAULT NULL,
  cv_nom VARCHAR(255) DEFAULT NULL,
  lettre_nom VARCHAR(255) DEFAULT NULL,
  cv_type VARCHAR(100) DEFAULT NULL,
  lettre_type VARCHAR(100) DEFAULT NULL,
  eval_content LONGBLOB DEFAULT NULL,
  eval_nom_fichier VARCHAR(255) DEFAULT NULL,
  eval_type_fichier VARCHAR(100) DEFAULT NULL,
  eval_date_upload DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL,
  UNIQUE KEY uk_candidature_reference (reference),
  KEY idx_candidature_id_offre (id_offre),
  KEY idx_candidature_id_candidat (id_candidat)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS RAPPORT_STAGE (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_candidature INT UNSIGNED NOT NULL,
  id_candidat INT UNSIGNED NOT NULL,
  titre VARCHAR(255) NOT NULL,
  statut VARCHAR(50) NOT NULL DEFAULT 'en_attente',
  date_depot DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  contenu LONGBLOB DEFAULT NULL,
  nom_fichier VARCHAR(255) DEFAULT NULL,
  type_fichier VARCHAR(100) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL,
  KEY idx_rapport_id_candidature (id_candidature),
  KEY idx_rapport_id_candidat (id_candidat)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS NOTIFICATION (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  destinataire VARCHAR(255) NOT NULL,
  sujet VARCHAR(255) NOT NULL,
  corps TEXT DEFAULT NULL,
  canal VARCHAR(50) NOT NULL DEFAULT 'email',
  date_envoi DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;