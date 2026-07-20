<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../../config/database.php';

try {
    $stmt = $pdo->query(
        "SELECT
            c.id,
            c.id_offre,
            c.statut,
            c.date_depot,
            c.date_debut_stage,
            c.service_affecte,
            c.duree_semaines,
            c.eval_nom_fichier,
            c.eval_date_upload,
            o.titre AS offre_titre,
            o.domaine AS domaine,
            o.service AS offre_service,
            o.domaine AS offre_domaine,
            o.duree_semaines AS offre_duree,
            cand.nom AS candidat_nom_fam,
            cand.prenom AS candidat_prenom,
            cand.email AS candidat_email
         FROM CANDIDATURE c
         LEFT JOIN OFFRE_STAGE o ON o.id_offre = c.id_offre
         LEFT JOIN CANDIDAT cand ON cand.id = c.id_candidat
         ORDER BY c.date_depot DESC"
    );

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $rows = array_map(function ($r) {
        $r['candidat_nom'] = trim(($r['candidat_prenom'] ?? '') . ' ' . ($r['candidat_nom_fam'] ?? ''));
        $r['date_soumission'] = $r['date_depot'];
        return $r;
    }, $rows);

    echo json_encode($rows);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}