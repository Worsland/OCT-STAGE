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
    $stmt = $pdo->prepare("UPDATE CANDIDATURE SET statut = ? WHERE id = ?");
    $stmt->execute([$statut, $id]);

    echo json_encode(['success' => true, 'id' => (int) $id, 'statut' => $statut]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Impossible de mettre à jour le statut.', 'details' => $e->getMessage()]);
}
