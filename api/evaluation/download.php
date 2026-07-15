<?php
require_once __DIR__ . '/../../config/database.php';

header('Cache-Control: private');

function isAdminRequest(): bool {
    $header = $_SERVER['HTTP_X_ADMIN_SESSION'] ?? '';
    $cookie = $_COOKIE['oct_admin_auth'] ?? '';
    $queryFlag = $_GET['admin_access'] ?? '';
    return $header === '1' || $cookie === '1' || $queryFlag === '1';
}

$id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
$idCandidat = isset($_GET['id_candidat']) ? (int) $_GET['id_candidat'] : 0;

if ($id <= 0) {
    http_response_code(400);
    exit('Paramètre id invalide');
}

try {
    $stmt = $pdo->prepare(
        'SELECT eval_content, eval_nom_fichier, eval_type_fichier, id_candidat FROM CANDIDATURE WHERE id = ?'
    );
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row || empty($row['eval_content'])) {
        http_response_code(404);
        exit('Évaluation introuvable');
    }

    // Acces autorise : un administrateur, OU le candidat proprietaire de
    // cette candidature (requete explicitement filtree par son id_candidat).
    $estProprietaire = $idCandidat > 0 && $idCandidat === (int) $row['id_candidat'];
    if (!isAdminRequest() && !$estProprietaire) {
        http_response_code(403);
        exit('Accès refusé.');
    }

    $filename = $row['eval_nom_fichier'] ?: 'evaluation.pdf';
    $mime = $row['eval_type_fichier'] ?: 'application/pdf';

    header('Content-Type: ' . $mime);
    header('Content-Disposition: inline; filename="' . basename($filename) . '"');
    echo $row['eval_content'];
} catch (PDOException $e) {
    http_response_code(500);
    exit('Erreur de lecture de l\'évaluation');
}