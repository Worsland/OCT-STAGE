/*
 * main.js
 * Comportements partages a toutes les pages : menu mobile + helpers.
 * Les helpers de formatage/badges sont reutilises par offres.js, suivi.js,
 * dashboard.js, admin-offres.js et admin-candidatures.js.
 */

function initNav() {
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (!toggle || !links) return;
  toggle.addEventListener("click", function () {
    links.classList.toggle("open");
  });
  if (typeof updateAuthNav === "function") {
    updateAuthNav();
  }
}

/* Formate une date ISO (YYYY-MM-DD ou YYYY-MM-DD HH:MM:SS) en format lisible FR */
function formatDate(iso) {
  if (!iso) return "-";
  var datePart = String(iso).split(/[ T]/)[0];
  var d = new Date(datePart + "T00:00:00");
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}
/* Renvoie le HTML d'un badge de statut de candidature */
function statutCandidatureBadge(statut) {
  var map = {
    en_attente: { cls: "badge-pending", label: "En attente" },
    validee: { cls: "badge-validated", label: "Validee" },
    refusee: { cls: "badge-refused", label: "Refusee" },
  };
  var s = map[statut] || { cls: "badge-pending", label: statut };
  return '<span class="badge ' + s.cls + '">' + s.label + "</span>";
}

/* Renvoie le HTML d'un badge de statut d'offre */
function statutOffreBadge(statut) {
  return statut === "ouverte"
    ? '<span class="badge badge-open">Ouverte</span>'
    : '<span class="badge badge-closed">Fermee</span>';
}

/* Renvoie le HTML d'un badge de statut de rapport de stage */
function statutRapportBadge(statut) {
  var map = {
    en_attente: { cls: "badge-pending", label: "En attente" },
    valide: { cls: "badge-validated", label: "Valide" },
    refuse: { cls: "badge-refused", label: "Refuse" },
  };
  var s = map[statut] || { cls: "badge-pending", label: statut };
  return '<span class="badge ' + s.cls + '">' + s.label + "</span>";
}

document.addEventListener("DOMContentLoaded", initNav);
