/*
 * admin-rapports.js
 * Liste tous les rapports de stage (valides ou non) et permet a
 * l'administration de les valider ou de les refuser.
 *
 * Migration BDD :
 * - Le fetch initial doit pointer vers /api/rapports.php
 *   (SELECT * FROM rapport_stage JOIN candidature ...).
 * - "Valider" / "Refuser" doivent executer un UPDATE rapport_stage SET
 *   statut = ..., date_traitement = NOW() WHERE id = :id, puis inserer
 *   une ligne dans NOTIFICATION (canal = 'email') pour informer le
 *   stagiaire (voir simulerEnvoiEmail dans auth.js pour le prototype).
 */

var rapportsLocal = [];

function renderRapportsTable() {
  var tbody = document.getElementById("rapports-tbody");

  if (rapportsLocal.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Aucun rapport depose.</td></tr>';
    return;
  }

  var tries = rapportsLocal.slice().sort(function (a, b) { return new Date(b.date_depot) - new Date(a.date_depot); });

  tbody.innerHTML = tries.map(function (r) {
    var actions = '<a class="btn btn-outline btn-sm" href="../api/rapport/download.php?id=' + r.id + '" target="_blank" rel="noopener">Voir le fichier</a>';
    if (r.statut === "en_attente") {
      actions +=
        '<button class="btn btn-success-outline btn-sm" type="button" onclick="changerStatutRapport(' + r.id + ',\'valide\')">Valider</button>' +
        '<button class="btn btn-danger-outline btn-sm" type="button" onclick="changerStatutRapport(' + r.id + ',\'refuse\')">Refuser</button>';
    }

    return (
      "<tr>" +
        "<td>" + r.stagiaire_nom + "</td>" +
        "<td>" + r.titre + "</td>" +
        "<td>" + r.domaine + "</td>" +
        "<td>" + formatDate(r.date_depot) + "</td>" +
        "<td>" + statutRapportBadge(r.statut) + "</td>" +
        '<td class="cell-actions">' + actions + "</td>" +
      "</tr>"
    );
  }).join("");
}

function changerStatutRapport(id, statut) {
  var rapport = rapportsLocal.find(function (r) { return r.id === id; });
  if (!rapport) return;

  var formData = new FormData();
  formData.append('id', id);
  formData.append('statut', statut);

  fetch('../api/rapport/validate.php', {
    method: 'POST',
    body: formData,
    headers: {
      'X-Admin-Session': '1'
    }
  })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (!data.success) {
        if (typeof showToast === 'function') {
          showToast(data.error || 'Impossible de mettre à jour le statut du rapport.');
        }
        return;
      }
      rapport.statut = statut;
      renderRapportsTable();
      if (typeof showToast === 'function') {
        showToast('Statut du rapport mis à jour.');
      }

      if (rapport.email && typeof envoyerEmail === 'function') {
        var estValide = statut === 'valide';
        envoyerEmail({
          to_email: rapport.email,
          to_name: rapport.stagiaire_nom || '',
          subject: estValide ? 'Votre rapport de stage a été validé' : 'Votre rapport de stage a été refusé',
          message: estValide
            ? 'Votre rapport de stage a été validé. Vous pouvez consulter la mise à jour dans votre espace candidat.'
            : 'Votre rapport de stage a été refusé. Merci de contacter l’équipe informatique pour les corrections.',
        }).catch(function (err) {
          console.error('Envoi EmailJS echoue :', err);
        });
      }
    })
    .catch(function () {
      if (typeof showToast === 'function') {
        showToast('Erreur réseau lors de la validation du rapport.');
      }
    });
}

fetch("http://localhost/oct-stage/api/rapport/list.php", {
  headers: {
    'X-Admin-Session': '1'
  }
})
  .then(function (res) { return res.json(); })
  .then(function (data) {
    rapportsLocal = Array.isArray(data) ? data : [];
    renderRapportsTable();
  })
  .catch(function () {
    rapportsLocal = [];
    renderRapportsTable();
  });