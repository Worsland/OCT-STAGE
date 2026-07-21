/*
 * candidature.js
 * Envoie la candidature vers la BDD via API PHP
 */
console.log("[candidature.js] version 3 chargée (dialogue systématique en cas d'erreur/doublon)");

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

// Affiche une boîte de dialogue modale (remplace window.alert pour un rendu plus clair)
function showDialog(options) {
  var overlay = document.createElement("div");
  overlay.className = "dialog-overlay";

  var actionsHtml = (options.actions || [{ label: "Fermer", primary: true }])
    .map(function (a, i) {
      return '<button type="button" class="btn ' + (a.primary ? "btn-secondary" : "btn-outline") + '" data-action="' + i + '">' + a.label + "</button>";
    })
    .join("");

  overlay.innerHTML =
    '<div class="dialog-box" role="dialog" aria-modal="true">' +
      '<div class="dialog-icon">!</div>' +
      "<h3>" + options.title + "</h3>" +
      "<p>" + options.message + "</p>" +
      '<div class="dialog-actions">' + actionsHtml + "</div>" +
    "</div>";

  document.body.appendChild(overlay);

  overlay.querySelectorAll("[data-action]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var action = (options.actions || [])[Number(btn.dataset.action)];
      overlay.remove();
      if (action && typeof action.onClick === "function") action.onClick();
    });
  });

  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) overlay.remove();
  });

  return overlay;
}

function dialogueDejaPostule() {
  showDialog({
    title: "Candidature déjà envoyée",
    message: "Vous avez déjà postulé à cette offre. Consultez \"Mes candidatures\" pour suivre son état.",
    actions: [
      { label: "Fermer" },
      { label: "Mes candidatures", primary: true, onClick: function () { window.location.href = "mes-candidatures.html"; } }
    ]
  });
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
  const submitBtn = document.querySelector("#candidature-form button[type=submit]");

  // On revérifie en temps réel (pas seulement via le cache local) pour éviter
  // toute course entre deux onglets/appareils, puis on affiche un dialogue clair.
  if (submitBtn) submitBtn.disabled = true;
  chargerOffresDejaPostulees().then(function () {
    if (offresDejaPostulees.indexOf(offreId) !== -1) {
      if (submitBtn) submitBtn.disabled = false;
      vérifierDoublon();
      dialogueDejaPostule();
      return;
    }
    if (submitBtn) submitBtn.disabled = false;
    envoyerCandidature();
  });
});

function envoyerCandidature() {
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
 .then(res => res.json().then(data => ({ status: res.status, data: data })))
 .then(async ({ status, data }) => {
  if (!data.success) {
    var estDoublon = status === 409 || (data.error && data.error.toLowerCase().indexOf("déjà") !== -1);

    alertBox.className = "alert alert-danger show";
    alertBox.textContent = data.error || "Impossible d'envoyer la candidature. Veuillez réessayer.";

    if (estDoublon) {
      chargerOffresDejaPostulees().then(vérifierDoublon);
      dialogueDejaPostule();
    } else {
      showDialog({
        title: "Envoi impossible",
        message: data.error || "Une erreur est survenue lors de l'envoi de votre candidature. Veuillez réessayer.",
        actions: [{ label: "Fermer", primary: true }]
      });
    }
    return;
  }
  if (data.success) {
    alertBox.className = "alert alert-success show";
    alertBox.textContent = `Candidature envoyée! Référence : ${data.reference}`;

    try {
      const result = await envoyerEmail({
        to_email: session.email,
        to_name: session.prenom + " " + session.nom,
        subject: "Confirmation de votre candidature - " + data.reference,
        message: "Nous avons bien reçu votre candidature. Référence : " + data.reference,
        verification_link: window.location.origin + "/candidat/suivi.html?reference=" + encodeURIComponent(data.reference),
        reference: data.reference
      });
      console.log('✅ EmailJS OK:', result);
      alertBox.textContent = `Candidature envoyée! Référence : ${data.reference} - Email envoyé ✅`;

    } catch (err) {
      console.error('❌ ERREUR EmailJS:', err);
      console.error('Détail:', err.text || err.message || JSON.stringify(err));
      console.error('Params envoyés:', {
        service: EMAILJS_SERVICE_ID,
        template: EMAILJS_TEMPLATE_ID,
        key: EMAILJS_PUBLIC_KEY
      });
      
      alertBox.textContent = `Candidature envoyée! Réf: ${data.reference} mais email échoué: ${err.text || err.message}`;
      alertBox.className = "alert alert-warning show";
    }

    setTimeout(() => window.location.href = 'mes-candidatures.html', 2500);
  }
})
.catch(err => {
  console.error('❌ Erreur réseau / API:', err);
  alertBox.className = "alert alert-danger show";
  alertBox.textContent = 'Erreur réseau : ' + err.message;
  showDialog({
    title: "Erreur réseau",
    message: "Impossible de contacter le serveur (" + err.message + "). Vérifiez votre connexion et réessayez.",
    actions: [{ label: "Fermer", primary: true }]
  });
});
}