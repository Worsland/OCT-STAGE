<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../../config/database.php';

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$id = $input['id'] ?? null;
$statut = $input['statut'] ?? null;

if (!$id || !in_array($statut, ['validee', 'refusee', 'en_attente'], true)) {
    http_response_code(400);
    echo json_encode(['error' => 'Paramètres invalides.']);
    exit;
}

try {
    if ($statut === 'validee') {
        // Au moment de la validation, on renseigne service affecte / duree /
        // date de debut de stage a partir de l'offre liee, si ces champs ne
        // sont pas deja renseignes (ex. saisie manuelle anterieure conservee).
        $stmt = $pdo->prepare(
            "UPDATE CANDIDATURE c
             JOIN OFFRE_STAGE o ON o.id_offre = c.id_offre
             SET c.statut = ?,
                 c.service_affecte = COALESCE(NULLIF(c.service_affecte, ''), o.service),
                 c.duree_semaines = COALESCE(NULLIF(c.duree_semaines, 0), o.duree_semaines),
                 c.date_debut_stage = COALESCE(c.date_debut_stage, o.date_debut)
             WHERE c.id = ?"
        );
        $stmt->execute([$statut, $id]);
    } else {
        $stmt = $pdo->prepare("UPDATE CANDIDATURE SET statut = ? WHERE id = ?");
        $stmt->execute([$statut, $id]);
    }

    // On renvoie les valeurs a jour pour que le front puisse rafraichir
    // l'affichage sans recharger la page.
    $select = $pdo->prepare(
        "SELECT statut, service_affecte, duree_semaines, date_debut_stage
         FROM CANDIDATURE WHERE id = ?"
    );
    $select->execute([$id]);
    $updated = $select->fetch(PDO::FETCH_ASSOC) ?: [];

    echo json_encode(array_merge(
        ['success' => true, 'id' => (int) $id, 'statut' => $statut],
        $updated
    ));
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Impossible de mettre à jour le statut.', 'details' => $e->getMessage()]);
}