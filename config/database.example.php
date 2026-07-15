<?php
/**
 * database.example.php
 *
 * Point d'entree unique vers la base de donnees, a copier en
 * "database.php" une fois config.php renseigne. Toutes les futures
 * routes /api/*.php doivent passer par getPDO() pour ouvrir la connexion,
 * afin de garder une seule source de verite pour l'acces aux donnees.
 *
 * Correspondance avec le schema conçu :
 *   utilisateur, offre_stage, candidature, document, convention,
 *   service, notification (voir architecture_bdd_plateforme_stage.png)
 */

require_once __DIR__ . '/config.php';

function getPDO(): PDO {
    static $pdo = null;

    if ($pdo === null) {
        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=%s',
            DB_HOST, DB_PORT, DB_NAME, DB_CHARSET
        );

        $pdo = new PDO($dsn, DB_USER, DB_PASSWORD, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    }

    return $pdo;
}

/**
 * Exemple d'utilisation dans une future route /api/offres.php :
 *
 *   require_once __DIR__ . '/../config/database.php';
 *   header('Content-Type: application/json');
 *   $stmt = getPDO()->query(
 *       "SELECT id, titre, service, description, date_debut, date_fin,
 *               duree_semaines, statut
 *        FROM offre_stage
 *        WHERE statut = 'ouverte'
 *        ORDER BY date_debut ASC"
 *   );
 *   echo json_encode($stmt->fetchAll());
 *
 * Le fichier assets/js/offres.js n'a besoin d'aucune modification : il
 * suffit de remplacer l'URL "../data/offres.json" par "/api/offres.php".
 */
