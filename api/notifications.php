<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/database.php';

try {
    $stmt = $pdo->query('SHOW TABLES LIKE "NOTIFICATION"');
    if (!$stmt->fetch()) {
        $pdo->exec(
            'CREATE TABLE NOTIFICATION (
                id INT AUTO_INCREMENT PRIMARY KEY,
                destinataire VARCHAR(255) NOT NULL,
                sujet VARCHAR(255) NOT NULL,
                corps TEXT NULL,
                canal VARCHAR(50) NOT NULL DEFAULT "email",
                date_envoi DATETIME NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )'
        );
    }

    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
