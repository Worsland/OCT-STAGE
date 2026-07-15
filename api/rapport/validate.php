<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../../config/database.php';

function isAdminRequest(): bool {
    $header = $_SERVER['HTTP_X_ADMIN_SESSION'] ?? '';
    $cookie = $_COOKIE['oct_admin_auth'] ?? '';
    $queryFlag = $_GET['admin_access'] ?? '';
    return $header === '1' || $cookie === '1' || $queryFlag === '1';
}

if (!isAdminRequest()) {
    http_response_code(403);
    echo json_encode(['error' => 'Accès réservé aux administrateurs connectés.']);
    exit;
}

function ensureReportTable(PDO $pdo): void {
    $stmt = $pdo->query('SHOW TABLES LIKE "RAPPORT_STAGE"');
    if ($stmt->fetch()) {
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

    $id = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);
    $statut = trim((string)($_POST['statut'] ?? ''));

    if ($id === false || $id <= 0 || !in_array($statut, ['valide', 'refuse'], true)) {
        http_response_code(400);
        echo json_encode(['error' => 'Paramètres invalides.']);
        exit;
    }

    $pdo->beginTransaction();

    $stmt = $pdo->prepare('UPDATE RAPPORT_STAGE SET statut = ? WHERE id = ?');
    $stmt->execute([$statut, $id]);

    if ($stmt->rowCount() === 0) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(['error' => 'Rapport introuvable.']);
        exit;
    }

    $candidateStmt = $pdo->prepare(
        'SELECT cand.email, cand.nom, cand.prenom
         FROM RAPPORT_STAGE r
         LEFT JOIN CANDIDAT cand ON cand.id = r.id_candidat
         WHERE r.id = ?'
    );
    $candidateStmt->execute([$id]);
    $candidate = $candidateStmt->fetch();

    if ($candidate && !empty($candidate['email'])) {
        $sujet = $statut === 'valide'
            ? 'Votre rapport de stage a été validé'
            : 'Votre rapport de stage a été refusé';
        $corps = $statut === 'valide'
            ? 'Votre rapport de stage a été validé. Vous pouvez consulter la mise à jour dans votre espace candidat.'
            : 'Votre rapport de stage a été refusé. Merci de contacter l’équipe informatique pour les corrections.';

        $notifStmt = $pdo->prepare(
            'INSERT INTO NOTIFICATION (destinataire, sujet, corps, canal, date_envoi) VALUES (?, ?, ?, "email", NOW())'
        );
        $notifStmt->execute([$candidate['email'], $sujet, $corps]);
    }

    $pdo->commit();
    echo json_encode(['success' => true, 'statut' => $statut]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['error' => 'Impossible de mettre à jour le rapport.', 'details' => $e->getMessage()]);
}
