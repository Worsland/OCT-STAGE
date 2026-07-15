<?php
/**
 * api/offres.php
 * Fournit la liste des offres de stage et permet leur création côté admin.
 */

require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    if ($method === 'GET') {
        $showAll = !empty($_SERVER['HTTP_X_ADMIN_SESSION']) || (isset($_GET['scope']) && $_GET['scope'] === 'all');
        $sql = "SELECT id_offre AS id, titre, service, domaine, description,
                      date_debut, date_fin, duree_semaines, statut
                FROM offre_stage";

        if (!$showAll) {
            $sql .= " WHERE statut = 'ouverte'";
        }

        $sql .= " ORDER BY date_debut ASC, id_offre ASC";

        $stmt = $pdo->query($sql);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        exit;
    }

    if ($method === 'POST') {
        $payload = $_POST;

        if (empty($payload) && !empty(file_get_contents('php://input'))) {
            parse_str(file_get_contents('php://input'), $payload);
        }

        $titre = trim((string)($payload['titre'] ?? ''));
        $service = trim((string)($payload['service'] ?? ''));
        $description = trim((string)($payload['description'] ?? ''));
        $domaine = trim((string)($payload['domaine'] ?? ''));
        $dateDebut = trim((string)($payload['date_debut'] ?? ''));
        $dateFin = trim((string)($payload['date_fin'] ?? ''));
        $duree = isset($payload['duree_semaines']) ? (int)$payload['duree_semaines'] : null;
        $statut = trim((string)($payload['statut'] ?? 'ouverte'));

        if ($titre === '' || $service === '') {
            http_response_code(422);
            echo json_encode(['success' => false, 'erreur' => 'Le titre et le service sont obligatoires.']);
            exit;
        }

        $stmt = $pdo->prepare(
            "INSERT INTO offre_stage (titre, service, domaine, description, statut, date_debut, date_fin, duree_semaines)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        );

        $stmt->execute([
            $titre,
            $service,
            $domaine !== '' ? $domaine : null,
            $description !== '' ? $description : null,
            $statut !== '' ? $statut : 'ouverte',
            $dateDebut !== '' ? $dateDebut : null,
            $dateFin !== '' ? $dateFin : null,
            $duree !== null && $duree > 0 ? $duree : null,
        ]);

        $id = (int)$pdo->lastInsertId();
        $select = $pdo->prepare(
            "SELECT id_offre AS id, titre, service, domaine, description,
                    date_debut, date_fin, duree_semaines, statut
             FROM offre_stage
             WHERE id_offre = ?"
        );
        $select->execute([$id]);

        echo json_encode([
            'success' => true,
            'offre' => $select->fetch(PDO::FETCH_ASSOC),
        ]);
        exit;
    }

    http_response_code(405);
    echo json_encode(['success' => false, 'erreur' => 'Méthode non autorisée.']);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'erreur' => 'Impossible de traiter la demande.']);
}
