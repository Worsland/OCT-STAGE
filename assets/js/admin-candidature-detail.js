/*
 * admin-candidature-detail.js
 * Affiche le detail complet d'une candidature : description, CV et
 * lettre de motivation (previsualisation + telechargement), et permet
 * de valider/refuser directement depuis cette page.
 *
 * Migration BDD : les liens de telechargement doivent pointer vers une
 * route servant le fichier reellement stocke, par ex.
 * /api/documents.php?candidature_id=101&type=cv, qui lit la table
 * DOCUMENT (colonne chemin_fichier) et renvoie le PDF. La previsualisation
 * peut utiliser une balise <iframe src="..."> une fois le fichier reel
 * accessible par une URL du serveur.
 */

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function getCandidatures() {
  var cached = sessionStorage.getItem("oct_candidatures_cache");
  if (cached) return Promise.resolve(JSON.parse(cached));
  return fetch("http://localhost/oct-stage/api/admin/candidatures.php", {
    headers: {
      'X-Admin-Session': '1'
    }
  }).then(function (r) { return r.json(); });
}

function saveCache(list) {
  sessionStorage.setItem("oct_candidatures_cache", JSON.stringify(list));
}

function docCard(label, filename, type, candidatureId) {
  if (!filename) {
    return (
      '<div class="doc-card">' +
        "<strong>" + label + "</strong>" +
        '<div class="doc-preview"><span class="doc-icon">&#128196;</span>Aucun fichier fourni</div>' +
      "</div>"
    );
  }
  return (
    '<div class="doc-card">' +
      "<strong>" + label + "</strong>" +
      '<div class="doc-preview"><span class="doc-icon">&#128196;</span>' + filename + "</div>" +
      '<div class="doc-actions">' +
        '<a class="btn btn-outline btn-sm" href="../api/documents.php?candidature_id=' + candidatureId + '&type=' + type + '" target="_blank" rel="noopener">Apercu</a>' +
        '<a class="btn btn-secondary btn-sm" href="../api/documents.php?candidature_id=' + candidatureId + '&type=' + type + '" download="' + filename + '">Telecharger</a>' +
      "</div>" +
    "</div>"
  );
}

function render(candidature, list) {
  var root = document.getElementById("detail-root");

  if (!candidature) {
    root.innerHTML = '<div class="empty-state">Candidature introuvable.</div>';
    return;
  }

  var actionsHtml = candidature.statut === "en_attente"
    ? '<button class="btn btn-success-outline" type="button" onclick="decider(\'validee\')">Valider la candidature</button>' +
      '<button class="btn btn-danger-outline" type="button" onclick="decider(\'refusee\')">Refuser la candidature</button>'
    : '<span class="hint">Cette candidature a deja ete traitee.</span>';

  root.innerHTML =
    '<div class="section-head">' +
      "<div><h2>" + candidature.candidat_nom + "</h2>" +
      '<p class="section-sub">Candidature pour : ' + candidature.offre_titre + "</p></div>" +
      statutCandidatureBadge(candidature.statut) +
    "</div>" +
    '<div class="detail-grid">' +
      "<div>" +
        '<div class="card">' +
          '<h3 class="mt-0">Description de la candidature</h3>' +
          "<p>" + candidature.description + "</p>" +
        "</div>" +
        '<div class="card mt-32">' +
          '<h3 class="mt-0">Informations du candidat</h3>' +
          '<div class="info-row"><span class="k">Reference</span><span class="v ref">REF-' + candidature.id + "</span></div>" +
          '<div class="info-row"><span class="k">Email</span><span class="v">' + candidature.candidat_email + "</span></div>" +
          '<div class="info-row"><span class="k">Telephone</span><span class="v">' + (candidature.candidat_telephone || "-") + "</span></div>" +
          '<div class="info-row"><span class="k">Date de depot</span><span class="v">' + formatDate(candidature.date_soumission) + "</span></div>" +
          '<div class="info-row"><span class="k">Service affecte</span><span class="v">' + (candidature.service_affecte || "-") + "</span></div>" +
          '<div class="info-row"><span class="k">Debut de stage</span><span class="v">' + (candidature.date_debut_stage ? formatDate(candidature.date_debut_stage) : "-") + "</span></div>" +
          '<div class="info-row"><span class="k">Duree</span><span class="v">' + (candidature.duree_semaines ? candidature.duree_semaines + " semaines" : "-") + "</span></div>" +
        "</div>" +
        '<div class="mt-32">' + actionsHtml + "</div>" +
      "</div>" +
      "<div>" +
        docCard("Curriculum vitae", candidature.cv_fichier || candidature.cv_nom, "cv", candidature.id) +
        docCard("Lettre de motivation", candidature.lettre_fichier || candidature.lettre_nom, "lettre", candidature.id) +
      "</div>" +
    "</div>";
}

var currentId = parseInt(getQueryParam("id"), 10);
var currentList = [];

function decider(statut) {
  var candidature = currentList.find(function (c) { return c.id === currentId; });
  if (!candidature) return;

  fetch("../api/admin/update-statut.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: currentId, statut: statut })
  })
  .then(function (res) { return res.json().then(function (data) {
      if (!res.ok || data.error) throw new Error(data.error || "Erreur serveur");
      return data;
  })})
  .then(function (data) {
      candidature.statut = data.statut || statut;
      if (data.service_affecte) candidature.service_affecte = data.service_affecte;
      if (data.duree_semaines) candidature.duree_semaines = data.duree_semaines;
      if (data.date_debut_stage) candidature.date_debut_stage = data.date_debut_stage;

      var sujet = statut === "validee" ? "Votre candidature a été validée" : "Réponse à votre candidature";
      var message = statut === "validee" 
        ? "Félicitations, votre candidature pour « " + candidature.offre_titre + " » a été validée."
        : "Nous vous remercions pour votre candidature à « " + candidature.offre_titre + " ». Nous ne pourrons pas y donner suite.";

      return envoyerEmail({
        to_email: candidature.candidat_email,
        to_name: candidature.candidat_nom,
        subject: sujet,
        message: message,
        verification_link: window.location.origin + "/pages/suivi.html"
      });
  })
  .then(function(){
      saveCache(currentList);
      render(candidature, currentList);
  })
  .catch(function (err) {
      alert("Echec : " + err.message);
  });
}
getCandidatures().then(function (list) {
  currentList = list;
  saveCache(list);
  var candidature = list.find(function (c) { return c.id === currentId; });
  render(candidature, list);
});