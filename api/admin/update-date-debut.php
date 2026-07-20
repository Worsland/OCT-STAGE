<?php
/**
 * api/admin/update-date-debut.php
 * Permet à l'admin de saisir/corriger manuellement la date de début de
 * stage d'une candidature validée, pour les cas où l'offre liée n'avait
 * pas de date_debut au moment de la validation (COALESCE => resté null).
 */
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../../config/database.php';

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$id = $input['id'] ?? null;
$dateDebutStage = trim((string)($input['date_debut_stage'] ?? ''));

if (!$id || $dateDebutStage === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Identifiant et date de début requis.']);
    exit;
}

try {
    $dt = new DateTime($dateDebutStage);
} catch (Exception $e) {
    http_response_code(422);
    echo json_encode(['error' => 'Format de date invalide.']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE CANDIDATURE SET date_debut_stage = ? WHERE id = ?");
    $stmt->execute([$dt->format('Y-m-d'), $id]);

    $select = $pdo->prepare("SELECT id, date_debut_stage FROM CANDIDATURE WHERE id = ?");
    $select->execute([$id]);
    $updated = $select->fetch(PDO::FETCH_ASSOC) ?: [];

    echo json_encode(array_merge(['success' => true], $updated));
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Impossible de mettre à jour la date de début.', 'details' => $e->getMessage()]);
}
