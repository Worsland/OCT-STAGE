# Prototype - Plateforme de gestion des offres et des demandes de stage (OCT)

Maquette HTML / CSS / JS statique, sans base de donnees, pensee pour etre
branchee facilement sur un backend PHP + base relationnelle plus tard
(voir le schema de base de donnees et le circuit de validation deja
concus pour ce projet).

## Arborescence

```
proto/
├── index.html                  Page d'accueil (choix d'espace)
├── rapports.html                Page publique : rapports de stage valides
├── candidat/
│   ├── offres.html               Liste des offres ouvertes
│   ├── candidature.html          Formulaire de depot (necessite une session)
│   ├── suivi.html                Suivi d'une candidature (reference)
│   ├── rapport.html              Depot / suivi du rapport de stage (stagiaires valides)
│   ├── inscription.html          Creation de compte (email ou Google)
│   ├── connexion.html            Connexion (email ou Google)
│   └── verification.html         Confirmation de l'adresse email
├── admin/
│   ├── login.html                Connexion administrateur
│   ├── dashboard.html            Statistiques generales
│   ├── offres.html                Gestion des offres (CRUD visuel)
│   ├── candidatures.html          Liste des candidatures (valider/refuser)
│   ├── candidature-detail.html    Detail : description, CV, lettre, decision
│   ├── stagiaires.html            Stagiaires (candidatures validees), tri par debut de stage
│   └── rapports.html              Tous les rapports de stage (valider/refuser)
├── api/
│   └── offres.php                 Route reelle connectee a la base (voir config/database.php)
├── assets/
│   ├── css/style.css            Design system (couleurs, typographie, composants)
│   └── js/                      Un fichier JS par page + main.js (partage)
├── data/
│   ├── offres.json              Donnees d'exemple -> table OFFRE_STAGE
│   └── candidatures.json        Donnees d'exemple -> table CANDIDATURE
└── config/
    ├── config.example.php       Constantes de connexion (a completer)
    └── database.example.php     Connexion PDO reutilisable + exemple de requete
```

## Pourquoi cette organisation

Chaque page HTML charge ses donnees via `fetch()` depuis un fichier JSON
dans `data/`, exactement comme elle le ferait depuis une route API. Le
code de rendu (construction des cartes, tableaux, badges) ne connait pas
la source des donnees : lui faire lire une API au lieu d'un fichier JSON
statique ne demande aucune reecriture.

## Etapes pour brancher la base de donnees

1. Creer la base a partir du schema deja conçu (tables `utilisateur`,
   `offre_stage`, `candidature`, `document`, `convention`, `service`,
   `notification` — voir `architecture_bdd_plateforme_stage.png`).
2. Copier `config/config.example.php` en `config/config.php` et
   renseigner l'hote, le nom de la base, l'utilisateur et le mot de passe.
3. Copier `config/database.example.php` en `config/database.php`.
4. Creer un dossier `api/` avec un fichier PHP par ressource
   (`offres.php`, `candidatures.php`, `stats.php`...), chacun utilisant
   `getPDO()` pour interroger la base et renvoyer du JSON.
5. Dans chaque fichier JS (`offres.js`, `suivi.js`, `dashboard.js`...),
   remplacer l'URL `../data/xxx.json` par l'URL de la route correspondante
   (`/api/xxx.php`). Aucune autre ligne n'a besoin de changer.
6. Remplacer les actions "en memoire" (ajout d'offre, validation d'une
   candidature) par de vrais appels `fetch(..., { method: "POST" })` vers
   ces memes routes.

## Authentification (candidats et administrateurs)

Le prototype simule un systeme de comptes avec `localStorage`/`sessionStorage`
(fichier `assets/js/auth.js`) :

- **Inscription par email** : creation du compte avec `email_verifie = false`,
  puis "envoi" d'un email de confirmation (simule par un toast + un lien
  cliquable vers `verification.html`). Une fois confirme, le candidat peut
  se connecter.
- **Inscription / connexion Google** : bouton "Continuer avec Google" qui
  simule un `signInWithPopup` Firebase reussi. Le code de migration reel
  (config Firebase, `GoogleAuthProvider`) est commente en tete de `auth.js`.
