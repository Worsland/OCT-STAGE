/*
 * candidature.js
 * Envoie la candidature vers la BDD via API PHP
 */

var session = requireAuth("candidature.html");
if (!session) {
  throw new Error("Utilisateur non authentifié");
}

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// Charge les offres depuis la BDD
function fillOffreSelect() {
  fetch('http://localhost/oct-stage/api/offres.php')
   .then(res => res.json())
   .then(offres => {
      var select = document.getElementById("offre_id");
      var preselect = getQueryParam("offre_id") || getQueryParam("id");
      var ouvertes = offres.filter(o => o.statut === "ouverte");

      select.innerHTML = '<option value="">Choisir une offre...</option>' +
        ouvertes.map(o => {
          var selected = String(o.id_offre) === preselect? " selected" : "";
          return `<option value="${o.id_offre}"${selected}>${o.titre} - ${o.entreprise}</option>`;
        }).join("");
    });
}

// Pré-remplir avec la session
function prefillFromSession() {
  if (!session) return;
  document.getElementById("nom").value = session.nom || "";
  document.getElementById("prenom").value = session.prenom || "";
  document.getElementById("email").value = session.email || "";
  document.getElementById("telephone").value = session.telephone || "";
  document.getElementById("etablissement").value = session.etablissement || "";

  var pill = document.getElementById("session-pill");
  if (pill) {
    pill.textContent = `Connecté : ${session.prenom} ${session.nom}`;
    pill.style.display = "inline-flex";
  }
}

// Init
fillOffreSelect();
prefillFromSession();

// Submit du formulaire vers l'API
document.getElementById("candidature-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const formData = new FormData();
  formData.append('id_offre', document.getElementById('offre_id').value);
  formData.append('id_candidat', session.id); // depuis requireAuth

  const cvFile = document.getElementById('cv').files[0];
  if (cvFile) formData.append('cv', cvFile);

  const lettreFile = document.getElementById('lettre_motivation').files[0];
  if (lettreFile) formData.append('lettre_motivation', lettreFile);

  const alertBox = document.getElementById("form-alert");
  alertBox.className = "alert alert-info show";
  alertBox.textContent = "Envoi en cours...";

  fetch('http://localhost/oct-stage/api/candidature/create.php', {
    method: 'POST',
    body: formData
  })
 .then(res => res.json())
 .then(data => {
    if (data.success) {
      alertBox.className = "alert alert-success show";
      alertBox.textContent = `Candidature envoyée! Référence : ${data.reference}`;
      e.target.reset();
      prefillFromSession();
      setTimeout(() => window.location.href = 'mes-candidatures.html', 2000);
    } else {
      alertBox.className = "alert alert-danger show";
      alertBox.textContent = 'Erreur: ' + data.error;
    }
  })
 .catch(err => {
    alertBox.className = "alert alert-danger show";
    alertBox.textContent = 'Erreur réseau : ' + err;
  });
});