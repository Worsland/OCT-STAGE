<?php
session_start();
header('Content-Type: application/json');
require_once __DIR__ . '/../../config/database.php';

function ensureReportColumns(PDO $pdo): void {
    $existingColumns = [];
    $stmt = $pdo->query('SHOW COLUMNS FROM RAPPORT_STAGE');
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $column) {
        $existingColumns[] = $column['Field'];
    }

    $alterStatements = [];
    if (!in_array('contenu', $existingColumns, true)) {
        $alterStatements[] = 'ADD COLUMN contenu LONGBLOB NULL';
    }
    if (!in_array('nom_fichier', $existingColumns, true)) {
        $alterStatements[] = 'ADD COLUMN nom_fichier VARCHAR(255) NULL';
    }
    if (!in_array('type_fichier', $existingColumns, true)) {
        $alterStatements[] = 'ADD COLUMN type_fichier VARCHAR(100) NULL';
    }

    if (!empty($alterStatements)) {
        $pdo->exec('ALTER TABLE RAPPORT_STAGE ' . implode(', ', $alterStatements));
    }
}

$id_candidat = $_POST['id_candidat'] ?? $_SESSION['id_candidat'] ?? null;
$id_candidature = $_POST['id_candidature'] ?? null;
$titre = trim($_POST['titre'] ?? '');

if (!$id_candidat || !$id_candidature || $titre === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Informations manquantes']);
    exit;
}

if (!isset($_FILES['fichier']) || $_FILES['fichier']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'Le fichier de rapport est requis']);
    exit;
}

$extension = strtolower(pathinfo($_FILES['fichier']['name'], PATHINFO_EXTENSION));
if ($extension !== 'pdf') {
    http_response_code(400);
    echo json_encode(['error' => 'Seul le PDF est accepté']);
    exit;
}

try {
    ensureReportColumns($pdo);

    $content = file_get_contents($_FILES['fichier']['tmp_name']);
    if ($content === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Impossible de lire le fichier']);
        exit;
    }

    $stmt = $pdo->prepare(
        'INSERT INTO RAPPORT_STAGE (id_candidature, id_candidat, titre, statut, date_depot, contenu, nom_fichier, type_fichier)
         VALUES (?, ?, ?, "en_attente", NOW(), ?, ?, ?)' 
    );
    $stmt->execute([$id_candidature, $id_candidat, $titre, $content, $_FILES['fichier']['name'], $_FILES['fichier']['type'] ?: 'application/pdf']);

    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
