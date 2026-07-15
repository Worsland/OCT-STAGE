<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../../config/database.php';

try {
    $stmt = $pdo->query(
        "SELECT
            c.id,
            c.reference,
            c.id_offre,
            c.id_candidat,
            c.lettre_motivation,
            c.cv_path,
            c.statut,
            c.date_depot,
            c.service_affecte,
            c.date_debut_stage,
            c.duree_semaines,
            c.eval_nom_fichier,
            c.eval_date_upload,
            o.titre AS offre_titre,
            o.domaine,
            cand.nom AS candidat_nom,
            cand.prenom AS candidat_prenom,
            cand.email AS candidat_email,
            cand.telephone AS candidat_telephone,
            cand.etablissement AS candidat_etablissement
         FROM CANDIDATURE c
         LEFT JOIN OFFRE_STAGE o ON o.id_offre = c.id_offre
         LEFT JOIN CANDIDAT cand ON cand.id = c.id_candidat
         ORDER BY c.date_depot DESC"
    );

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $rows = array_map(function ($row) {
        $row['candidat_nom'] = trim(($row['candidat_prenom'] ?? '') . ' ' . ($row['candidat_nom'] ?? ''));
        $row['date_soumission'] = $row['date_depot'];
        $row['offre_titre'] = $row['offre_titre'] ?? 'Offre inconnue';
        return $row;
    }, $rows);

    echo json_encode($rows);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Impossible de charger les candidatures.', 'details' => $e->getMessage()]);
}