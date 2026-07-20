<?php
header('Content-Type: application/json');
require_once '../config/database.php';

if (!isset($_GET['id_candidat']) || (int) $_GET['id_candidat'] <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Paramètre id_candidat requis.']);
    exit;
}
$id_candidat = (int) $_GET['id_candidat'];

$stmt = $pdo->prepare("
    SELECT c.*, o.titre, o.entreprise, o.domaine, o.service,
           COALESCE(NULLIF(c.duree_semaines, 0), o.duree_semaines) AS duree_semaines,
           cand.email AS candidat_email
    FROM CANDIDATURE c
    JOIN OFFRE_STAGE o ON c.id_offre = o.id_offre
    LEFT JOIN CANDIDAT cand ON cand.id = c.id_candidat
    WHERE c.id_candidat = ?
    ORDER BY c.date_depot DESC
");
$stmt->execute([$id_candidat]);
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
?>