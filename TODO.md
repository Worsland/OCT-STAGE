# Plan de finalisation de l'application OCT Stages

## Objectif
Documenter ce qui reste à faire pour transformer le prototype en application complète et cohérente.

## Étapes à suivre pour finir le projet

### 1. Préparer l’environnement de base
- [x] Vérifier que les fichiers PHP et JS principaux sont en place
- [x] Ajouter un schéma SQL complet pour les tables nécessaires
- [ ] Vérifier que la base MySQL contient bien toutes les tables
- [ ] Vérifier que le fichier config/database.php pointe vers la bonne base XAMPP
- [ ] Importer ou exécuter le script SQL si ce n’est pas déjà fait

### 2. Finaliser les flux métier essentiels
- [ ] Générer une convention de stage à partir d’une candidature validée
- [ ] Associer correctement chaque rapport à une candidature et à un candidat
- [ ] Valider le parcours complet : inscription → candidature → validation → dépôt de rapport

### 3. Améliorer l’expérience utilisateur
- [ ] Ajouter des messages d’erreur plus clairs côté interface
- [ ] Ajouter des messages de succès plus explicites après chaque action
- [ ] Uniformiser les formulaires et les états de chargement

### 4. Sécuriser et professionnaliser l’application
- [ ] Remplacer les identifiants admin en dur par une vraie authentification sécurisée
- [ ] Protéger davantage les APIs contre les accès non autorisés
- [ ] Ajouter une gestion plus propre des sessions et des redirections

### 5. Tests et validation finale
- [ ] Tester chaque page principale manuellement dans le navigateur
- [ ] Vérifier les flux candidat et administrateur de bout en bout
- [ ] Corriger les bugs restants observés lors des tests

## Tâches déjà réalisées
- [x] Routes d'administration pour les candidatures et leur statut
- [x] Routes de rapports pour la liste, l’upload et la lecture
- [x] Inscription candidat via API
- [x] Pages admin et candidat branchées sur les APIs principales
- [x] Gestion des documents pour le CV, la lettre de motivation et le rapport
- [x] Validation / refus des rapports via une API dédiée
- [x] Notifications de base via le système de notification
- [x] Protection d’accès basique pour les sessions administrateur

## À faire manuellement côté environnement
- [ ] Vérifier que la base MySQL contient les tables attendues
- [ ] Vérifier que le fichier config/database.php pointe vers la bonne base et les bons identifiants XAMPP
- [ ] Importer un schéma SQL si nécessaire
