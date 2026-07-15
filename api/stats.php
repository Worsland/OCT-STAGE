<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/database.php';

try {
    $offresStmt = $pdo->query("SELECT COUNT(*) AS total_offres FROM OFFRE_STAGE");
    $candidaturesStmt = $pdo->query("SELECT COUNT(*) AS total_candidatures FROM CANDIDATURE");
    $pendingStmt = $pdo->query("SELECT COUNT(*) AS pending FROM CANDIDATURE WHERE statut = 'en_attente'");
    $openedStmt = $pdo->query("SELECT COUNT(*) AS opened FROM OFFRE_STAGE WHERE statut = 'ouverte'");

    echo json_encode([
        'offres' => (int) $offresStmt->fetchColumn(),
        'offres_ouvertes' => (int) $openedStmt->fetchColumn(),
        'candidatures' => (int) $candidaturesStmt->fetchColumn(),
        'en_attente' => (int) $pendingStmt->fetchColumn(),
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Impossible de charger les statistiques.', 'details' => $e->getMessage()]);
}
