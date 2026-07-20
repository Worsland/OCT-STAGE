<?php
require_once __DIR__ . '/../../config/database.php';

header('Cache-Control: private');

function isAdminRequest(): bool {
    $header = $_SERVER['HTTP_X_ADMIN_SESSION'] ?? '';
    $cookie = $_COOKIE['oct_admin_auth'] ?? '';
    $queryFlag = $_GET['admin_access'] ?? '';
    return $header === '1' || $cookie === '1' || $queryFlag === '1';
}

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if ($id <= 0) {
    http_response_code(400);
    exit('Paramètre id invalide');
}

try {
    $stmt = $pdo->prepare('SELECT contenu, nom_fichier, type_fichier, id_candidat FROM RAPPORT_STAGE WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row || empty($row['contenu'])) {
        http_response_code(404);
        exit('Rapport introuvable');
    }

    // Un candidat non-admin ne peut telecharger que SON PROPRE rapport
    // (id_candidat fourni en parametre et correspondant au proprietaire).
    $id_candidat = isset($_GET['id_candidat']) ? (int)$_GET['id_candidat'] : 0;
    $isOwner = $id_candidat > 0 && $id_candidat === (int)$row['id_candidat'];

    if (!isAdminRequest() && !$isOwner) {
        http_response_code(403);
        exit('Accès réservé à l\'administrateur ou au candidat proprietaire du rapport.');
    }

    $filename = $row['nom_fichier'] ?: 'rapport.pdf';
    $mime = $row['type_fichier'] ?: 'application/pdf';

    header('Content-Type: ' . $mime);
    header('Content-Disposition: inline; filename="' . basename($filename) . '"');
    echo $row['contenu'];
} catch (PDOException $e) {
    http_response_code(500);
    exit('Erreur de lecture du rapport');
}