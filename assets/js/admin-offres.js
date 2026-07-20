/*
 * admin-offres.js - Version avec calcul automatique date_fin
 * Logique: date_fin = date_debut + (duree_semaines * 7 jours)
 */

var offresLocal = [];

// Fonction utilitaire pour formater une date YYYY-MM-DD
function formatDateISO(date) {
  return date.toISOString().split('T')[0];
}

function formatDateFR(dateStr) {
  if (!dateStr) return '-';
  var d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR');
}

// Calcul automatique de la date de fin
function calculerDateFin() {
  var debutVal = document.getElementById("new-date-debut").value;
  var dureeVal = parseInt(document.getElementById("new-duree").value, 10);
  var finInput = document.getElementById("new-date-fin");
  var helpText = document.getElementById("date-fin-help");

  if (!debutVal || !dureeVal || isNaN(dureeVal)) {
    finInput.value = "";
    if (helpText) helpText.textContent = "Sélectionnez une date de début et une durée";
    return null;
  }

  var dateDebut = new Date(debutVal);
  var dateFin = new Date(dateDebut);
  // On ajoute duree * 7 jours. On soustrait 1 jour pour que 1 semaine = 7j inclusifs
  // Ex: debut Lundi 01 -> 1 sem -> fin Dimanche 07
  dateFin.setDate(dateDebut.getDate() + (dureeVal * 7) - 1);

  var dateFinISO = formatDateISO(dateFin);
  finInput.value = dateFinISO;

  if (helpText) {
    helpText.textContent = "Du " + formatDateFR(debutVal) + " au " + formatDateFR(dateFinISO) + " (" + dureeVal + " sem.)";
  }

  return dateFinISO;
}

function renderOffresTable() {
  var tbody = document.getElementById("offres-tbody");

  if (offresLocal.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Aucune offre enregistrée.</td></tr>';
    return;
  }

  tbody.innerHTML = offresLocal.map(function (o) {
    var periode = "-";
    if (o.date_debut) {
      periode = formatDateFR(o.date_debut);
      if (o.date_fin) {
        periode += " → " + formatDateFR(o.date_fin);
      }
    }

    return (
      "<tr>" +
        '<td><span class="ref">OFF-' + o.id + "</span></td>" +
        "<td>" + o.titre + "</td>" +
        "<td>" + o.service + "</td>" +
        "<td>" + (o.duree_semaines || 0) + " sem.</td>" +
        "<td><small>" + periode + "</small></td>" +
        "<td>" + statutOffreBadge(o.statut) + "</td>" +
        '<td class="cell-actions">' +
          '<button class="btn btn-outline btn-sm" type="button" onclick="alert(\'Formulaire de modification à brancher sur la BDD.\')">Modifier</button>' +
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

// Initial fetch
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

// Listeners pour calcul auto
document.addEventListener("DOMContentLoaded", function() {
  var debutInput = document.getElementById("new-date-debut");
  var dureeInput = document.getElementById("new-duree");

  if (debutInput) debutInput.addEventListener("change", calculerDateFin);
  if (dureeInput) {
    dureeInput.addEventListener("input", calculerDateFin);
    dureeInput.addEventListener("change", calculerDateFin);
  }
});

// Fallback si DOM déjà chargé
(function attachListeners() {
  var debutInput = document.getElementById("new-date-debut");
  var dureeInput = document.getElementById("new-duree");
  if (debutInput && !debutInput.dataset.listener) {
    debutInput.addEventListener("change", calculerDateFin);
    debutInput.dataset.listener = "1";
  }
  if (dureeInput && !dureeInput.dataset.listener) {
    dureeInput.addEventListener("input", calculerDateFin);
    dureeInput.addEventListener("change", calculerDateFin);
    dureeInput.dataset.listener = "1";
  }
})();

document.getElementById("nouvelle-offre-form").addEventListener("submit", function (e) {
  e.preventDefault();
  var titre = document.getElementById("new-titre").value.trim();
  var service = document.getElementById("new-service").value.trim();
  var duree = parseInt(document.getElementById("new-duree").value, 10) || 1;
  var dateDebut = document.getElementById("new-date-debut").value;
  var dateFin = calculerDateFin(); // Recalcule au moment du submit

  if (!titre || !service || !dateDebut) {
    alert("Veuillez remplir l'intitulé, le service et la date de début.");
    return;
  }

  if (!dateFin) {
    alert("Impossible de calculer la date de fin.");
    return;
  }

  var payload = new URLSearchParams({
    titre: titre,
    service: service,
    description: "",
    domaine: "",
    duree_semaines: duree,
    date_debut: dateDebut,
    date_fin: dateFin,
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
      document.getElementById("new-date-fin").value = "";
      document.getElementById("date-fin-help").textContent = "Calculée automatiquement";
      document.getElementById("new-offre-panel").classList.remove("show-panel");
    })
    .catch(function () {
      e.target.reset();
      document.getElementById("new-offre-panel").classList.remove("show-panel");
    });
});