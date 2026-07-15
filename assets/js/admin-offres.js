/*
 * admin-offres.js
 * Affiche la table des offres et gere l'ajout (en memoire uniquement).
 *
 * Migration BDD :
 * - Le fetch initial doit pointer vers /api/offres.php (SELECT * FROM offre_stage).
 * - Le formulaire d'ajout doit poster vers /api/offres.php (INSERT INTO
 *   offre_stage ...) au lieu de push() dans le tableau JS local.
 * - Les boutons "Modifier" / "Supprimer" doivent appeler respectivement
 *   UPDATE et DELETE sur la table OFFRE_STAGE via l'id de la ligne.
 */

var offresLocal = [];

function renderOffresTable() {
  var tbody = document.getElementById("offres-tbody");

  if (offresLocal.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Aucune offre enregistree.</td></tr>';
    return;
  }

  tbody.innerHTML = offresLocal.map(function (o) {
    return (
      "<tr>" +
        '<td><span class="ref">OFF-' + o.id + "</span></td>" +
        "<td>" + o.titre + "</td>" +
        "<td>" + o.service + "</td>" +
        "<td>" + o.duree_semaines + " sem.</td>" +
        "<td>" + statutOffreBadge(o.statut) + "</td>" +
        '<td class="cell-actions">' +
          '<button class="btn btn-outline btn-sm" type="button" onclick="alert(\'Formulaire de modification a brancher sur la base de donnees.\')">Modifier</button>' +
          '<button class="btn btn-danger-outline btn-sm" type="button" onclick="supprimerOffre(' + o.id + ')">Supprimer</button>' +
        "</td>" +
      "</tr>"
    );
  }).join("");
}

function supprimerOffre(id) {
  offresLocal = offresLocal.filter(function (o) { return o.id !== id; });
  renderOffresTable();
}

fetch("http://localhost/oct-stage/api/offres.php", {
  headers: {
    'X-Admin-Session': '1'
  }
})
  .then(function (res) { return res.json(); })
  .then(function (data) {
    offresLocal = Array.isArray(data) ? data : [];
    renderOffresTable();
  })
  .catch(function () {
    offresLocal = [];
    renderOffresTable();
  });

document.getElementById("nouvelle-offre-form").addEventListener("submit", function (e) {
  e.preventDefault();
  var titre = document.getElementById("new-titre").value.trim();
  var service = document.getElementById("new-service").value.trim();
  var duree = parseInt(document.getElementById("new-duree").value, 10) || 1;

  if (!titre || !service) return;

  var payload = new URLSearchParams({
    titre: titre,
    service: service,
    description: "",
    domaine: "",
    duree_semaines: duree,
    statut: "ouverte"
  });

  fetch("../api/offres.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      "X-Admin-Session": "1"
    },
    body: payload
  })
    .then(function (res) { return res.json(); })
    .then(function (result) {
      if (result && result.success && result.offre) {
        offresLocal.push(result.offre);
        renderOffresTable();
      }
      e.target.reset();
      document.getElementById("new-offre-panel").classList.remove("show-panel");
    })
    .catch(function () {
      e.target.reset();
      document.getElementById("new-offre-panel").classList.remove("show-panel");
    });
});
