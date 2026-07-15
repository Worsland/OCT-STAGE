<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../../config/database.php';

$token = trim($_GET['token'] ?? ($_POST['token'] ?? ''));

if ($token === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Aucun jeton de vérification fourni.']);
    exit;
}

try {
    $stmt = $pdo->prepare(
        'SELECT id, email, verification_expire FROM CANDIDAT WHERE verification_token = ?'
    );
    $stmt->execute([$token]);
    $candidat = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$candidat) {
        http_response_code(404);
        echo json_encode(['error' => 'Lien de vérification invalide ou déjà utilisé.']);
        exit;
    }

    if ($candidat['verification_expire'] !== null && strtotime($candidat['verification_expire']) < time()) {
        http_response_code(410);
        echo json_encode(['error' => 'Ce lien de vérification a expiré. Merci de vous réinscrire ou de demander un nouveau lien.']);
        exit;
    }

    $update = $pdo->prepare(
        'UPDATE CANDIDAT SET email_verifie = 1, verification_token = NULL, verification_expire = NULL WHERE id = ?'
    );
    $update->execute([$candidat['id']]);

    echo json_encode(['success' => true, 'email' => $candidat['email']]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Impossible de vérifier ce compte.', 'details' => $e->getMessage()]);
}