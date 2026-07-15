/*
 * suivi.js
 * Recherche une candidature par reference et affiche son etat dans le stepper.
 *
 * Migration BDD : remplacer la recherche dans le tableau charge depuis
 * data/candidatures.json par une requete, par ex.
 * fetch("/api/candidature.php?id=" + ref), qui execute cote serveur :
 * SELECT * FROM candidature WHERE id = :id (voir table CANDIDATURE).
 */

var candidaturesData = [];

function chargerCandidatures() {
  var cached = sessionStorage.getItem("oct_candidatures_cache");
  if (cached) return Promise.resolve(JSON.parse(cached));

  var session = typeof getSession === "function" ? getSession() : null;
  if (session && session.id) {
    return fetch("../api/candidatures.php?id_candidat=" + encodeURIComponent(session.id))
      .then(function (r) { return r.json(); });
  }

  return Promise.resolve([]);
}

chargerCandidatures().then(function (data) { candidaturesData = Array.isArray(data) ? data : []; });

function stepClass(stepIndex, statut) {
  // Ordre des etapes : 0 Soumission, 1 Examen, 2 Decision, 3 Resultat
  if (statut === "en_attente") {
    if (stepIndex <= 1) return "done";
    if (stepIndex === 2) return "active";
    return "";
  }
  if (statut === "validee") {
    if (stepIndex <= 2) return "done";
    return "done";
  }
  if (statut === "refusee") {
    if (stepIndex <= 2) return "refused";
    return "refused";
  }
  return "";
}

function renderResult(candidature) {
  var box = document.getElementById("suivi-result");

  if (!candidature) {
    box.innerHTML = '<div class="empty-state">Aucune candidature trouvee pour cette reference.</div>';
    box.style.display = "block";
    return;
  }

  var labels = ["Soumission", "Examen", "Decision", "Resultat"];
  var resultLabel = "En cours d'examen";
  if (candidature.statut === "validee") resultLabel = "Validee - affectation en cours";
  if (candidature.statut === "refusee") resultLabel = "Refusee";
  var offreTitre = candidature.offre_titre || candidature.titre || "Candidature";

  var stepsHtml = labels.map(function (label, i) {
    var cls = stepClass(i, candidature.statut);
    var displayLabel = i === 3 ? resultLabel : label;
    return (
      '<div class="step ' + cls + '">' +
        '<div class="step-line"></div>' +
        '<div class="step-circle">' + (i + 1) + "</div>" +
        '<div class="step-label">' + displayLabel + "</div>" +
      "</div>"
    );
  }).join("");

  box.innerHTML =
    '<div class="card" style="max-width:640px;">' +
      "<h3>" + offreTitre + "</h3>" +
      '<div class="card-meta">' +
        '<span class="ref">REF-' + candidature.id + "</span>" +
        "<span>&middot;</span>" +
        "<span>Soumise le " + formatDate(candidature.date_soumission || candidature.date_depot) + "</span>" +
      "</div>" +
      '<div class="stepper">' + stepsHtml + "</div>" +
    "</div>";
  box.style.display = "block";
}

document.getElementById("suivi-form").addEventListener("submit", function (e) {
  e.preventDefault();
  var ref = document.getElementById("reference").value.trim().replace(/^REF-/i, "");
  var found = candidaturesData.find(function (c) { return String(c.id) === ref; });
  renderResult(found);
});
