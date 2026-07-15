<?php
session_start();
header('Content-Type: application/json');
require_once '../../config/database.php';

function ensureDocumentColumns(PDO $pdo): void {
    $existingColumns = [];
    $stmt = $pdo->query('SHOW COLUMNS FROM CANDIDATURE');
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $column) {
        $existingColumns[] = $column['Field'];
    }

    $alterStatements = [];
    if (!in_array('cv_content', $existingColumns, true)) {
        $alterStatements[] = 'ADD COLUMN cv_content LONGBLOB NULL';
    }
    if (!in_array('lettre_content', $existingColumns, true)) {
        $alterStatements[] = 'ADD COLUMN lettre_content LONGBLOB NULL';
    }
    if (!in_array('cv_nom', $existingColumns, true)) {
        $alterStatements[] = 'ADD COLUMN cv_nom VARCHAR(255) NULL';
    }
    if (!in_array('lettre_nom', $existingColumns, true)) {
        $alterStatements[] = 'ADD COLUMN lettre_nom VARCHAR(255) NULL';
    }
    if (!in_array('cv_type', $existingColumns, true)) {
        $alterStatements[] = 'ADD COLUMN cv_type VARCHAR(100) NULL';
    }
    if (!in_array('lettre_type', $existingColumns, true)) {
        $alterStatements[] = 'ADD COLUMN lettre_type VARCHAR(100) NULL';
    }

    if (!empty($alterStatements)) {
        $pdo->exec('ALTER TABLE CANDIDATURE ' . implode(', ', $alterStatements));
    }
}

$id_candidat = $_POST['id_candidat'] ?? $_SESSION['id_candidat'] ?? null;
$id_offre = $_POST['id_offre'] ?? null;

if (!$id_offre || !$id_candidat) {
    http_response_code(400);
    echo json_encode(['error' => 'Offre ou candidat manquant']);
    exit;
}

try {
    ensureDocumentColumns($pdo);

    if (isset($_POST['telephone']) || isset($_POST['etablissement'])) {
        $stmt = $pdo->prepare('UPDATE CANDIDAT SET telephone = ?, etablissement = ? WHERE id = ?');
        $stmt->execute([$_POST['telephone'] ?? null, $_POST['etablissement'] ?? null, $id_candidat]);
    }

    $cv_content = null;
    $cv_name = null;
    $cv_type = null;
    if (isset($_FILES['cv']) && $_FILES['cv']['error'] === UPLOAD_ERR_OK) {
        $extension = strtolower(pathinfo($_FILES['cv']['name'], PATHINFO_EXTENSION));
        if ($extension !== 'pdf') {
            http_response_code(400);
            echo json_encode(['error' => 'Seul le PDF est accepté pour le CV']);
            exit;
        }

        $cv_content = file_get_contents($_FILES['cv']['tmp_name']);
        if ($cv_content === false) {
            http_response_code(500);
            echo json_encode(['error' => 'Impossible de lire le fichier CV']);
            exit;
        }

        $cv_name = $_FILES['cv']['name'];
        $cv_type = $_FILES['cv']['type'] ?: 'application/pdf';
    }

    if (!isset($_FILES['lettre_motivation']) || $_FILES['lettre_motivation']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['error' => 'La lettre de motivation est requise']);
        exit;
    }

    $extension = strtolower(pathinfo($_FILES['lettre_motivation']['name'], PATHINFO_EXTENSION));
    if ($extension !== 'pdf') {
        http_response_code(400);
        echo json_encode(['error' => 'Seul le PDF est accepté pour la lettre de motivation']);
        exit;
    }

    $lettre_content = file_get_contents($_FILES['lettre_motivation']['tmp_name']);
    if ($lettre_content === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Impossible de lire la lettre de motivation']);
        exit;
    }

    $lettre_name = $_FILES['lettre_motivation']['name'];
    $lettre_type = $_FILES['lettre_motivation']['type'] ?: 'application/pdf';

    $check = $pdo->prepare('SELECT id FROM CANDIDATURE WHERE id_offre = ? AND id_candidat = ?');
    $check->execute([$id_offre, $id_candidat]);
    if ($check->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'Vous avez déjà candidaté à cette offre']);
        exit;
    }

    $reference = 'CAND-' . date('Ymd') . '-' . str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT);

    $stmt = $pdo->prepare(
        'INSERT INTO CANDIDATURE
        (reference, id_offre, id_candidat, lettre_motivation, cv_path, statut, date_depot, cv_content, lettre_content, cv_nom, lettre_nom, cv_type, lettre_type)
        VALUES (?, ?, ?, ?, ?, "en_attente", NOW(), ?, ?, ?, ?, ?, ?)'
    );

    $stmt->execute([
        $reference,
        $id_offre,
        $id_candidat,
        $lettre_name,
        $cv_name,
        $cv_content,
        $lettre_content,
        $cv_name,
        $lettre_name,
        $cv_type,
        $lettre_type,
    ]);

    echo json_encode([
        'success' => true,
        'id_candidature' => $pdo->lastInsertId(),
        'reference' => $reference,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>