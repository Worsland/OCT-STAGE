<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../../config/database.php';

/*
 * Appele par le front une fois que Firebase Authentication a confirme la
 * connexion Google (signInWithPopup). On ne fait ici QUE lire les infos
 * deja verifiees par Google (email, nom, uid) pour creer/retrouver la
 * ligne CANDIDAT correspondante ; aucun mot de passe n'est implique.
 */

$data = json_decode(file_get_contents('php://input'), true) ?: [];
$email = trim($data['email'] ?? '');
$googleUid = trim($data['google_uid'] ?? '');
$displayName = trim($data['displayName'] ?? '');

if ($email === '' || $googleUid === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Informations Google manquantes.']);
    exit;
}

$prenom = $displayName;
$nom = '';
if ($displayName !== '' && strpos($displayName, ' ') !== false) {
    $parts = explode(' ', $displayName, 2);
    $prenom = $parts[0];
    $nom = $parts[1];
}
if ($nom === '') {
    $nom = '-';
}
if ($prenom === '') {
    $prenom = $email;
}

try {
    $stmt = $pdo->prepare('SELECT * FROM CANDIDAT WHERE email = ? OR google_uid = ?');
    $stmt->execute([$email, $googleUid]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        $update = $pdo->prepare(
            'UPDATE CANDIDAT SET provider = "google", google_uid = ?, email_verifie = 1 WHERE id = ?'
        );
        $update->execute([$googleUid, $user['id']]);
        $userId = (int) $user['id'];
    } else {
        $insert = $pdo->prepare(
            'INSERT INTO CANDIDAT (nom, prenom, email, mot_de_passe, role, provider, email_verifie, google_uid)
             VALUES (?, ?, ?, ?, "candidat", "google", 1, ?)'
        );
        // Compte Google : pas de mot de passe local, on stocke un hash
        // aleatoire inutilisable pour la connexion par email/mot de passe.
        $randomPassword = password_hash(bin2hex(random_bytes(16)), PASSWORD_DEFAULT);
        $insert->execute([$nom, $prenom, $email, $randomPassword, $googleUid]);
        $userId = (int) $pdo->lastInsertId();
    }

    $_SESSION['id_candidat'] = $userId;
    $_SESSION['nom'] = $prenom . ' ' . $nom;

    $final = $pdo->prepare('SELECT id, nom, prenom, email, telephone, etablissement, role, provider FROM CANDIDAT WHERE id = ?');
    $final->execute([$userId]);
    $row = $final->fetch(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'user' => $row]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Impossible de connecter le compte Google.', 'details' => $e->getMessage()]);
}