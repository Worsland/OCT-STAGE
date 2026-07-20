<?php
/**
 * api/offres.php
 * Fournit la liste des offres de stage et permet leur création côté admin.
 * MODIF : date_fin calculée automatiquement = date_debut + (duree_semaines * 7 - 1 jour)
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
        $dateFinRecu = trim((string)($payload['date_fin'] ?? ''));
        $duree = isset($payload['duree_semaines']) ? (int)$payload['duree_semaines'] : null;
        $statut = trim((string)($payload['statut'] ?? 'ouverte'));

        if ($titre === '' || $service === '') {
            http_response_code(422);
            echo json_encode(['success' => false, 'erreur' => 'Le titre et le service sont obligatoires.']);
            exit;
        }

        // Validation date_debut obligatoire maintenant
        if ($dateDebut === '') {
            http_response_code(422);
            echo json_encode(['success' => false, 'erreur' => 'La date de début est obligatoire.']);
            exit;
        }

        if ($duree === null || $duree <= 0) {
            http_response_code(422);
            echo json_encode(['success' => false, 'erreur' => 'La durée doit être supérieure à 0.']);
            exit;
        }

        // Calcul automatique de date_fin côté serveur (sécurité)
        // Formule : date_fin = date_debut + (duree * 7 - 1) jours
        // Ex: 2026-07-20 + 4 semaines = 2026-08-16 (Lundi au Dimanche inclus)
        $dateFinCalculee = null;
        try {
            $dtDebut = new DateTime($dateDebut);
            $dtFin = clone $dtDebut;
            $joursAAjouter = ($duree * 7) - 1;
            $dtFin->modify("+{$joursAAjouter} days");
            $dateFinCalculee = $dtFin->format('Y-m-d');
        } catch (Exception $e) {
            http_response_code(422);
            echo json_encode(['success' => false, 'erreur' => 'Format de date de début invalide.']);
            exit;
        }

        // On prend toujours le calcul serveur, on ignore ce que le JS envoie (anti-triche)
        $dateFinFinal = $dateFinCalculee;

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
            $dateDebut,
            $dateFinFinal,
            $duree,
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
    // En dev tu peux logger $e->getMessage()
    echo json_encode(['success' => false, 'erreur' => 'Impossible de traiter la demande.']);
}
