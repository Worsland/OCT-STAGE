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
    SELECT c.id, c.reference, c.id_offre, c.id_candidat, c.lettre_motivation,
           c.cv_path, c.statut, c.date_depot, c.service_affecte,
           c.date_debut_stage,
           COALESCE(NULLIF(c.duree_semaines, 0), o.duree_semaines) AS duree_semaines,
           c.cv_nom, c.lettre_nom, c.cv_type, c.lettre_type,
           c.eval_nom_fichier, c.eval_type_fichier, c.eval_date_upload,
           c.created_at, c.updated_at,
           o.titre, o.entreprise, o.domaine, o.service,
           cand.email AS candidat_email
    FROM CANDIDATURE c
    JOIN OFFRE_STAGE o ON c.id_offre = o.id_offre
    LEFT JOIN CANDIDAT cand ON cand.id = c.id_candidat
    WHERE c.id_candidat = ?
    ORDER BY c.date_depot DESC
");
$stmt->execute([$id_candidat]);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
$json = json_encode($rows);
if ($json === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur d\'encodage JSON: ' . json_last_error_msg()]);
    exit;
}
echo $json;
?>