- **Espace candidat protege** : `candidature.html` appelle `requireAuth()` et
  redirige vers `connexion.html` si aucune session n'est active. Si une
  session existe, les champs nom/prenom/email/telephone sont pre-remplis.
- **Espace administration protege** : chaque page admin appelle
  `requireAdmin()` ; sans session admin, redirection vers `admin/login.html`
  (identifiants de demonstration : `admin@oct.tn` / `admin123`).

Migration reelle : remplacer le stockage local par de vraies routes
`/api/auth/*.php` ecrivant dans la table `UTILISATEUR` (mot de passe
hache avec `password_hash()`), et par le SDK Firebase Authentication pour
la connexion Google. Voir les commentaires detailles dans `auth.js`.

## Emails automatiques

`simulerEnvoiEmail()` (dans `auth.js`) centralise tous les envois : email
de confirmation d'inscription, accuse de reception d'une candidature, et
reponse (validee/refusee) envoyee depuis la page de detail ou la liste des
candidatures. Chaque envoi s'affiche comme une notification a l'ecran et
correspond, en base, a une ligne dans la table `NOTIFICATION`
(colonne `canal = 'email'`). En production, cette fonction doit declencher
un vrai envoi (PHPMailer, SendGrid, Amazon SES...) juste apres l'ecriture
en base.

## Detail d'une candidature (admin)

La page `admin/candidature-detail.html` affiche la description saisie par
le candidat, ses coordonnees, et deux blocs de documents (CV et lettre de
motivation) avec des boutons "Apercu" et "Telecharger". Dans le prototype,
ces boutons affichent un message explicatif ; en production, ils doivent
pointer vers une route servant le fichier reel a partir de la table
`DOCUMENT` (colonne `chemin_fichier`).

Le statut d'une candidature (`en_attente`, `validee`, `refusee`) pilote
directement l'affichage du composant "stepper" (page suivi) et des
badges (pages admin) — c'est la meme logique que le circuit de validation
documente plus haut dans le projet (soumission -> examen -> decision ->
affectation / notification).

## Stagiaires et rapports de stage

- **Page publique `rapports.html`** : liste les rapports de stage dont le
  statut est `valide`, tries du plus recent au moins recent (`date_depot`
  descendant). En base, cela correspond a
  `SELECT ... FROM rapport_stage WHERE statut = 'valide' ORDER BY date_depot DESC`.
- **`admin/stagiaires.html`** : liste les candidatures dont le statut est
  `validee` (= les stagiaires), avec date de debut, duree, domaine et
  service, triees par date de debut de stage decroissante.
- **`admin/rapports.html`** : liste **tous** les rapports (valides ou non),
  avec actions "Valider" / "Refuser" qui declenchent un email automatique
  au stagiaire.
- **`candidat/rapport.html`** : accessible uniquement si l'email de la
  session correspond a une candidature validee. Permet de deposer un
  rapport (une seule fois) et d'en suivre le statut. Compte de
  demonstration deja valide : `salma.bouzid@example.com` / `demo123`.

Ces pages introduisent une nouvelle table en base, `RAPPORT_STAGE`
(voir `architecture_bdd_plateforme_stage.png`), reliee a `CANDIDATURE`.
Le champ `domaine` a egalement ete ajoute a `OFFRE_STAGE`, et
`date_debut_stage` a `CANDIDATURE`.

## Connexion reelle a la base de donnees (deja commencee)

`config/database.php` contient la connexion PDO reelle (XAMPP / MySQL).
`api/offres.php` est le premier point d'entree connecte : il alimente
`candidat/offres.html` via `assets/js/offres.js`, qui essaie d'abord
l'API reelle puis retombe sur `data/offres.json` si elle n'est pas
disponible (pratique pour continuer a demontrer le prototype sans
serveur PHP demarre). Les autres pages (`candidatures`, `stagiaires`,
`rapports`...) restent pour l'instant sur les fichiers `data/*.json` :
meme principe de migration que decrit plus haut, a appliquer route par
route (`api/candidatures.php`, `api/stagiaires.php`, `api/rapports.php`).
