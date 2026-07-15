<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../../config/database.php';

function ensureCandidateTable(PDO $pdo): void {
    $stmt = $pdo->query('SHOW TABLES LIKE "CANDIDAT"');
    if ($stmt->fetch()) {
        $existingColumns = [];
        $colStmt = $pdo->query('SHOW COLUMNS FROM CANDIDAT');
        foreach ($colStmt->fetchAll(PDO::FETCH_ASSOC) as $column) {
            $existingColumns[] = $column['Field'];
        }

        $alterStatements = [];
        if (!in_array('nom', $existingColumns, true)) { $alterStatements[] = 'ADD COLUMN nom VARCHAR(100) NOT NULL'; }
        if (!in_array('prenom', $existingColumns, true)) { $alterStatements[] = 'ADD COLUMN prenom VARCHAR(100) NOT NULL'; }
        if (!in_array('email', $existingColumns, true)) { $alterStatements[] = 'ADD COLUMN email VARCHAR(255) NOT NULL UNIQUE'; }
        if (!in_array('mot_de_passe', $existingColumns, true)) { $alterStatements[] = 'ADD COLUMN mot_de_passe VARCHAR(255) NOT NULL'; }
        if (!in_array('telephone', $existingColumns, true)) { $alterStatements[] = 'ADD COLUMN telephone VARCHAR(50) NULL'; }
        if (!in_array('etablissement', $existingColumns, true)) { $alterStatements[] = 'ADD COLUMN etablissement VARCHAR(255) NULL'; }
        if (!in_array('role', $existingColumns, true)) { $alterStatements[] = 'ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT "candidat"'; }
        if (!in_array('provider', $existingColumns, true)) { $alterStatements[] = 'ADD COLUMN provider VARCHAR(50) NOT NULL DEFAULT "local"'; }
        if (!in_array('email_verifie', $existingColumns, true)) { $alterStatements[] = 'ADD COLUMN email_verifie TINYINT(1) NOT NULL DEFAULT 0'; }
        if (!in_array('google_uid', $existingColumns, true)) { $alterStatements[] = 'ADD COLUMN google_uid VARCHAR(255) NULL'; }
        if (!in_array('verification_token', $existingColumns, true)) { $alterStatements[] = 'ADD COLUMN verification_token VARCHAR(64) NULL'; }
        if (!in_array('verification_expire', $existingColumns, true)) { $alterStatements[] = 'ADD COLUMN verification_expire DATETIME NULL'; }
        if (!in_array('created_at', $existingColumns, true)) { $alterStatements[] = 'ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'; }

        if (!empty($alterStatements)) {
            $pdo->exec('ALTER TABLE CANDIDAT ' . implode(', ', $alterStatements));
        }
        return;
    }

    $pdo->exec(
        'CREATE TABLE CANDIDAT (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nom VARCHAR(100) NOT NULL,
            prenom VARCHAR(100) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            mot_de_passe VARCHAR(255) NOT NULL,
            telephone VARCHAR(50) NULL,
            etablissement VARCHAR(255) NULL,
            role VARCHAR(50) NOT NULL DEFAULT "candidat",
            provider VARCHAR(50) NOT NULL DEFAULT "local",
            email_verifie TINYINT(1) NOT NULL DEFAULT 0,
            google_uid VARCHAR(255) NULL,
            verification_token VARCHAR(64) NULL,
            verification_expire DATETIME NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )'
    );
}

function ensureNotificationTable(PDO $pdo): void {
    $stmt = $pdo->query('SHOW TABLES LIKE "NOTIFICATION"');
    if ($stmt->fetch()) {
        return;
    }
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

try {
    ensureCandidateTable($pdo);
    ensureNotificationTable($pdo);

    $data = json_decode(file_get_contents('php://input'), true) ?: [];
    $nom = trim($data['nom'] ?? '');
    $prenom = trim($data['prenom'] ?? '');
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';
    $telephone = trim($data['telephone'] ?? '');
    $etablissement = trim($data['etablissement'] ?? '');

    if ($nom === '' || $prenom === '' || $email === '' || $password === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Champs obligatoires manquants']);
        exit;
    }

    $stmt = $pdo->prepare('SELECT id FROM CANDIDAT WHERE email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'Un compte existe déjà avec cet email.']);
        exit;
    }

    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    $verificationToken = bin2hex(random_bytes(32));
    $stmt = $pdo->prepare(
        'INSERT INTO CANDIDAT (nom, prenom, email, mot_de_passe, telephone, etablissement, role, provider, email_verifie, verification_token, verification_expire)
         VALUES (?, ?, ?, ?, ?, ?, "candidat", "local", 0, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))'
    );
    $stmt->execute([$nom, $prenom, $email, $hashedPassword, $telephone, $etablissement, $verificationToken]);
    $newId = (int) $pdo->lastInsertId();

    // Lien de confirmation : le candidat doit cliquer dessus avant de pouvoir se connecter.
    $verificationLink = '/oct-stage/candidat/verification.html?token=' . $verificationToken;

    $notifStmt = $pdo->prepare(
        'INSERT INTO NOTIFICATION (destinataire, sujet, corps, canal, date_envoi) VALUES (?, ?, ?, "email", NOW())'
    );
    $notifStmt->execute([
        $email,
        'Confirmez votre adresse email',
        "Cliquez sur ce lien pour activer votre compte Stages OCT : " . $verificationLink,
    ]);

    // NOTE (envoi reel) : aucun service SMTP n'est encore configure. Des que
    // PHPMailer/SendGrid/SES est en place, declencher ici le vrai envoi de
    // $verificationLink a $email, et retirer 'verification_link' de la
    // reponse JSON (il n'est renvoye au front que pour la demo, tant que
    // l'email n'est pas reellement envoye).
    echo json_encode([
        'success' => true,
        'id' => $newId,
        'message' => 'Compte cree. Verifiez votre boite mail pour activer votre compte.',
        'verification_link' => $verificationLink,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Impossible de créer le compte.', 'details' => $e->getMessage()]);
}