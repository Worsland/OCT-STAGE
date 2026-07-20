/*
 * offres.js
 * Charge la liste des offres depuis l'API reelle (api/offres.php). Si
 * l'API n'est pas disponible (prototype ouvert sans serveur PHP/MySQL),
 * on retombe automatiquement sur data/offres.json pour garder une demo
 * utilisable hors connexion a la base de donnees.
 */

// IDs des offres auxquelles le candidat connecte a deja postule (rempli avant renderOffres).
var offresDejaPostulees = [];

function renderOffres(offres) {
  var grid = document.getElementById("offres-grid");
  var ouvertes = offres.filter(function (o) { return o.statut === "ouverte"; });

  if (ouvertes.length === 0) {
    grid.innerHTML = '<div class="empty-state">Aucune offre disponible pour le moment.</div>';
    return;
  }

  var session = getSession();

  grid.innerHTML = ouvertes.map(function (o) {
    var dejaPostule = session && offresDejaPostulees.indexOf(String(o.id)) !== -1;
    var candidatureUrl = "candidature.html?offre_id=" + encodeURIComponent(o.id);
    var target = session ? candidatureUrl : "connexion.html?next=" + encodeURIComponent(candidatureUrl);
    var label = session ? "Postuler a cette offre" : "Se connecter pour postuler";
    var btnClass = session ? "btn-primary" : "btn-secondary";
    var actionHtml = '<a class="btn ' + btnClass + ' btn-sm" href="' + target + '">' + label + '</a>';

    if (dejaPostule) {
      actionHtml =
        '<span class="badge badge-pending" style="align-self:flex-start;">Deja postule</span>' +
        '<a class="btn btn-secondary btn-sm" href="mes-candidatures.html">Voir ma candidature</a>';
    }

    return (
      '<div class="card">' +
        "<h3>" + o.titre + "</h3>" +
        '<div class="card-meta">' +
          "<span>" + o.service + "</span>" +
          "<span>&middot;</span>" +
          "<span>" + o.domaine + "</span>" +
          "<span>&middot;</span>" +
          "<span>" + o.duree_semaines + " semaines</span>" +
          "<span>&middot;</span>" +
          "<span>" + formatDate(o.date_debut) + "</span>" +
        "</div>" +
        '<p class="desc">' + o.description + "</p>" +
        actionHtml +
      "</div>"
    );
  }).join("");
}

function chargerOffresEtRendre() {
  fetch("http://localhost/oct-stage/api/offres.php")
    .then(function (res) {
      if (!res.ok) throw new Error("API indisponible");
      return res.json();
    })
    .then(renderOffres)
    .catch(function () {
      // Repli demo : base de donnees pas encore branchee.
      fetch("../data/offres.json")
        .then(function (res) { return res.json(); })
        .then(renderOffres)
        .catch(function () {
          document.getElementById("offres-grid").innerHTML =
            '<div class="empty-state">Impossible de charger les offres pour le moment.</div>';
        });
    });
}

// Si un candidat est connecte, on recupere d'abord ses candidatures existantes
// pour savoir a quelles offres il a deja postule, avant d'afficher la liste.
var sessionCourante = typeof getSession === "function" ? getSession() : null;
if (sessionCourante && sessionCourante.id) {
  fetch("../api/candidatures.php?id_candidat=" + encodeURIComponent(sessionCourante.id))
    .then(function (res) { return res.ok ? res.json() : []; })
    .then(function (candidatures) {
      offresDejaPostulees = (Array.isArray(candidatures) ? candidatures : [])
        .map(function (c) { return String(c.id_offre); });
    })
    .catch(function () { offresDejaPostulees = []; })
    .then(chargerOffresEtRendre);
} else {
  chargerOffresEtRendre();
}