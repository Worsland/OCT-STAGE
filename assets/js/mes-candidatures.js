/*
 * mes-candidatures.js
 * Affiche la liste des candidatures deposees par le candidat connecte.
 * Necessite une session active (redirige vers connexion.html sinon).
 */

var session = requireAuth("mes-candidatures.html");
if (!session) {
  throw new Error("Utilisateur non authentifié");
}

function badgeInfo(statut) {
  if (statut === "validee") return { cls: "badge-validated", label: "Validee" };
  if (statut === "refusee") return { cls: "badge-refused", label: "Refusee" };
  return { cls: "badge-pending", label: "En attente" };
}

function renderCandidatures(candidatures) {
  var list = document.getElementById("mes-candidatures-list");

  if (!Array.isArray(candidatures) || candidatures.length === 0) {
    list.innerHTML =
      '<div class="empty-state">Vous n\'avez encore depose aucune candidature. ' +
      '<a href="offres.html">Consultez les offres de stage</a>.</div>';
    return;
  }

  list.innerHTML = '<div class="card-grid">' + candidatures.map(function (c) {
    var badge = badgeInfo(c.statut);
    var titre = c.titre || c.offre_titre || "Candidature";
    var reference = c.reference || ("REF-" + c.id);

    return (
      '<div class="card">' +
        "<h3>" + titre + "</h3>" +
        '<div class="card-meta">' +
          '<span class="ref">' + reference + "</span>" +
          "<span>&middot;</span>" +
          "<span>Deposee le " + formatDate(c.date_depot || c.date_soumission) + "</span>" +
        "</div>" +
        '<span class="badge ' + badge.cls + '">' + badge.label + "</span>" +
        (c.statut === "validee" ?
          '<a class="btn btn-primary btn-sm" href="rapport.html">Deposer / voir mon rapport de stage</a>' :
          '<a class="btn btn-secondary btn-sm" href="suivi.html">Suivre cette candidature</a>') +
      "</div>"
    );
  }).join("") + "</div>";
}

fetch("../api/candidatures.php?id_candidat=" + encodeURIComponent(session.id))
  .then(function (res) {
    if (!res.ok) throw new Error("API indisponible");
    return res.json();
  })
  .then(renderCandidatures)
  .catch(function () {
    document.getElementById("mes-candidatures-list").innerHTML =
      '<div class="empty-state">Impossible de charger vos candidatures pour le moment.</div>';
  });