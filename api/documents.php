<?php
require_once __DIR__ . '/../config/database.php';

header('Cache-Control: private');

$id = isset($_GET['candidature_id']) ? (int)$_GET['candidature_id'] : 0;
$type = $_GET['type'] ?? 'cv';

if ($id <= 0) {
    http_response_code(400);
    exit('Paramètre candidature_id invalide');
}

try {
    $column = $type === 'lettre' ? 'lettre_content' : 'cv_content';
    $nameColumn = $type === 'lettre' ? 'lettre_nom' : 'cv_nom';
    $typeColumn = $type === 'lettre' ? 'lettre_type' : 'cv_type';

    $stmt = $pdo->prepare('SELECT ' . $column . ' AS content, ' . $nameColumn . ' AS filename, ' . $typeColumn . ' AS mime FROM CANDIDATURE WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row || empty($row['content'])) {
        http_response_code(404);
        exit('Document introuvable');
    }

    $filename = $row['filename'] ?: ($type === 'lettre' ? 'lettre.pdf' : 'cv.pdf');
    $mime = $row['mime'] ?: 'application/pdf';

    header('Content-Type: ' . $mime);
    header('Content-Disposition: inline; filename="' . basename($filename) . '"');
    echo $row['content'];
} catch (PDOException $e) {
    http_response_code(500);
    exit('Erreur de lecture du document');
}
