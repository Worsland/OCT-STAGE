/*
 * admin-candidatures.js
 * Affiche la table des candidatures. Le detail (CV, lettre, description)
 * est consulte sur candidature-detail.html. Valider/Refuser declenchent
 * un email automatique simule (voir auth.js -> simulerEnvoiEmail).
 *
 * Migration BDD :
 * - Le fetch initial doit pointer vers /api/candidatures.php.
 * - "Valider" / "Refuser" doivent executer un UPDATE candidature SET
 *   statut = ... puis, si validee, un INSERT dans CONVENTION, et dans
 *   tous les cas un INSERT dans NOTIFICATION (canal = 'email') avant
 *   l'envoi reel du message via le service de mail choisi.
 */

var candidaturesLocal = [];

function renderCandidaturesTable() {
  var tbody = document.getElementById("candidatures-tbody");

  if (candidaturesLocal.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Aucune candidature recue.</td></tr>';
    return;
  }

  tbody.innerHTML = candidaturesLocal.map(function (c) {
    var actions =
      '<a class="btn btn-outline btn-sm" href="candidature-detail.html?id=' + c.id + '">Voir</a>';
    if (c.statut === "en_attente") {
      actions +=
        '<button class="btn btn-success-outline btn-sm" type="button" onclick="changerStatut(' + c.id + ',\'validee\')">Valider</button>' +
        '<button class="btn btn-danger-outline btn-sm" type="button" onclick="changerStatut(' + c.id + ',\'refusee\')">Refuser</button>';
    }

    return (
      "<tr>" +
        '<td><span class="ref">REF-' + c.id + "</span></td>" +
        "<td>" + c.candidat_nom + "</td>" +
        "<td>" + c.offre_titre + "</td>" +
        "<td>" + formatDate(c.date_soumission) + "</td>" +
        "<td>" + statutCandidatureBadge(c.statut) + "</td>" +
        '<td class="cell-actions">' + actions + "</td>" +
      "</tr>"
    );
  }).join("");
}

function persistLocal() {
  sessionStorage.setItem("oct_candidatures_cache", JSON.stringify(candidaturesLocal));
}

function changerStatut(id, statut) {
  var candidature = candidaturesLocal.find(function (c) { return c.id === id; });
  if (!candidature) return;

  fetch("../api/admin/update-statut.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: id, statut: statut })
  })
  .then(function (res) { return res.json().then(function (data) {
      if (!res.ok || data.error) throw new Error(data.error || "Erreur serveur");
      return data;
  })})
  .then(function () {
      candidature.statut = statut;
      
      // --- ENVOI EMAILJS REEL ---
      var sujet, message;
      if (statut === "validee") {
        sujet = "Votre candidature a été validée - OCT";
        message = "Félicitations " + candidature.candidat_nom + ", votre candidature pour « " + candidature.offre_titre + " » a été validée. La convention de stage va être générée.";
      } else {
        sujet = "Réponse à votre candidature - OCT";
        message = "Merci " + candidature.candidat_nom + ", pour votre candidature à « " + candidature.offre_titre + " ». Après examen, nous ne pourrons pas y donner suite cette fois-ci.";
      }

      return envoyerEmail({
        to_email: candidature.candidat_email,
        to_name: candidature.candidat_nom,
        subject: sujet,
        message: message,
        verification_link: "https://stages.oct.nat.tn/suivi.html" // lien vers suivi
      });
  })
  .then(function(result) {
      if(result && result.skipped) console.warn("EmailJS non configuré");
      persistLocal();
      renderCandidaturesTable();
      if(typeof showToast === "function") showToast("Statut mis à jour + email envoyé");
  })
  .catch(function (err) {
      alert("Echec : " + err.message);
  });
}

fetch("http://localhost/oct-stage/api/admin/candidatures.php")
  .then(function (res) { return res.json(); })
  .then(function (data) {
    candidaturesLocal = Array.isArray(data) ? data : [];
    persistLocal();
    renderCandidaturesTable();
  })
  .catch(function () {
    candidaturesLocal = [];
    persistLocal();
    renderCandidaturesTable();
  });
fetch("../api/notifications.php").catch(function () {});