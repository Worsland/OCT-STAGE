<?php
/*
 * search.php
 * Recherche publique d'une candidature par sa reference (ex: CAND-20260720-045).
 * Ne necessite pas d'etre connecte : c'est la reference qui fait office de "cle" secrete
 * connue uniquement du candidat qui l'a recue par email/a l'ecran apres depot.
 */
header('Content-Type: application/json');
require_once '../../config/database.php';

$reference = isset($_GET['reference']) ? trim($_GET['reference']) : '';

if ($reference === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Reference requise.']);
    exit;
}

$stmt = $pdo->prepare("
    SELECT c.id, c.reference, c.statut, c.date_depot, c.date_debut_stage,
           o.titre AS offre_titre, o.entreprise, o.domaine
    FROM CANDIDATURE c
    JOIN OFFRE_STAGE o ON c.id_offre = o.id_offre
    WHERE c.reference = ?
    LIMIT 1
");
$stmt->execute([$reference]);
$candidature = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$candidature) {
    http_response_code(404);
    echo json_encode(['error' => 'Aucune candidature trouvee pour cette reference.']);
    exit;
}

echo json_encode($candidature);
?>