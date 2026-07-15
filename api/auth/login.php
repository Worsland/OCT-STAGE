<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../../config/database.php';

$data = json_decode(file_get_contents('php://input'), true) ?: [];
$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

if ($email === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Email et mot de passe requis.']);
    exit;
}

try {
    $stmt = $pdo->prepare('SELECT * FROM CANDIDAT WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($password, $user['mot_de_passe'] ?? '')) {
        http_response_code(401);
        echo json_encode(['error' => 'Email ou mot de passe incorrect.']);
        exit;
    }

    if ((int) $user['email_verifie'] !== 1) {
        http_response_code(403);
        echo json_encode(['error' => 'Veuillez confirmer votre adresse email avant de vous connecter.']);
        exit;
    }

    $_SESSION['id_candidat'] = (int) $user['id'];
    $_SESSION['nom'] = $user['prenom'] . ' ' . $user['nom'];

    echo json_encode([
        'success' => true,
        'user' => [
            'id' => (int) $user['id'],
            'nom' => $user['nom'],
            'prenom' => $user['prenom'],
            'email' => $user['email'],
            'telephone' => $user['telephone'],
            'etablissement' => $user['etablissement'],
            'role' => $user['role'],
            'provider' => $user['provider'],
        ],
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur de connexion.', 'details' => $e->getMessage()]);
}