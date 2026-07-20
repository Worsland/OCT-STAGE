/*
 * suivi.js
 * Recherche une candidature par reference et affiche son etat dans le stepper.
 * La recherche se fait cote serveur via api/candidature/search.php,
 * ce qui permet de suivre une candidature meme sans etre connecte.
 */

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
        '<span class="ref">' + candidature.reference + "</span>" +
        "<span>&middot;</span>" +
        "<span>Soumise le " + formatDate(candidature.date_soumission || candidature.date_depot) + "</span>" +
      "</div>" +
      '<div class="stepper">' + stepsHtml + "</div>" +
    "</div>";
  box.style.display = "block";
}

function rechercherCandidature(reference) {
  var box = document.getElementById("suivi-result");
  box.innerHTML = '<div class="empty-state">Recherche en cours...</div>';
  box.style.display = "block";

  fetch("../api/candidature/search.php?reference=" + encodeURIComponent(reference))
    .then(function (res) {
      if (!res.ok) return null;
      return res.json();
    })
    .then(renderResult)
    .catch(function () { renderResult(null); });
}

document.getElementById("suivi-form").addEventListener("submit", function (e) {
  e.preventDefault();
  var ref = document.getElementById("reference").value.trim();
  if (!ref) return;
  rechercherCandidature(ref);
});

// Pre-remplit et lance la recherche si la reference est passee dans l'URL
// (ex: lien recu par email apres depot de candidature : suivi.html?reference=CAND-...)
(function () {
  var params = new URLSearchParams(window.location.search);
  var refFromUrl = params.get("reference");
  if (refFromUrl) {
    document.getElementById("reference").value = refFromUrl;
    rechercherCandidature(refFromUrl);
  }
})();