/*
 * admin-stagiaires.js
 * Liste les candidatures validees (= stagiaires), du debut de stage le
 * plus recent au moins recent, et permet a l'admin d'envoyer le fichier
 * d'evaluation de stage de chaque stagiaire.
 */

var stagiairesData = [];
var currentEvalCandidatureId = null;

function renderStagiairesTable() {
  var tbody = document.getElementById("stagiaires-tbody");

  if (stagiairesData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Aucun stagiaire pour le moment.</td></tr>';
    return;
  }

  tbody.innerHTML = stagiairesData.map(function (s) {
    var evalCell = s.eval_nom_fichier
      ? '<a class="btn btn-outline btn-sm" href="../api/evaluation/download.php?id=' + s.id + '&admin_access=1" target="_blank" rel="noopener">Voir</a> ' +
        '<button class="btn btn-outline btn-sm" type="button" onclick="declencherUploadEval(' + s.id + ')">Remplacer</button>'
      : '<button class="btn btn-primary btn-sm" type="button" onclick="declencherUploadEval(' + s.id + ')">Envoyer</button>';

    return (
      "<tr>" +
        "<td>" + (s.candidat_nom || "") + "</td>" +
        "<td>" + formatDate(s.date_debut_stage || s.date_soumission) + "</td>" +
        "<td>" + (s.duree_semaines || "-") + " semaines</td>" +
        "<td>" + (s.domaine || s.offre_titre || "") + "</td>" +
        "<td>" + (s.service_affecte || "-") + "</td>" +
        '<td class="cell-actions" id="eval-cell-' + s.id + '">' + evalCell + "</td>" +
        '<td><a class="btn btn-outline btn-sm" href="candidature-detail.html?id=' + s.id + '">Voir le dossier</a></td>' +
      "</tr>"
    );
  }).join("");
}

function declencherUploadEval(id) {
  currentEvalCandidatureId = id;
  document.getElementById("eval-file-input").click();
}

function uploaderEvaluation(file) {
  if (!currentEvalCandidatureId || !file) return;

  var extension = file.name.split(".").pop().toLowerCase();
  if (["pdf", "doc", "docx"].indexOf(extension) === -1) {
    if (typeof showToast === "function") showToast("Formats acceptes : PDF, DOC, DOCX.");
    return;
  }

  var idCandidature = currentEvalCandidatureId;
  var cell = document.getElementById("eval-cell-" + idCandidature);
  if (cell) cell.innerHTML = "Envoi...";

  var formData = new FormData();
  formData.append("id", idCandidature);
  formData.append("fichier", file);

  fetch("../api/evaluation/upload.php", {
    method: "POST",
    body: formData,
    headers: { "X-Admin-Session": "1" }
  })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (!data.success) {
        if (typeof showToast === "function") showToast(data.error || "Impossible d'envoyer l'evaluation.");
        renderStagiairesTable();
        return;
      }

      if (typeof showToast === "function") showToast("Evaluation envoyee au stagiaire.");

      var item = stagiairesData.find(function (s) { return s.id === idCandidature; });
      if (item) {
        item.eval_nom_fichier = file.name;
        item.eval_date_upload = new Date().toISOString();

        if (item.candidat_email && typeof envoyerEmail === "function") {
          envoyerEmail({
            to_email: item.candidat_email,
            to_name: item.candidat_nom || "",
            subject: "Votre evaluation de stage est disponible",
            message: "Votre evaluation de stage pour « " + (item.offre_titre || "") + " » a ete publiee. Connectez-vous a votre espace candidat pour la consulter.",
          }).catch(function (err) {
            console.error("Envoi EmailJS echoue :", err);
          });
        }
      }
      renderStagiairesTable();
    })
    .catch(function () {
      if (typeof showToast === "function") showToast("Erreur reseau lors de l'envoi de l'evaluation.");
      renderStagiairesTable();
    });
}

document.addEventListener("DOMContentLoaded", function () {
  var fileInput = document.getElementById("eval-file-input");
  if (fileInput) {
    fileInput.addEventListener("change", function () {
      if (this.files && this.files[0]) {
        uploaderEvaluation(this.files[0]);
      }
      this.value = "";
    });
  }
});

fetch("http://localhost/oct-stage/api/admin/candidatures.php", {
  headers: {
    'X-Admin-Session': '1'
  }
})
  .then(function (res) { return res.json(); })
  .then(function (candidatures) {
    stagiairesData = Array.isArray(candidatures) ? candidatures
      .filter(function (c) { return c.statut === "validee"; })
      .sort(function (a, b) { return new Date(b.date_debut_stage || b.date_soumission) - new Date(a.date_debut_stage || a.date_soumission); }) : [];

    renderStagiairesTable();
  });