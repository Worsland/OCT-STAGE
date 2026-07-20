/*
 * mon-rapport.js
 * Verifie que le candidat connecte a une candidature validee (= stagiaire).
 * Si oui : permet de deposer un rapport et affiche son statut. Sinon :
 * message explicatif.
 *
 * Migration BDD :
 *   SELECT * FROM candidature WHERE candidat_id = :id AND statut = 'validee'
 *   Le depot doit poster vers /api/rapports.php (multipart), qui insere
 *   dans RAPPORT_STAGE (statut initial 'en_attente').
 */

var session = requireAuth("rapport.html");
if (!session) {
  throw new Error("Utilisateur non authentifié");
}

function getCandidatures() {
  return fetch("../api/candidatures.php?id_candidat=" + encodeURIComponent(session.id))
    .then(function (r) { return r.json(); });
}
function getRapports() {
  return fetch("../api/rapport/list.php?id_candidat=" + encodeURIComponent(session.id))
    .then(function (r) { return r.json(); });
}

Promise.all([getCandidatures(), getRapports()]).then(function (results) {
  var candidatures = Array.isArray(results[0]) ? results[0] : [];
  var rapports = Array.isArray(results[1]) ? results[1] : [];

  var stage = candidatures.find(function (c) {
    return c.statut === "validee" && ((c.candidat_email || "").toLowerCase() === session.email.toLowerCase());
  });

  var root = document.getElementById("rapport-root");

  if (!stage) {
    root.innerHTML =
      '<div class="card"><p>Vous n\'avez pas (encore) de candidature validee. Le depot d\'un rapport de stage est reserve aux stagiaires dont le dossier a ete accepte.</p>' +
      '<div class="hint">Pour tester cette page en demonstration, connectez-vous avec <strong>salma.bouzid@example.com</strong> / <strong>demo123</strong>.</div></div>';
    return;
  }

  var rapportExistant = rapports.find(function (r) { return r.candidature_id === stage.id; });

  var infoHtml =
    '<div class="card mt-32">' +
      '<h3 class="mt-0">Mon stage</h3>' +
      '<div class="info-row"><span class="k">Service</span><span class="v">' + stage.service_affecte + "</span></div>" +
      '<div class="info-row"><span class="k">Domaine</span><span class="v">' + stage.domaine + "</span></div>" +
      '<div class="info-row"><span class="k">Debut</span><span class="v">' + formatDate(stage.date_debut_stage) + "</span></div>" +
      '<div class="info-row"><span class="k">Duree</span><span class="v">' + stage.duree_semaines + " semaines</span></div>" +
    "</div>";

  var evalHtml =
    '<div class="card mt-32">' +
      '<h3 class="mt-0">Mon évaluation de stage</h3>' +
      (stage.eval_date_upload
        ? '<div class="info-row"><span class="k">Publiee le</span><span class="v">' + formatDate(stage.eval_date_upload) + "</span></div>" +
          '<a class="btn btn-outline btn-sm mt-8" href="../api/evaluation/download.php?id=' + stage.id + '&id_candidat=' + encodeURIComponent(session.id) + '" target="_blank" rel="noopener">Voir mon évaluation</a>'
        : '<p class="hint">Votre évaluation de stage n\'a pas encore été publiée par l\'administration.</p>') +
    "</div>";

  var statusHtml = "";
  if (rapportExistant) {
    statusHtml =
      '<div class="card mt-32">' +
        '<h3 class="mt-0">Mon rapport de stage</h3>' +
        '<div class="info-row"><span class="k">Titre</span><span class="v">' + rapportExistant.titre + "</span></div>" +
        '<div class="info-row"><span class="k">Depose le</span><span class="v">' + formatDate(rapportExistant.date_depot) + "</span></div>" +
        '<div class="info-row"><span class="k">Statut</span><span class="v">' + statutRapportBadge(rapportExistant.statut) + "</span></div>" +
        '<a class="btn btn-outline btn-sm mt-8" href="../api/rapport/download.php?id=' + rapportExistant.id + '&id_candidat=' + encodeURIComponent(session.id) + '" target="_blank" rel="noopener">Voir mon rapport</a>' +
      "</div>";
  } else {
    statusHtml =
      '<div class="form-card mt-32">' +
        '<h3 class="mt-0">Deposer mon rapport de stage</h3>' +
        '<div id="rapport-alert" class="alert"></div>' +
        '<form id="rapport-form">' +
          '<div class="field"><label for="titre">Titre du rapport</label><input type="text" id="titre" required></div>' +
          '<div class="field"><label for="fichier">Fichier (PDF)</label><div class="file-drop"><input type="file" id="fichier" accept="application/pdf" required></div></div>' +
          '<button type="submit" class="btn btn-primary btn-block">Envoyer mon rapport</button>' +
        "</form>" +
      "</div>";
  }

  root.innerHTML = infoHtml + evalHtml + statusHtml;

  var form = document.getElementById("rapport-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var formData = new FormData();
      formData.append('id_candidat', session.id);
      formData.append('id_candidature', stage.id);
      formData.append('titre', document.getElementById("titre").value.trim());
      if (document.getElementById("fichier").files[0]) {
        formData.append('fichier', document.getElementById("fichier").files[0]);
      }

      fetch('../api/rapport/upload.php', {
        method: 'POST',
        body: formData
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data.success) {
            location.reload();
          } else {
            var alertBox = document.getElementById('rapport-alert');
            if (alertBox) {
              alertBox.className = 'alert alert-danger show';
              alertBox.textContent = data.error || 'Erreur lors de l’envoi du rapport.';
            }
          }
        })
        .catch(function () {
          var alertBox = document.getElementById('rapport-alert');
          if (alertBox) {
            alertBox.className = 'alert alert-danger show';
            alertBox.textContent = 'Impossible d’envoyer le rapport pour le moment.';
          }
        });
    });
  }
});