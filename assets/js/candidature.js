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

// IDs des offres auxquelles le candidat connecte a deja postule.
var offresDejaPostulees = [];

function chargerOffresDejaPostulees() {
  return fetch('../api/candidatures.php?id_candidat=' + encodeURIComponent(session.id))
    .then(res => res.ok ? res.json() : [])
    .then(candidatures => {
      offresDejaPostulees = (Array.isArray(candidatures) ? candidatures : [])
        .map(c => String(c.id_offre));
    })
    .catch(() => { offresDejaPostulees = []; });
}

// Affiche un avertissement et desactive l'envoi si l'offre selectionnee a deja
// fait l'objet d'une candidature de la part de ce candidat.
function vérifierDoublon() {
  var select = document.getElementById("offre_id");
  var alertBox = document.getElementById("form-alert");
  var submitBtn = document.querySelector("#candidature-form button[type=submit]");
  var dejaPostule = offresDejaPostulees.indexOf(select.value) !== -1;

  if (dejaPostule) {
    alertBox.className = "alert alert-danger show";
    alertBox.textContent = "Vous avez deja postule a cette offre. Consultez \"Mes candidatures\" pour suivre son etat.";
    if (submitBtn) submitBtn.disabled = true;
  } else {
    if (alertBox.classList.contains("alert-danger")) {
      alertBox.className = "alert";
      alertBox.textContent = "";
    }
    if (submitBtn) submitBtn.disabled = false;
  }
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
          var selected = String(o.id) === preselect ? " selected" : "";
          return `<option value="${o.id}"${selected}>${o.titre} - ${o.entreprise || o.service}</option>`;
        }).join("");

      chargerOffresDejaPostulees().then(vérifierDoublon);
      select.addEventListener("change", vérifierDoublon);
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

  const offreId = document.getElementById('offre_id').value;
  if (offresDejaPostulees.indexOf(offreId) !== -1) {
    const alertBox = document.getElementById("form-alert");
    alertBox.className = "alert alert-danger show";
    alertBox.textContent = "Vous avez deja postule a cette offre. Consultez \"Mes candidatures\" pour suivre son etat.";
    return;
  }

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
      if (typeof envoyerEmail === "function") {
        envoyerEmail({
          to_email: session.email,
          to_name: session.prenom + " " + session.nom,
          subject: "Confirmation de votre candidature - " + data.reference,
          message: "Nous avons bien recu votre candidature. Votre reference de suivi est : " + data.reference + ". Conservez-la pour suivre l'evolution de votre candidature.",
          verification_link: window.location.origin + "/candidat/suivi.html?reference=" + encodeURIComponent(data.reference)
        }).catch(function () {
          // L'email est un bonus : un echec d'envoi ne doit pas bloquer
          // la candidature, deja enregistree en base a ce stade.
        });
      }
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