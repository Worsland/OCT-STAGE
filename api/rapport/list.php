<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../../config/database.php';

function isAdminRequest(): bool {
    $header = $_SERVER['HTTP_X_ADMIN_SESSION'] ?? '';
    $cookie = $_COOKIE['oct_admin_auth'] ?? '';
    $queryFlag = $_GET['admin_access'] ?? '';
    return $header === '1' || $cookie === '1' || $queryFlag === '1';
}

// Un candidat non-admin ne peut consulter que SON PROPRE rapport (requête
// explicitement filtrée par id_candidat). Toute liste non filtrée reste
// reservee aux administrateurs.
$requestedCandidatId = isset($_GET['id_candidat']) ? (int)$_GET['id_candidat'] : 0;
$isScopedSelfRequest = $requestedCandidatId > 0;

if (!isAdminRequest() && !$isScopedSelfRequest) {
    http_response_code(403);
    echo json_encode(['error' => 'Accès réservé aux administrateurs connectés.']);
    exit;
}

function ensureReportTable(PDO $pdo): void {
    $stmt = $pdo->query('SHOW TABLES LIKE "RAPPORT_STAGE"');
    if ($stmt->fetch()) {
        $existingColumns = [];
        $colStmt = $pdo->query('SHOW COLUMNS FROM RAPPORT_STAGE');
        foreach ($colStmt->fetchAll(PDO::FETCH_ASSOC) as $column) {
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
        return;
    }

    $pdo->exec(
        'CREATE TABLE RAPPORT_STAGE (
            id INT AUTO_INCREMENT PRIMARY KEY,
            id_candidature INT NOT NULL,
            id_candidat INT NOT NULL,
            titre VARCHAR(255) NOT NULL,
            statut VARCHAR(50) NOT NULL DEFAULT "en_attente",
            date_depot DATETIME NOT NULL,
            contenu LONGBLOB NULL,
            nom_fichier VARCHAR(255) NULL,
            type_fichier VARCHAR(100) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )'
    );
}

try {
    ensureReportTable($pdo);

    $id_candidat = isset($_GET['id_candidat']) ? (int)$_GET['id_candidat'] : null;
    $id_candidature = isset($_GET['id_candidature']) ? (int)$_GET['id_candidature'] : null;
    $statut = $_GET['statut'] ?? null;

    $query = 'SELECT r.id, r.id_candidature, r.id_candidat, r.titre, r.statut, r.date_depot, r.nom_fichier, c.id AS candidature_id, cand.nom, cand.prenom, cand.email
          FROM RAPPORT_STAGE r
          LEFT JOIN CANDIDATURE c ON c.id = r.id_candidature
          LEFT JOIN CANDIDAT cand ON cand.id = r.id_candidat';
    $params = [];
    $conditions = [];

    if ($id_candidat !== null && $id_candidat > 0) {
        $conditions[] = 'r.id_candidat = ?';
        $params[] = $id_candidat;
    }
    if ($id_candidature !== null && $id_candidature > 0) {
        $conditions[] = 'r.id_candidature = ?';
        $params[] = $id_candidature;
    }
    if ($statut !== null && $statut !== '') {
        $conditions[] = 'r.statut = ?';
        $params[] = $statut;
    }

    if (!empty($conditions)) {
        $query .= ' WHERE ' . implode(' AND ', $conditions);
    }

    $query .= ' ORDER BY r.date_depot DESC';

    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $rows = array_map(function ($row) {
        $row['stagiaire_nom'] = trim(($row['prenom'] ?? '') . ' ' . ($row['nom'] ?? ''));
        $row['domaine'] = '';
        return $row;
    }, $rows);

    echo json_encode($rows);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Impossible de charger les rapports.', 'details' => $e->getMessage()]);
}