<?php
/**
 * config.example.php
 *
 * Copier ce fichier en "config.php" (non versionne / ignore par git)
 * et renseigner les vraies valeurs avant de brancher la base de donnees.
 * Ce fichier n'est PAS utilise par le prototype HTML/CSS actuel : il ne
 * sert que de point de depart pour la future version connectee.
 */

define('DB_HOST', '127.0.0.1');
define('DB_PORT', '3306');
define('DB_NAME', 'oct_stages');
define('DB_USER', 'a_completer');
define('DB_PASSWORD', 'a_completer');
define('DB_CHARSET', 'utf8mb4');

// Dossier de stockage des fichiers uploades (CV, lettres de motivation)
define('UPLOAD_DIR', __DIR__ . '/../storage/documents');
