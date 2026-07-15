/*
 * dashboard.js
 * Calcule les statistiques a partir des donnees mock et les affiche.
 *
 * Migration BDD : remplacer les deux fetch ci-dessous par des requetes
 * d'agregation, par ex. SELECT statut, COUNT(*) FROM candidature GROUP BY
 * statut, exposees via une route /api/stats.php.
 */

fetch("http://localhost/oct-stage/api/stats.php")
  .then(function (r) { return r.json(); })
  .then(function (stats) {
    document.getElementById("stat-offres").textContent = stats.offres || 0;
    document.getElementById("stat-offres-ouvertes").textContent = stats.offres_ouvertes || 0;
    document.getElementById("stat-candidatures").textContent = stats.candidatures || 0;
    document.getElementById("stat-en-attente").textContent = stats.en_attente || 0;

    var bars = [
      { label: "En attente", value: stats.en_attente || 0, color: "#B5741E" },
      { label: "Validees", value: 0, color: "#3F8F5F" },
      { label: "Refusees", value: 0, color: "#C1443B" },
    ];

    var max = Math.max.apply(null, bars.map(function (b) { return b.value; })) || 1;

    document.getElementById("bars").innerHTML = bars.map(function (b) {
      var pct = Math.round((b.value / max) * 100);
      return (
        '<div class="bar-row">' +
          '<div class="bar-label">' + b.label + "</div>" +
          '<div class="bar-track"><div class="bar-fill" style="width:' + pct + "%;background:" + b.color + ';"></div></div>' +
          '<div class="bar-value">' + b.value + "</div>" +
        "</div>"
      );
    }).join("");
  });
